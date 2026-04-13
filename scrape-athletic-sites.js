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
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
      },
      timeout: 10000,
      maxRedirects: 5,
    });
    return cheerio.load(data);
  } catch (e) {
    return null;
  }
}

// Common URL patterns for finding lacrosse pages
function buildAthleticURLs(school) {
  const baseURL = school.official_website;
  if (!baseURL) return [];

  // Extract domain
  const domain = baseURL.replace(/https?:\/\//, "").replace(/\/$/, "");

  const patterns = [
    // Common athletic site structures
    `https://${domain}/athletics/mens-lacrosse`,
    `https://${domain}/athletics/sports/mlax`,
    `https://${domain}/sports/mlax`,
    `https://${domain}/sports/mens-lacrosse`,

    // Sidearm Sports (very common)
    `https://${domain.split('.')[0]}athletics.com/sports/mlax`,
    `https://${domain.split('.')[0]}athletics.com/sports/mens-lacrosse`,
    `https://go${domain.split('.')[0]}.com/sports/mlax`,

    // Common subdomains
    `https://athletics.${domain}/sports/mlax`,
    `https://athletics.${domain}/mens-lacrosse`,

    // Staff/roster pages
    `https://${domain}/athletics/mens-lacrosse/roster`,
    `https://${domain}/athletics/mens-lacrosse/coaches`,
  ];

  return patterns;
}

function extractCoachInfo($, url) {
  const coaches = [];

  // Try multiple selectors for coach info
  const selectors = [
    '.sidearm-roster-player', // Sidearm Sports
    '.staff-member',
    '.coach-card',
    '.coaches .person',
    '[class*="coach"]',
    '[class*="staff"]',
  ];

  selectors.forEach(selector => {
    $(selector).each((_, el) => {
      const $el = $(el);

      // Extract name
      const name = $el.find('h2, h3, .name, .sidearm-roster-player-name').first().text().trim();

      // Extract title/position
      const title = $el.find('.title, .position, .sidearm-roster-player-position').first().text().trim();

      // Extract email
      let email = '';
      $el.find('a[href^="mailto:"]').each((_, a) => {
        email = $(a).attr('href').replace('mailto:', '');
      });

      // Extract phone
      let phone = '';
      $el.find('a[href^="tel:"]').each((_, a) => {
        phone = $(a).attr('href').replace('tel:', '');
      });

      // Look for phone in text
      if (!phone) {
        const text = $el.text();
        const phoneMatch = text.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
        if (phoneMatch) phone = phoneMatch[0];
      }

      if (name && title && (title.toLowerCase().includes('coach') || title.toLowerCase().includes('coordinator'))) {
        coaches.push({ name, title, email, phone });
      }
    });
  });

  // If no coaches found, try simpler approach
  if (coaches.length === 0) {
    $('body').find(':contains("Head Coach")').each((_, el) => {
      const $parent = $(el).parent();
      const text = $parent.text();

      // Try to extract name near "Head Coach"
      const nameMatch = text.match(/Head Coach[:\s]+([A-Z][a-z]+\s+[A-Z][a-z]+)/i);
      if (nameMatch) {
        coaches.push({
          name: nameMatch[1].trim(),
          title: 'Head Coach',
          email: '',
          phone: ''
        });
      }
    });
  }

  return coaches;
}

async function scrapeSchool(school, index, total) {
  console.log(`\n[${index + 1}/${total}] ${school.school}`);

  const urls = buildAthleticURLs(school);
  let foundPage = null;
  let coaches = [];

  // Try each URL pattern
  for (const url of urls) {
    const $ = await fetchHTML(url);
    if (!$) continue;

    // Check if this looks like a lacrosse page
    const pageText = $('body').text().toLowerCase();
    if (pageText.includes('lacrosse') || pageText.includes('mlax')) {
      console.log(`  ✅ Found page: ${url}`);
      foundPage = url;

      coaches = extractCoachInfo($, url);
      if (coaches.length > 0) {
        console.log(`  📋 Found ${coaches.length} coach(es)`);
        coaches.forEach(c => {
          console.log(`     - ${c.name} (${c.title})`);
          if (c.email) console.log(`       Email: ${c.email}`);
        });
        break;
      }
    }

    await new Promise(resolve => setTimeout(resolve, 200));
  }

  if (!foundPage) {
    console.log(`  ❌ No lacrosse page found`);
  } else if (coaches.length === 0) {
    console.log(`  ⚠️ Found page but no coach info extracted`);
  }

  return {
    school: school.school,
    athletic_page: foundPage,
    coaches: coaches,
    scraped_at: new Date().toISOString()
  };
}

async function main() {
  // Test with just a few schools first
  const testSchools = data
    .filter(s => s.athletics.division === 1 && s.official_website) // D1 schools only
    .slice(0, 10); // First 10

  console.log(`Testing with ${testSchools.length} D1 schools...\n`);

  const results = [];

  for (let i = 0; i < testSchools.length; i++) {
    const result = await scrapeSchool(testSchools[i], i, testSchools.length);
    results.push(result);
    await new Promise(resolve => setTimeout(resolve, 1000)); // Be nice to servers
  }

  // Save results
  fs.writeFileSync('athletic_site_test.json', JSON.stringify(results, null, 2));

  console.log(`\n\n=== SUMMARY ===`);
  const foundPages = results.filter(r => r.athletic_page).length;
  const foundCoaches = results.filter(r => r.coaches.length > 0).length;

  console.log(`Found athletic pages: ${foundPages}/${results.length}`);
  console.log(`Found coach info: ${foundCoaches}/${results.length}`);
  console.log(`\nResults saved to athletic_site_test.json`);
}

main().catch(console.error);
