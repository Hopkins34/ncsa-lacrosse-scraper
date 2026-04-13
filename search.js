import fs from "fs";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));
const searchTerm = process.argv[2];

if (!searchTerm) {
  console.log("Usage: node search.js <school name>");
  console.log("Example: node search.js \"Ohio State\"");
  process.exit(1);
}

const results = data.filter(s =>
  s.school.toLowerCase().includes(searchTerm.toLowerCase())
);

if (results.length === 0) {
  console.log(`No schools found matching "${searchTerm}"`);
  process.exit(0);
}

console.log(`Found ${results.length} school(s):\n`);

results.forEach(s => {
  console.log("=".repeat(60));
  console.log(`🏫 ${s.school}`);
  console.log("=".repeat(60));
  console.log(`\n📍 Location: ${s.location.city}, ${s.location.state}`);
  console.log(`🌐 Website: ${s.official_website || "❌ NOT FOUND"}`);

  console.log(`\n⚾ Athletics:`);
  console.log(`  Division: ${s.athletics.association} D${s.athletics.division}`);
  console.log(`  Conference: ${s.athletics.conference}`);
  console.log(`  Head Coach: ${s.athletics.head_coach || "❌ NOT FOUND"}`);

  console.log(`\n🎓 Academics:`);
  console.log(`  Tuition: ${s.academics.tuition ? '$' + s.academics.tuition.toLocaleString() : "❌ NOT FOUND"}`);
  console.log(`  Enrollment: ${s.academics.enrollment?.toLocaleString() || "N/A"} (${s.academics.size_category || "N/A"})`);
  console.log(`  Religious: ${s.academics.religious_affiliation || "None"}`);

  console.log("\n" + "=".repeat(60) + "\n");
});

// Show similar schools
if (results.length === 1) {
  const school = results[0];
  const similar = data
    .filter(s =>
      s.athletics.association === school.athletics.association &&
      s.athletics.division === school.athletics.division &&
      s.location.state === school.location.state &&
      s.school !== school.school
    )
    .slice(0, 3);

  if (similar.length > 0) {
    console.log(`Similar schools in ${school.location.state} (${school.athletics.association} D${school.athletics.division}):`);
    similar.forEach(s => {
      console.log(`  • ${s.school} - ${s.athletics.head_coach || "Coach TBD"}`);
    });
    console.log();
  }
}
