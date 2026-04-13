import fs from "fs";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
  const domains = JSON.parse(fs.readFileSync("athletic-domains.json"));

  console.log("=== Add Athletic Domain Mapping ===\n");

  const schoolName = await question("School name (exact match from dataset): ");

  if (!schoolName) {
    console.log("School name required");
    process.exit(1);
  }

  const athleticDomain = await question("Athletic domain (e.g., cuse.com): ");

  if (!athleticDomain) {
    console.log("Domain required");
    process.exit(1);
  }

  // Clean domain
  const cleanDomain = athleticDomain.replace(/https?:\/\//, '').replace(/\/$/, '').split('/')[0];

  // Add to mapping
  domains[schoolName] = cleanDomain;

  // Sort alphabetically
  const sorted = Object.keys(domains).sort().reduce((acc, key) => {
    acc[key] = domains[key];
    return acc;
  }, {});

  // Save
  fs.writeFileSync("athletic-domains.json", JSON.stringify(sorted, null, 2));

  console.log(`\n✅ Added: ${schoolName} → ${cleanDomain}`);
  console.log(`\nNow run: node scrape-coaches.js test`);

  rl.close();
}

main().catch(console.error);
