import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";

const data = JSON.parse(fs.readFileSync("mens_lacrosse.json"));

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.ncsasports.org/",
      "Connection": "keep-alive",
    },
  });
  return cheerio.load(data);
}

// Re-scrape schools with missing coaches
async function fixMissingCoaches() {
  const missingCoach = data.filter(s => !s.athletics?.head_coach);

  console.log(`Re-scraping ${missingCoach.length} schools with missing coaches...\n`);

  for (let school of missingCoach) {
    try {
      // Find the full school object
      const fullSchool = data.find(s => s.school === school.school);
      if (!fullSchool) continue;

      // Get URL from NCSA format
      const ncsaPath = school.school.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const url = `https://www.ncsasports.org/mens-lacrosse/colleges/${ncsaPath}`;

      const $ = await fetchHTML(url);

      let headCoach = "";

      // Try multiple selectors
      $("div:contains('Head Coach'), span:contains('Head Coach'), p:contains('Head Coach')").each((_, node) => {
        const text = $(node).text().trim();
        const match = text.match(/Head Coach\s*:?\s*(.*)/i);
        if (match && match[1]) {
          headCoach = match[1].trim().replace(/\s+/g, ' ');
        }
      });

      if (headCoach) {
        fullSchool.athletics.head_coach = headCoach;
        console.log(`✅ ${school.school}: ${headCoach}`);
      } else {
        console.log(`❌ ${school.school}: Still not found`);
      }

      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (e) {
      console.error(`❌ ${school.school}: ${e.message}`);
    }
  }

  // Save updated data
  fs.writeFileSync("mens_lacrosse.json", JSON.stringify(data, null, 2));
  console.log("\n✅ Updated mens_lacrosse.json");
}

fixMissingCoaches().catch(console.error);
