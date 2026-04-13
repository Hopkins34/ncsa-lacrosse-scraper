import axios from "axios";
import * as cheerio from "cheerio";
import fs from "fs";
import { parse } from "json2csv";

const LIST_URL = "https://www.ncsasports.org/mens-lacrosse/colleges";
const DELAY_MS = 500; // Rate limiting

async function fetchHTML(url) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Accept-Encoding": "gzip, deflate, br",
      "Referer": "https://www.ncsasports.org/",
      "Connection": "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "same-origin",
    },
  });
  return cheerio.load(data);
}

function parseTuition(text) {
  if (!text) return null;
  const match = text.replace(/[$,]/g, "").match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

function categorizeEnrollment(enrollment) {
  if (!enrollment) return null;
  if (enrollment < 2000) return "Small";
  if (enrollment < 10000) return "Medium";
  if (enrollment < 20000) return "Large";
  return "Very Large";
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrape() {
  console.time("⏱ Total scrape time");

  const $list = await fetchHTML(LIST_URL);
  const teams = [];

  $list("div.row[itemprop='itemListElement']").each((i, el) => {
    const container = $list(el).find("div.container[itemprop='item']");

    const school = container.find("div[itemprop='name'] a").text().trim();
    const url = container.find("link[itemprop='url']").attr("href");

    if (!school || !url) return;

    const city = container
      .find("div[itemprop='address'] span[itemprop='addressLocality']")
      .text()
      .trim();
    const state = container
      .find("div[itemprop='address'] span[itemprop='addressRegion']")
      .text()
      .trim();
    const conference = container.find("div[itemprop='member']").text().trim();
    const divText = container.children("div").last().text().trim();

    let association = "";
    let division = null;

    if (divText.startsWith("NCAA")) {
      association = "NCAA";
      if (divText.includes("D1")) division = 1;
      else if (divText.includes("D2")) division = 2;
      else if (divText.includes("D3")) division = 3;
    } else if (divText === "NAIA") {
      association = "NAIA";
    } else if (divText === "JC") {
      association = "JC";
    }

    teams.push({ school, url, city, state, conference, association, division });
  });

  console.log(`📊 Found ${teams.length} schools to scrape`);

  const results = [];

  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];

    try {
      const $team = await fetchHTML(team.url);

      let inState = null;
      let outState = null;
      let enrollment = null;
      let religiousAffiliation = null;
      let officialWebsite = null;
      let headCoach = "";

      // Tuition
      $team("div:contains('Tuition In State'), div:contains('Tuition Out of State')").each((_, node) => {
        const text = $team(node).text().trim();
        if (text.includes("Tuition In State")) inState = parseTuition(text);
        if (text.includes("Tuition Out of State")) outState = parseTuition(text);
      });

      const tuition = outState || inState || null;

      // Enrollment
      $team("div:contains('Enrollment')").each((_, node) => {
        const text = $team(node).text().trim();
        const match = text.match(/\d[\d,]*/);
        if (match) enrollment = parseInt(match[0].replace(/,/g, ""), 10);
      });

      // Religious affiliation
      $team("div:contains('Religious Affiliation')").each((_, node) => {
        const text = $team(node).text().trim();
        const match = text.match(/Religious Affiliation\s*:?(.+)/i);
        if (match && match[1]) religiousAffiliation = match[1].trim();
      });

      // Official website
      const addressDiv = $team('div[itemprop="address"]');
      const websiteLink = addressDiv.find('a[href^="http"]').attr('href');
      if (websiteLink) officialWebsite = websiteLink.trim();

      // Head coach
      $team("div:contains('Head Coach')").each((_, node) => {
        const text = $team(node).text().trim();
        const match = text.match(/Head Coach\s*(.*)/i);
        if (match && match[1]) headCoach = match[1].trim();
      });

      results.push({
        school: team.school,
        official_website: officialWebsite,
        ncsa_url: team.url,
        location: {
          city: team.city,
          state: team.state
        },
        athletics: {
          association: team.association,
          division: team.division,
          conference: team.conference,
          head_coach: headCoach,
          coach_email: coachEmail || null
        },
        academics: {
          tuition: tuition,
          size_category: categorizeEnrollment(enrollment),
          enrollment: enrollment,
          religious_affiliation: religiousAffiliation
        }
      });

      console.log(`✅ ${i + 1}/${teams.length}: ${team.school}`);

      if (i < teams.length - 1) await delay(DELAY_MS);

    } catch (e) {
      console.error(`❌ Failed ${team.school}: ${e.message}`);
    }
  }

  // Save JSON
  fs.writeFileSync("mens_lacrosse.json", JSON.stringify(results, null, 2));
  console.log(`\n✅ Saved JSON: ${results.length} schools`);

  // Save CSV
  const flatData = results.map(team => ({
    school: team.school || "",
    official_website: team.official_website || "",
    ncsa_url: team.ncsa_url || "",
    city: team.location?.city || "",
    state: team.location?.state || "",
    association: team.athletics?.association || "",
    division: team.athletics?.division ?? "",
    conference: team.athletics?.conference || "",
    head_coach: team.athletics?.head_coach || "",
    coach_email_ncsa: team.athletics?.coach_email || "",
    tuition: team.academics?.tuition ?? "",
    size_category: team.academics?.size_category || "",
    enrollment: team.academics?.enrollment ?? "",
    religious_affiliation: team.academics?.religious_affiliation || ""
  }));

  const csv = parse(flatData);
  fs.writeFileSync("mens_lacrosse.csv", csv);
  console.log(`✅ Saved CSV: mens_lacrosse.csv`);

  console.timeEnd("⏱ Total scrape time");
}

scrape().catch(console.error);
