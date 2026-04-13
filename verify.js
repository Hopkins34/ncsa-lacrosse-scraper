import fs from "fs";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));

console.log("=== SCHOOLS WITH MISSING CRITICAL DATA ===\n");

// Missing head coach
const missingCoach = data.filter(s => !s.athletics?.head_coach);
console.log(`Missing Head Coach (${missingCoach.length} schools):`);
missingCoach.forEach(s => {
  console.log(`  - ${s.school} (${s.athletics.association} D${s.athletics.division})`);
  console.log(`    Check: https://www.ncsasports.org/mens-lacrosse/colleges/${s.school.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
});

// Missing tuition
const missingTuition = data.filter(s => !s.academics?.tuition);
console.log(`\nMissing Tuition (${missingTuition.length} schools):`);
missingTuition.forEach(s => {
  console.log(`  - ${s.school} (${s.athletics.association} D${s.athletics.division})`);
});

// Missing website
const missingWebsite = data.filter(s => !s.official_website);
console.log(`\nMissing Official Website (${missingWebsite.length} schools):`);
missingWebsite.forEach(s => {
  console.log(`  - ${s.school} (${s.athletics.association} D${s.athletics.division})`);
});

console.log("\n=== SPOT CHECK THESE SCHOOLS MANUALLY ===\n");
console.log("Verify coach names and contact info are current:");

// Pick some top D1 schools to verify
const d1Schools = data.filter(s => s.athletics.association === "NCAA" && s.athletics.division === 1);
const toVerify = [
  "Syracuse University",
  "Duke University",
  "Johns Hopkins University",
  "University of Maryland",
  "University of Virginia"
].map(name => d1Schools.find(s => s.school === name)).filter(Boolean);

toVerify.forEach(s => {
  console.log(`\n${s.school}`);
  console.log(`  Head Coach: ${s.athletics.head_coach}`);
  console.log(`  NCSA: https://www.ncsasports.org/mens-lacrosse/colleges/${s.school.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);
  console.log(`  Official: ${s.official_website}`);
});

console.log("\n\n=== RECOMMENDATIONS ===");
console.log("1. Manually verify 5-10 schools you plan to contact first");
console.log("2. Check coach names on official athletic websites (coaching changes happen!)");
console.log("3. For missing coaches, visit NCSA link above to see if data exists");
console.log("4. Consider adding coach email scraping from official athletic sites");
console.log("5. Re-run scraper periodically (coaches change jobs frequently)");
