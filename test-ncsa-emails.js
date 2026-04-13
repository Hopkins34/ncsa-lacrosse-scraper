import axios from "axios";
import * as cheerio from "cheerio";

const TEST_SCHOOLS = [
  "https://www.ncsasports.org/mens-lacrosse/colleges/adelphi-university",
  "https://www.ncsasports.org/mens-lacrosse/colleges/adrian-college",
  "https://www.ncsasports.org/mens-lacrosse/colleges/assumption-university",
];

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

async function test() {
  for (const url of TEST_SCHOOLS) {
    console.log(`\nTesting: ${url}`);

    const $ = await fetchHTML(url);

    const schoolName = $('h1').first().text().trim();
    console.log(`School: ${schoolName}`);

    // Look for coach
    let headCoach = "";
    $("div:contains('Head Coach')").each((_, node) => {
      const text = $(node).text().trim();
      const match = text.match(/Head Coach\s*(.*)/i);
      if (match && match[1]) headCoach = match[1].trim();
    });
    console.log(`Coach: ${headCoach || "NOT FOUND"}`);

    // Look for emails
    const emails = [];
    $('a[href^="mailto:"]').each((_, a) => {
      const email = $(a).attr('href').replace('mailto:', '');
      emails.push(email);
    });

    console.log(`Emails found: ${emails.length}`);
    emails.forEach(e => console.log(`  - ${e}`));

    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

test().catch(console.error);
