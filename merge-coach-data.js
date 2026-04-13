import fs from "fs";
import { parse } from "json2csv";

// Load original data
const originalData = JSON.parse(fs.readFileSync("mens_lacrosse.json"));

// Load coach scrape results
const coachFiles = fs.readdirSync('.').filter(f => f.startsWith('coach_data_') && f.endsWith('.json'));

if (coachFiles.length === 0) {
  console.log("No coach data files found. Run scrape-coaches.js first.");
  process.exit(1);
}

// Use most recent file
const latestFile = coachFiles.sort().reverse()[0];
console.log(`Using coach data from: ${latestFile}\n`);

const coachData = JSON.parse(fs.readFileSync(latestFile));

// Create lookup
const coachLookup = {};
coachData.forEach(item => {
  if (item.coaches.length > 0) {
    coachLookup[item.school] = item;
  }
});

// Merge data
let updated = 0;
let emailsAdded = 0;

originalData.forEach(school => {
  const coachInfo = coachLookup[school.school];

  if (coachInfo && coachInfo.coaches.length > 0) {
    const headCoach = coachInfo.coaches.find(c =>
      c.title.toLowerCase().includes('head coach')
    ) || coachInfo.coaches[0];

    // Update head coach if missing or different
    if (!school.athletics.head_coach || school.athletics.head_coach !== headCoach.name) {
      school.athletics.head_coach = headCoach.name;
      updated++;
    }

    // Add coach contact info
    school.athletics.head_coach_email = headCoach.email || null;
    if (headCoach.email) emailsAdded++;

    // Add full coaching staff
    school.athletics.coaching_staff = coachInfo.coaches;

    // Add athletic website URL
    school.athletic_website = coachInfo.athleticURL;
  }
});

// Save updated data
fs.writeFileSync('mens_lacrosse_updated.json', JSON.stringify(originalData, null, 2));

// Create updated CSV
const flatData = originalData.map(team => ({
  school: team.school || "",
  official_website: team.official_website || "",
  athletic_website: team.athletic_website || "",
  city: team.location?.city || "",
  state: team.location?.state || "",
  association: team.athletics?.association || "",
  division: team.athletics?.division ?? "",
  conference: team.athletics?.conference || "",
  head_coach: team.athletics?.head_coach || "",
  head_coach_email: team.athletics?.head_coach_email || "",
  tuition: team.academics?.tuition ?? "",
  size_category: team.academics?.size_category || "",
  enrollment: team.academics?.enrollment ?? "",
  religious_affiliation: team.academics?.religious_affiliation || ""
}));

const csv = parse(flatData);
fs.writeFileSync('mens_lacrosse_updated.csv', csv);

console.log(`=== MERGE COMPLETE ===`);
console.log(`Updated head coaches: ${updated}`);
console.log(`Added coach emails: ${emailsAdded}`);
console.log(`\nOutput files:`);
console.log(`  - mens_lacrosse_updated.json`);
console.log(`  - mens_lacrosse_updated.csv`);

// Show sample of updates
console.log(`\n=== SAMPLE OF UPDATED SCHOOLS ===`);
const samplesWithEmail = originalData.filter(s => s.athletics?.head_coach_email).slice(0, 5);
samplesWithEmail.forEach(s => {
  console.log(`\n${s.school}`);
  console.log(`  Coach: ${s.athletics.head_coach}`);
  console.log(`  Email: ${s.athletics.head_coach_email}`);
  console.log(`  Athletic Site: ${s.athletic_website}`);
});
