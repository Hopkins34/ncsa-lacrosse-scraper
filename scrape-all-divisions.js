import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { parse } from "json2csv";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));
const athleticDomains = JSON.parse(fs.readFileSync("athletic-domains.json"));

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return cheerio.load(data);
  } catch (e) {
    return null;
  }
}

function getAthleticURLs(school) {
  const urls = [];
  let domain = athleticDomains[school.school];

  if (!domain && school.official_website) {
    const schoolName = school.school.toLowerCase().split(' ')[0].replace(/[^a-z]/g, '');
    const guesses = [
      `go${schoolName}.com`,
      `${schoolName}athletics.com`,
      `${schoolName}sports.com`,
    ];

    return guesses.flatMap(d => [
      `https://${d}/sports/mens-lacrosse/roster`,
      `https://${d}/sports/mlax/roster`,
    ]);
  }

  if (domain) {
    urls.push(
      `https://${domain}/sports/mens-lacrosse/roster`,
      `https://${domain}/sports/mlax/roster`,
      `https://${domain}/sports/mens-lacrosse/coaches`,
    );
  }

  return urls;
}

function extractCoaches($, url) {
  const coaches = [];
  const seen = new Set();

  $('.sidearm-roster-player').each((_, el) => {
    const $el = $(el);
    const name = $el.find('.sidearm-roster-player-name').text().trim();
    const position = $el.find('.sidearm-roster-player-position, .sidearm-roster-player-title').text().trim();

    if (position.toLowerCase().includes('coach') || position.toLowerCase().includes('coordinator')) {
      let email = '';
      $el.find('a[href^="mailto:"]').each((_, a) => {
        email = $(a).attr('href').replace('mailto:', '');
      });

      const key = `${name}|${position}`;
      if (!seen.has(key) && name) {
        seen.add(key);
        coaches.push({ name, title: position, email });
      }
    }
  });

  return coaches;
}

async function scrapeSchool(school) {
  const urls = getAthleticURLs(school);

  for (const url of urls) {
    const $ = await fetchHTML(url);
    if (!$) continue;

    const coaches = extractCoaches($, url);

    if (coaches.length > 0) {
      return {
        school: school.school,
        coaches: coaches,
        athleticURL: url.split('/sports/')[0],
        found: true
      };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { school: school.school, coaches: [], found: false };
}

async function main() {
  console.log('Starting comprehensive scrape...\n');

  // Group schools by division
  const divisions = {
    d1: data.filter(s => s.athletics.division === 1),
    d2: data.filter(s => s.athletics.division === 2),
    d3: data.filter(s => s.athletics.division === 3),
  };

  const allResults = [];
  let totalProcessed = 0;
  const totalSchools = divisions.d1.length + divisions.d2.length + divisions.d3.length;

  // Process D1 first (priority)
  console.log(`=== D1 (${divisions.d1.length} schools) ===\n`);
  for (const school of divisions.d1) {
    totalProcessed++;
    process.stdout.write(`\r[${totalProcessed}/${totalSchools}] ${school.school}`.padEnd(80));

    const result = await scrapeSchool(school);
    if (result.found) {
      console.log(`\n  ✅ Found ${result.coaches.length} coach(es)`);
    }
    allResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log(`\n\n=== D2 (${divisions.d2.length} schools) ===\n`);
  for (const school of divisions.d2) {
    totalProcessed++;
    process.stdout.write(`\r[${totalProcessed}/${totalSchools}] ${school.school}`.padEnd(80));

    const result = await scrapeSchool(school);
    if (result.found) {
      console.log(`\n  ✅ Found ${result.coaches.length} coach(es)`);
    }
    allResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  console.log(`\n\n=== D3 (${divisions.d3.length} schools) ===\n`);
  for (const school of divisions.d3) {
    totalProcessed++;
    process.stdout.write(`\r[${totalProcessed}/${totalSchools}] ${school.school}`.padEnd(80));

    const result = await scrapeSchool(school);
    if (result.found) {
      console.log(`\n  ✅ Found ${result.coaches.length} coach(es)`);
    }
    allResults.push(result);
    await new Promise(resolve => setTimeout(resolve, 400));
  }

  // Save results
  fs.writeFileSync('coach_data_complete.json', JSON.stringify(allResults, null, 2));

  // Merge with original data
  const coachLookup = {};
  allResults.forEach(item => {
    if (item.coaches.length > 0) {
      coachLookup[item.school] = item;
    }
  });

  let updated = 0;
  let emailsAdded = 0;

  data.forEach(school => {
    const coachInfo = coachLookup[school.school];

    if (coachInfo && coachInfo.coaches.length > 0) {
      const headCoach = coachInfo.coaches.find(c =>
        c.title.toLowerCase().includes('head coach')
      ) || coachInfo.coaches[0];

      if (!school.athletics.head_coach || school.athletics.head_coach !== headCoach.name) {
        school.athletics.head_coach = headCoach.name;
        updated++;
      }

      school.athletics.head_coach_email = headCoach.email || null;
      if (headCoach.email) emailsAdded++;

      school.athletics.coaching_staff = coachInfo.coaches;
      school.athletic_website = coachInfo.athleticURL;
    }
  });

  // Save final data
  fs.writeFileSync('mens_lacrosse_complete.json', JSON.stringify(data, null, 2));

  const flatData = data.map(team => ({
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
  fs.writeFileSync('mens_lacrosse_complete.csv', csv);

  // Final summary
  const foundCoaches = allResults.filter(r => r.found).length;
  const foundEmails = allResults.filter(r => r.coaches.some(c => c.email)).length;

  console.log(`\n\n=== FINAL SUMMARY ===`);
  console.log(`Total schools scraped: ${allResults.length}`);
  console.log(`Found coaches: ${foundCoaches}/${allResults.length} (${Math.round(foundCoaches/allResults.length*100)}%)`);
  console.log(`Found emails: ${foundEmails}/${allResults.length} (${Math.round(foundEmails/allResults.length*100)}%)`);
  console.log(`Updated coach names: ${updated}`);
  console.log(`\nOutput files:`);
  console.log(`  - mens_lacrosse_complete.json`);
  console.log(`  - mens_lacrosse_complete.csv`);
}

main().catch(console.error);
