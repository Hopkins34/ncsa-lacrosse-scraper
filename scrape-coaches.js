import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));
const athleticDomains = JSON.parse(fs.readFileSync("athletic-domains.json"));

async function fetchHTML(url) {
  try {
    const { data } = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html",
      },
      timeout: 15000,
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

  // If not in manual list, try to guess
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
      `https://${d}/sports/mens-lacrosse/coaches`,
    ]);
  }

  if (domain) {
    urls.push(
      `https://${domain}/sports/mens-lacrosse/roster`,
      `https://${domain}/sports/mlax/roster`,
      `https://${domain}/sports/mens-lacrosse/coaches`,
      `https://${domain}/sports/mlax/coaches`,
    );
  }

  return urls;
}

function extractCoaches($, url) {
  const coaches = [];
  const seen = new Set();

  // Method 1: Sidearm Sports roster format (most common for NCAA)
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
        coaches.push({ name, title: position, email, source: url });
      }
    }
  });

  // Method 2: Generic staff listings
  if (coaches.length === 0) {
    $('[class*="staff"], [class*="coach"], .person').each((_, el) => {
      const $el = $(el);
      const name = $el.find('h2, h3, h4, .name, [class*="name"]').first().text().trim();
      const title = $el.find('.title, .position, [class*="title"], [class*="position"]').first().text().trim();

      let email = '';
      $el.find('a[href^="mailto:"]').each((_, a) => {
        email = $(a).attr('href').replace('mailto:', '');
      });

      if (name && title && title.toLowerCase().includes('coach')) {
        const key = `${name}|${title}`;
        if (!seen.has(key)) {
          seen.add(key);
          coaches.push({ name, title, email, source: url });
        }
      }
    });
  }

  // Method 3: Look for "Head Coach:" text patterns
  if (coaches.length === 0) {
    $('body *').each((_, el) => {
      const text = $(el).text();
      const match = text.match(/Head Coach:?\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/);
      if (match) {
        const name = match[1].trim();
        if (!seen.has(name)) {
          seen.add(name);
          coaches.push({
            name: name,
            title: 'Head Coach',
            email: '',
            source: url
          });
        }
      }
    });
  }

  return coaches;
}

async function scrapeSchool(school, index, total) {
  console.log(`\n[${index + 1}/${total}] ${school.school}`);

  const urls = getAthleticURLs(school);

  for (const url of urls) {
    const $ = await fetchHTML(url);
    if (!$) continue;

    const coaches = extractCoaches($, url);

    if (coaches.length > 0) {
      console.log(`  ✅ ${url}`);
      coaches.forEach(c => {
        console.log(`     ${c.title}: ${c.name}`);
        if (c.email) console.log(`        Email: ${c.email}`);
      });

      return {
        school: school.school,
        coaches: coaches,
        athleticURL: url.split('/sports/')[0],
        scrapedAt: new Date().toISOString()
      };
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`  ❌ No coaches found`);
  return { school: school.school, coaches: [], athleticURL: null };
}

async function main() {
  const mode = process.argv[2] || 'test';

  let schools = [];

  if (mode === 'test') {
    // Test with schools in our manual mapping
    schools = data.filter(s => athleticDomains[s.school]).slice(0, 10);
    console.log(`Testing with ${schools.length} manually mapped schools...\n`);
  } else if (mode === 'missing') {
    // Target schools with missing coach data
    schools = data.filter(s => !s.athletics?.head_coach);
    console.log(`Scraping ${schools.length} schools with missing coaches...\n`);
  } else if (mode === 'd1') {
    // All D1 schools
    schools = data.filter(s => s.athletics.division === 1);
    console.log(`Scraping ${schools.length} D1 schools...\n`);
  } else if (mode === 'd2') {
    // All D2 schools
    schools = data.filter(s => s.athletics.division === 2);
    console.log(`Scraping ${schools.length} D2 schools...\n`);
  } else if (mode === 'd3') {
    // All D3 schools
    schools = data.filter(s => s.athletics.division === 3);
    console.log(`Scraping ${schools.length} D3 schools...\n`);
  } else if (mode === 'all') {
    schools = data;
    console.log(`Scraping all ${schools.length} schools...\n`);
  }

  const results = [];

  for (let i = 0; i < schools.length; i++) {
    const result = await scrapeSchool(schools[i], i, schools.length);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 500)); // Faster delay
  }

  // Save results
  const filename = `coach_data_${mode}_${Date.now()}.json`;
  fs.writeFileSync(filename, JSON.stringify(results, null, 2));

  // Summary
  const foundCoaches = results.filter(r => r.coaches.length > 0).length;
  const foundEmails = results.filter(r => r.coaches.some(c => c.email)).length;

  console.log(`\n\n=== SUMMARY ===`);
  console.log(`Found coaches: ${foundCoaches}/${results.length}`);
  console.log(`Found emails: ${foundEmails}/${results.length}`);
  console.log(`Saved to: ${filename}`);
}

main().catch(console.error);
