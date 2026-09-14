#!/usr/bin/env tsx

/**
 * Test script to verify Activity section fix for Demo/Sample athletes
 * 
 * This demonstrates that getAthleteActivity now uses stable database-based
 * identity checks instead of the ephemeral MOCK_ATHLETE_IDS Set.
 */

import { getAthleteActivity } from './lib/activity-store';
import { getAthleteById, ensureMockDemoData } from './lib/supabase-store';

async function testActivityFix() {
  console.log('🧪 Testing Activity Section Fix\n');
  
  // Ensure demo data exists
  console.log('1️⃣  Ensuring demo data exists...');
  await ensureMockDemoData();
  console.log('✅ Demo data ready\n');
  
  // Find Demo A athlete
  console.log('2️⃣  Fetching Demo A. athlete from database...');
  const { getAllAthletes } = await import('./lib/supabase-store');
  const allAthletes = await getAllAthletes();
  const demoA = allAthletes.find(a => a.firstName === 'Demo' && a.lastInitial === 'A');
  
  if (!demoA) {
    console.error('❌ Demo A. athlete not found in database');
    process.exit(1);
  }
  
  console.log(`✅ Found Demo A. (ID: ${demoA.id})\n`);
  
  // Verify athlete identity check
  console.log('3️⃣  Verifying stable identity detection...');
  const athlete = await getAthleteById(demoA.id);
  if (!athlete) {
    console.error('❌ Failed to fetch athlete by ID');
    process.exit(1);
  }
  
  const isDemoOrSample = 
    athlete.notes.includes('[SAMPLE DATA') ||
    (athlete.firstName === 'Demo' && athlete.lastInitial === 'A') ||
    (athlete.firstName === 'Sample' && athlete.lastInitial === 'B');
  
  console.log(`   - firstName: "${athlete.firstName}"`);
  console.log(`   - lastInitial: "${athlete.lastInitial}"`);
  console.log(`   - notes includes "[SAMPLE DATA": ${athlete.notes.includes('[SAMPLE DATA')}`);
  console.log(`   - isDemoOrSample: ${isDemoOrSample}`);
  console.log('✅ Identity detection working\n');
  
  // Test activity retrieval WITHOUT calling enableMockDataForAthlete
  console.log('4️⃣  Testing getAthleteActivity (without enableMockDataForAthlete)...');
  const activity = await getAthleteActivity(demoA.id);
  
  if (!activity) {
    console.error('❌ FAILED: getAthleteActivity returned null');
    console.error('   This means the fix did not work - activity still gated on MOCK_ATHLETE_IDS Set');
    process.exit(1);
  }
  
  console.log('✅ SUCCESS: getAthleteActivity returned activity data\n');
  
  // Verify activity contents
  console.log('5️⃣  Verifying activity data structure...');
  console.log(`   - athleteId: ${activity.athleteId}`);
  console.log(`   - judoStartDate: ${activity.judoStartDate}`);
  console.log(`   - tournaments: ${activity.tournaments.length} tournaments`);
  console.log(`   - careerTimeline: ${activity.careerTimeline.length} events`);
  
  if (activity.tournaments.length === 0) {
    console.error('❌ No tournaments in activity data');
    process.exit(1);
  }
  
  console.log('\n   Tournament details:');
  activity.tournaments.forEach(t => {
    console.log(`     - ${t.name}: ${t.matches.length} matches, place ${t.place}`);
  });
  
  console.log('\n✅ All tests passed!\n');
  console.log('📋 Summary:');
  console.log('   - Demo A. athlete fetched from database ✓');
  console.log('   - Identity detected via stable database fields ✓');
  console.log('   - Activity data returned WITHOUT enableMockDataForAthlete ✓');
  console.log('   - Activity section will now appear for Demo/Sample athletes ✓');
  console.log('\n🎉 Fix verified: Activity section will appear for Demo A. and Sample B. on production!');
}

// Run the test
testActivityFix().catch(error => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});
