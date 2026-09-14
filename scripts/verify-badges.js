#!/usr/bin/env node

/**
 * Badge Verification Script
 * 
 * Tests that badge SVG assets exist and badge system is wired correctly.
 */

const fs = require('fs');
const path = require('path');

console.log('🏅 Badge System Verification\n');

const expectedBadges = [
  'fast-ippon',
  'shiai-debut',
  'kaizen',
  'golden-score',
  'newaza',
  'seoi-star',
];

let allPassed = true;

// Test 1: Check SVG assets exist
console.log('✓ Test 1: SVG badge assets');
const badgesDir = path.join(__dirname, '../public/badges');

if (!fs.existsSync(badgesDir)) {
  console.error('  ✗ badges directory missing');
  process.exit(1);
}

expectedBadges.forEach(badgeId => {
  const svgPath = path.join(badgesDir, `${badgeId}.svg`);
  if (!fs.existsSync(svgPath)) {
    console.error(`  ✗ Missing: ${badgeId}.svg`);
    allPassed = false;
  } else {
    const stats = fs.statSync(svgPath);
    console.log(`  ✓ ${badgeId}.svg exists (${stats.size} bytes)`);
  }
});

// Test 2: Check badge-store.ts exists
console.log('\n✓ Test 2: Badge store module');
const badgeStorePath = path.join(__dirname, '../lib/badge-store.ts');
if (!fs.existsSync(badgeStorePath)) {
  console.error('  ✗ lib/badge-store.ts missing');
  allPassed = false;
} else {
  const content = fs.readFileSync(badgeStorePath, 'utf8');
  if (content.includes('export type BadgeDefinition')) {
    console.log('  ✓ BadgeDefinition type exported');
  }
  if (content.includes('export async function getAthleteBadges')) {
    console.log('  ✓ getAthleteBadges function exported');
  }
  if (content.includes('hasMockData')) {
    console.log('  ✓ Uses hasMockData for demo detection');
  }
}

// Test 3: Check BadgesSection component exists
console.log('\n✓ Test 3: BadgesSection component');
const badgesSectionPath = path.join(__dirname, '../components/BadgesSection.tsx');
if (!fs.existsSync(badgesSectionPath)) {
  console.error('  ✗ components/BadgesSection.tsx missing');
  allPassed = false;
} else {
  const content = fs.readFileSync(badgesSectionPath, 'utf8');
  if (content.includes('BadgeWithDefinition')) {
    console.log('  ✓ BadgeWithDefinition type imported');
  }
  if (content.includes('getAthleteBadges')) {
    console.log('  ✓ getAthleteBadges called');
  }
  if (content.includes('MockDataBadge')) {
    console.log('  ✓ MockDataBadge included');
  }
}

// Test 4: Check athlete page integration
console.log('\n✓ Test 4: Athlete page integration');
const athletePagePath = path.join(__dirname, '../app/athletes/[id]/page.tsx');
if (!fs.existsSync(athletePagePath)) {
  console.error('  ✗ app/athletes/[id]/page.tsx missing');
  allPassed = false;
} else {
  const content = fs.readFileSync(athletePagePath, 'utf8');
  if (content.includes('import BadgesSection')) {
    console.log('  ✓ BadgesSection imported');
  } else {
    console.error('  ✗ BadgesSection not imported');
    allPassed = false;
  }
  if (content.includes('<BadgesSection athleteId={athlete.id}')) {
    console.log('  ✓ BadgesSection rendered in page');
  } else {
    console.error('  ✗ BadgesSection not rendered');
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\n✅ All automated checks passed!\n');
  console.log('Manual verification steps:');
  console.log('1. npm run dev → http://localhost:3000');
  console.log('2. Load roster, ensure Demo A. exists (auto-created)');
  console.log('3. Click Demo A. → verify Badges section shows 5 badges with SVG images');
  console.log('4. Verify badge cards show: image, name, tier, date, description, notes');
  console.log('5. Create a new test athlete → verify no Badges section appears (empty check)');
  console.log('6. Verify MockDataBadge appears next to "Badges" heading');
  process.exit(0);
} else {
  console.error('\n❌ Some checks failed. Fix errors above.\n');
  process.exit(1);
}
