import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return { html: data, finalUrl: url };
  } catch (e) {
    return null;
  }
}

// Generate athletic domain guesses based on school name
function guessAthleticDomains(school) {
  const name = school.school.toLowerCase();
  const domains = [];

  // Common patterns from major schools
  const prefixes = ['go', '', 'the'];
  const suffixes = ['athletics', '', 'sports'];

  // Get first word or initials
  const words = name.split(/\s+/).filter(w => w.length > 2);

  if (words.length > 0) {
    const firstWord = words[0].replace(/[^a-z]/g, '');

    prefixes.forEach(pre => {
      suffixes.forEach(suf => {
        const combo = pre + firstWord + suf;
        if (combo.length > 3) {
          domains.push(`https://${combo}.com/sports/mens-lacrosse`);
          domains.push(`https://${combo}.com/sports/mlax`);
          domains.push(`https://${combo}.com/sports/mlax/roster`);
        }
      });
    });
  }

  // Try school's main domain
  if (school.official_website) {
    const domain = school.official_website.replace(/https?:\/\//, '').replace(/\/$/, '').split('/')[0];
    domains.push(`https://${domain}/athletics/mens-lacrosse`);
    domains.push(`https://athletics.${domain}/mens-lacrosse`);
  }

  return domains;
}

async function findAthleticSite(school) {
  const domains = guessAthleticDomains(school);

  for (const url of domains) {
    const result = await fetchHTML(url);
    if (!result) continue;

    const $ = cheerio.load(result.html);
    const title = $('title').text().toLowerCase();
    const body = $('body').text().toLowerCase();

    // Check if this is a lacrosse page
    if ((title.includes('lacrosse') || body.includes('head coach')) &&
        body.includes(school.school.toLowerCase().split(' ')[0])) {

      // Extract base domain
      const athleticDomain = url.split('/sports/')[0];

      return {
        found: true,
        athleticDomain: athleticDomain,
        lacrosseUrl: url,
        title: $('title').text().trim()
      };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { found: false };
}

async function main() {
  // Test with well-known D1 schools
  const testSchools = [
    data.find(s => s.school.includes('Syracuse')),
    data.find(s => s.school.includes('Duke')),
    data.find(s => s.school.includes('Maryland') && !s.school.includes('Baltimore')),
    data.find(s => s.school.includes('Virginia') && s.school === 'University of Virginia'),
    data.find(s => s.school.includes('Notre Dame')),
    data.find(s => s.school.includes('Ohio State')),
  ].filter(Boolean);

  console.log(`Testing domain discovery with ${testSchools.length} top schools...\n`);

  for (const school of testSchools) {
    console.log(`\n${school.school}:`);
    console.log(`  Main site: ${school.official_website}`);

    const result = await findAthleticSite(school);

    if (result.found) {
      console.log(`  ✅ Athletic domain: ${result.athleticDomain}`);
      console.log(`  ✅ Lacrosse page: ${result.lacrosseUrl}`);
    } else {
      console.log(`  ❌ Not found with auto-detection`);
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

main().catch(console.error);
