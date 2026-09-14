-- Family Login v1 - RLS Policy Verification Checklist
-- Run these checks after migration is applied to production

-- Setup test data (run as admin)
-- Replace these with actual test values in production:
-- @coach_email: an email from coach_allowlist
-- @family_email: a family email invited for athlete_id = @test_athlete_id
-- @test_athlete_id: an athlete ID that has family access
-- @other_athlete_id: a different athlete ID (no family access for @family_email)

-- ============================================
-- TEST 1: Coach can access all athletes
-- ============================================
-- Expected: Returns all athletes (no RLS restriction)
-- Run as: @coach_email logged in
-- SELECT COUNT(*) FROM athletes;
-- Expected result: All athletes count (e.g., 20+)

-- ============================================
-- TEST 2: Family can ONLY access their linked athlete
-- ============================================
-- Expected: Returns ONLY the linked athlete
-- Run as: @family_email logged in
-- SELECT id, first_name, last_initial FROM athletes WHERE id = '@test_athlete_id';
-- Expected result: 1 row

-- Expected: Returns ZERO rows (blocked by RLS)
-- Run as: @family_email logged in
-- SELECT id, first_name, last_initial FROM athletes WHERE id = '@other_athlete_id';
-- Expected result: 0 rows

-- ============================================
-- TEST 3: Family can access opponent_notes for their athlete
-- ============================================
-- Expected: Returns opponent notes for linked athlete
-- Run as: @family_email logged in
-- SELECT COUNT(*) FROM opponent_notes WHERE athlete_id = '@test_athlete_id';
-- Expected result: >= 0 (can see notes)

-- Expected: Returns ZERO rows (blocked by RLS)
-- Run as: @family_email logged in
-- SELECT COUNT(*) FROM opponent_notes WHERE athlete_id = '@other_athlete_id';
-- Expected result: 0 rows

-- ============================================
-- TEST 4: Family CANNOT access opponents directory
-- ============================================
-- Expected: Returns ZERO rows (coach-only table)
-- Run as: @family_email logged in
-- SELECT COUNT(*) FROM opponents;
-- Expected result: 0 rows (or RLS error)

-- ============================================
-- TEST 5: Family CANNOT access tournament_days
-- ============================================
-- Expected: Returns ZERO rows (coach-only)
-- Run as: @family_email logged in
-- SELECT COUNT(*) FROM tournament_days;
-- Expected result: 0 rows (or RLS error)

-- ============================================
-- TEST 6: Family CANNOT access coach_allowlist
-- ============================================
-- Expected: Returns ZERO rows (admin-only)
-- Run as: @family_email logged in
-- SELECT COUNT(*) FROM coach_allowlist;
-- Expected result: 0 rows (or RLS error)

-- ============================================
-- TEST 7: Uninvited user has NO access
-- ============================================
-- Expected: Returns ZERO rows for all tables
-- Run as: @uninvited_email (not in coach_allowlist or family_access)
-- SELECT COUNT(*) FROM athletes;
-- Expected result: 0 rows

-- ============================================
-- TEST 8: Helper function is_family_for_athlete works
-- ============================================
-- Run as: @family_email logged in
-- SELECT is_family_for_athlete('@test_athlete_id'::uuid);
-- Expected result: true

-- Run as: @family_email logged in
-- SELECT is_family_for_athlete('@other_athlete_id'::uuid);
-- Expected result: false

-- Run as: @coach_email logged in
-- SELECT is_family_for_athlete('@test_athlete_id'::uuid);
-- Expected result: false (coaches are not family)

-- ============================================
-- TEST 9: Helper function can_access_athlete works
-- ============================================
-- Run as: @coach_email logged in
-- SELECT can_access_athlete('@test_athlete_id'::uuid);
-- Expected result: true (coach has broad access)

-- Run as: @family_email logged in
-- SELECT can_access_athlete('@test_athlete_id'::uuid);
-- Expected result: true (family can access their athlete)

-- Run as: @family_email logged in
-- SELECT can_access_athlete('@other_athlete_id'::uuid);
-- Expected result: false (family cannot access other athletes)

-- ============================================
-- SUMMARY
-- ============================================
-- ✅ TEST 1: Coach has full roster access
-- ✅ TEST 2: Family sees ONLY linked athlete
-- ✅ TEST 3: Family sees opponent_notes for linked athlete only
-- ✅ TEST 4: Family CANNOT see opponents directory
-- ✅ TEST 5: Family CANNOT see tournament_days
-- ✅ TEST 6: Family CANNOT see coach_allowlist
-- ✅ TEST 7: Uninvited user has zero access
-- ✅ TEST 8: is_family_for_athlete helper works correctly
-- ✅ TEST 9: can_access_athlete helper works correctly

-- If all tests pass: RLS is correctly enforcing family access boundaries.
-- Coaches retain full access, family is scoped to linked athletes only.
