import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("comprehensive_lacrosse_data.json"));

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept": "text/html",
      },
      timeout: 8000,
      maxRedirects: 3,
    });
    return cheerio.load(data);
  } catch (e) {
    return null;
  }
}

// More aggressive URL pattern generation for D2/D3
function generateAthleticURLs(school) {
  const name = school.school.toLowerCase();
  const words = name.split(/\s+/);
  const domains = [];

  // Common patterns
  const firstWord = words[0].replace(/[^a-z]/g, '');
  const secondWord = words[1]?.replace(/[^a-z]/g, '') || '';

  // Generate many variations
  const patterns = [
    `go${firstWord}.com`,
    `${firstWord}athletics.com`,
    `${firstWord}sports.com`,
    `${firstWord}${secondWord}.com`,
    `${firstWord}${secondWord}athletics.com`,
  ];

  // Try each pattern with standard paths
  patterns.forEach(domain => {
    domains.push(
      `https://${domain}/sports/mens-lacrosse/roster`,
      `https://${domain}/sports/mlax/roster`,
      `https://${domain}/sports/mlax/staff`,
      `https://${domain}/athletics/mens-lacrosse`,
    );
  });

  return domains;
}

function extractCoaches($) {
  const coaches = [];
  const seen = new Set();

  // Sidearm Sports (common NCAA platform)
  $('.sidearm-roster-player').each((_, el) => {
    const $el = $(el);
    const name = $el.find('.sidearm-roster-player-name').text().trim();
    const title = $el.find('.sidearm-roster-player-position, .sidearm-roster-player-title').text().trim();

    if (title.toLowerCase().includes('coach')) {
      let email = '';
      $el.find('a[href^="mailto:"]').each((_, a) => {
        email = $(a).attr('href').replace('mailto:', '');
      });

      const key = name + title;
      if (!seen.has(key) && name) {
        seen.add(key);
        coaches.push({ name, title, email });
      }
    }
  });

  // Look for any mailto links if no coaches found
  if (coaches.length === 0) {
    $('a[href^="mailto:"]').each((_, a) => {
      const email = $(a).attr('href').replace('mailto:', '');
      const text = $(a).text().trim() || $(a).parent().text().trim();

      if (text.toLowerCase().includes('coach') || text.toLowerCase().includes('lax')) {
        if (!seen.has(email)) {
          seen.add(email);
          coaches.push({
            name: text.includes('@') ? '' : text,
            title: 'Staff',
            email: email
          });
        }
      }
    });
  }

  return coaches;
}

async function scrapeSchool(school, index, total) {
  process.stdout.write(`\r[${index + 1}/${total}] ${school.school}`.padEnd(80));

  const urls = generateAthleticURLs(school);

  for (const url of urls) {
    const $ = await fetchHTML(url);
    if (!$) continue;

    const coaches = extractCoaches($);

    if (coaches.length > 0) {
      console.log(`\n  ✅ ${url} - Found ${coaches.length} coach(es)`);
      const headCoach = coaches.find(c => c.title.toLowerCase().includes('head')) || coaches[0];
      if (headCoach.email) console.log(`     📧 ${headCoach.email}`);

      return {
        school: school.school,
        coaches,
        athleticURL: url.split('/sports/')[0],
        found: true
      };
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  return { school: school.school, coaches: [], found: false };
}

async function main() {
  const division = process.argv[2] || 'd2';

  let targetSchools;
  if (division === 'd2') {
    targetSchools = data.filter(s => s.athletics.division === 2);
  } else if (division === 'd3') {
    targetSchools = data.filter(s => s.athletics.division === 3);
  } else {
    targetSchools = data.filter(s => s.athletics.division === 2 || s.athletics.division === 3);
  }

  console.log(`\n=== Scraping ${targetSchools.length} ${division.toUpperCase()} schools ===\n`);

  const results = [];

  for (let i = 0; i < targetSchools.length; i++) {
    const result = await scrapeSchool(targetSchools[i], i, targetSchools.length);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Save results
  const filename = `coach_data_${division}_intensive.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  // Summary
  const foundCoaches = results.filter(r => r.found).length;
  const foundEmails = results.filter(r => r.coaches.some(c => c.email)).length;

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Schools scraped: ${results.length}`);
  console.log(`Found coaches: ${foundCoaches} (${Math.round(foundCoaches/results.length*100)}%)`);
  console.log(`Found emails: ${foundEmails} (${Math.round(foundEmails/results.length*100)}%)`);
  console.log(`\nSaved to: ${filename}`);

  // Now merge
  console.log('\nMerging with comprehensive dataset...');
  const comprehensive = JSON.parse(fs.readFileSync('comprehensive_lacrosse_data.json'));

  results.forEach(result => {
    if (result.found) {
      const school = comprehensive.find(s => s.school === result.school);
      if (school) {
        const headCoach = result.coaches.find(c =>
          c.title.toLowerCase().includes('head')
        ) || result.coaches[0];

        school.athletics.head_coach_athletic = headCoach.name;
        school.athletics.coach_email = headCoach.email || null;
        school.athletics.coaching_staff = result.coaches;
        school.athletics.athletic_website = result.athleticURL;
        school.athletics.head_coach = headCoach.name || school.athletics.head_coach;
      }
    }
  });

  fs.writeFileSync('comprehensive_lacrosse_data.json', JSON.stringify(comprehensive, null, 2));

  // Regenerate CSV
  const { parse } = await import('json2csv');
  const flatData = comprehensive.map(team => ({
    school: team.school || "",
    division: team.athletics?.division ?? "",
    association: team.athletics?.association || "",
    conference: team.athletics?.conference || "",
    city: team.location?.city || "",
    state: team.location?.state || "",
    head_coach: team.athletics?.head_coach || "",
    coach_email: team.athletics?.coach_email || "",
    data_source: team.athletics?.coach_email ? "Athletic Site" : (team.athletics?.head_coach ? "NCSA" : ""),
    athletic_website: team.athletics?.athletic_website || "",
    official_website: team.official_website || "",
    ncsa_url: team.ncsa_url || "",
    tuition: team.academics?.tuition ?? "",
    enrollment: team.academics?.enrollment ?? "",
    size_category: team.academics?.size_category || "",
    religious_affiliation: team.academics?.religious_affiliation || "",
    has_email: team.athletics?.coach_email ? "YES" : "NO",
    has_coach: team.athletics?.head_coach ? "YES" : "NO"
  }));

  const csv = parse(flatData);
  fs.writeFileSync('comprehensive_lacrosse_data.csv', csv);

  console.log('✅ Updated comprehensive_lacrosse_data.json and .csv');
}

main().catch(console.error);
