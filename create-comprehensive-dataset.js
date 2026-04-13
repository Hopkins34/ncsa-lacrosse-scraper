import fs from "fs";
import { parse } from "json2csv";

// Load all data sources
const ncsaData = JSON.parse(fs.readFileSync("mens_lacrosse.json"));
const d1Athletic = JSON.parse(fs.readFileSync("coach_data_d1_1776050974241.json"));

console.log("=== Creating Comprehensive Dataset ===\n");

// Create lookup for athletic site data
const athleticLookup = {};
d1Athletic.forEach(item => {
  if (item.coaches && item.coaches.length > 0) {
    athleticLookup[item.school] = item;
  }
});

console.log(`NCSA data: ${ncsaData.length} schools`);
console.log(`Athletic site data: ${Object.keys(athleticLookup).length} schools\n`);

// Merge data
const comprehensive = ncsaData.map(school => {
  const athletic = athleticLookup[school.school];

  // Start with NCSA data
  const merged = {
    school: school.school,
    official_website: school.official_website,
    ncsa_url: `https://www.ncsasports.org/mens-lacrosse/colleges/${school.school.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    location: school.location,
    athletics: {
      association: school.athletics.association,
      division: school.athletics.division,
      conference: school.athletics.conference,
      head_coach_ncsa: school.athletics.head_coach || null,
      head_coach_athletic: null,
      coach_email: null,
      coaching_staff: [],
      athletic_website: null
    },
    academics: school.academics
  };

  // Merge athletic site data if available
  if (athletic) {
    const headCoach = athletic.coaches.find(c =>
      c.title?.toLowerCase().includes('head')
    ) || athletic.coaches[0];

    merged.athletics.head_coach_athletic = headCoach?.name || null;
    merged.athletics.coach_email = headCoach?.email || null;
    merged.athletics.coaching_staff = athletic.coaches;
    merged.athletics.athletic_website = athletic.athleticURL || null;

    // Prefer athletic site coach over NCSA if different
    if (merged.athletics.head_coach_athletic) {
      merged.athletics.head_coach = merged.athletics.head_coach_athletic;
    } else {
      merged.athletics.head_coach = merged.athletics.head_coach_ncsa;
    }
  } else {
    merged.athletics.head_coach = merged.athletics.head_coach_ncsa;
  }

  return merged;
});

// Save comprehensive JSON
fs.writeFileSync('comprehensive_lacrosse_data.json', JSON.stringify(comprehensive, null, 2));

// Create flat CSV with all important fields
const flatData = comprehensive.map(team => ({
  // Basic info
  school: team.school || "",
  division: team.athletics?.division ?? "",
  association: team.athletics?.association || "",
  conference: team.athletics?.conference || "",

  // Location
  city: team.location?.city || "",
  state: team.location?.state || "",

  // Coach info
  head_coach: team.athletics?.head_coach || "",
  coach_email: team.athletics?.coach_email || "",
  data_source: team.athletics?.coach_email ? "Athletic Site" : (team.athletics?.head_coach ? "NCSA" : ""),

  // Websites
  athletic_website: team.athletics?.athletic_website || "",
  official_website: team.official_website || "",
  ncsa_url: team.ncsa_url || "",

  // Academics
  tuition: team.academics?.tuition ?? "",
  enrollment: team.academics?.enrollment ?? "",
  size_category: team.academics?.size_category || "",
  religious_affiliation: team.academics?.religious_affiliation || "",

  // Status flags
  has_email: team.athletics?.coach_email ? "YES" : "NO",
  has_coach: team.athletics?.head_coach ? "YES" : "NO",
  needs_verification: team.athletics?.head_coach && !team.athletics?.coach_email ? "YES" : "NO"
}));

const csv = parse(flatData);
fs.writeFileSync('comprehensive_lacrosse_data.csv', csv);

// Statistics
const byDivision = {};
comprehensive.forEach(s => {
  const div = `${s.athletics.association} D${s.athletics.division}`;
  if (!byDivision[div]) {
    byDivision[div] = { total: 0, withCoach: 0, withEmail: 0 };
  }
  byDivision[div].total++;
  if (s.athletics.head_coach) byDivision[div].withCoach++;
  if (s.athletics.coach_email) byDivision[div].withEmail++;
});

console.log("=== STATISTICS BY DIVISION ===\n");
Object.entries(byDivision).sort().forEach(([div, stats]) => {
  console.log(`${div}:`);
  console.log(`  Total: ${stats.total}`);
  console.log(`  With Coach: ${stats.withCoach} (${Math.round(stats.withCoach/stats.total*100)}%)`);
  console.log(`  With Email: ${stats.withEmail} (${Math.round(stats.withEmail/stats.total*100)}%)`);
  console.log('');
});

// Summary
const totalWithCoach = comprehensive.filter(s => s.athletics.head_coach).length;
const totalWithEmail = comprehensive.filter(s => s.athletics.coach_email).length;
const needsWork = comprehensive.filter(s => !s.athletics.head_coach || !s.athletics.coach_email).length;

console.log("=== OVERALL SUMMARY ===\n");
console.log(`Total schools: ${comprehensive.length}`);
console.log(`Schools with coach names: ${totalWithCoach} (${Math.round(totalWithCoach/comprehensive.length*100)}%)`);
console.log(`Schools with email addresses: ${totalWithEmail} (${Math.round(totalWithEmail/comprehensive.length*100)}%)`);
console.log(`Schools needing more work: ${needsWork}\n`);

console.log("=== FILES CREATED ===\n");
console.log("comprehensive_lacrosse_data.json - Full structured data");
console.log("comprehensive_lacrosse_data.csv - Spreadsheet ready (OPEN THIS!)\n");

console.log("=== NEXT STEPS ===\n");
console.log("1. Open comprehensive_lacrosse_data.csv in Excel/Google Sheets");
console.log("2. Filter by your target division (D2, D3, low D1)");
console.log("3. Sort by 'has_email' to see which schools need work");
console.log("4. For schools without emails, visit their athletic_website");
console.log("5. Manually add emails to your spreadsheet as you find them");
