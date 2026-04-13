# NCSA Men's Lacrosse College Scraper

Scrapes men's lacrosse program data from NCSA Sports for recruiting purposes.

## Data Collected

For each of **436 schools**:
- School name & official website
- Location (city, state)
- Athletic association (NCAA D1/D2/D3, NAIA, JC)
- Conference
- Head coach name
- Tuition (out-of-state)
- Enrollment & size category
- Religious affiliation

## Files

| File | Purpose |
|------|---------|
| `scrape.js` | Main scraper - collects all data from NCSA |
| `mens_lacrosse.json` | Full data (nested structure) |
| `mens_lacrosse.csv` | Flat data for Excel/Sheets |
| `search.js` | Search tool for looking up schools |
| `verify.js` | Data quality report |
| `VERIFICATION_CHECKLIST.md` | Manual verification guide |

## Usage

### Run the scraper
```bash
node scrape.js
```
Takes ~7 minutes to scrape all 436 schools.

### Search for a school
```bash
node search.js "Syracuse"
node search.js "Ohio"
```

### Check data quality
```bash
node verify.js
```

### Open in Excel/Google Sheets
```bash
open mens_lacrosse.csv
```

## ⚠️ Important for Recruiting

**DO NOT blindly trust this data for recruiting outreach!**

1. **Coach names may be outdated** - coaches change jobs frequently
2. **21 schools are missing coach names** - need manual lookup
3. **Always verify** on the school's official athletic website before contacting

**Recommended workflow:**
1. Filter schools by division, location, etc.
2. For each target school, verify:
   - Current head coach (check athletic website)
   - Coach email (not included in this data)
   - Recent program news (Google it)
3. Only contact after verification

See `VERIFICATION_CHECKLIST.md` for details.

## Data Quality

✅ **Complete**: 436 schools  
⚠️ **Missing coach**: 21 schools (4.8%)  
⚠️ **Missing tuition**: 11 schools (2.5%)  
⚠️ **Missing website**: 9 schools (2.1%)

### Breakdown by Division
- NCAA D1: 76 schools
- NCAA D2: 75 schools
- NCAA D3: 237 schools
- NAIA: 28 schools
- Junior College: 20 schools

## Re-running the Scraper

Data changes over time (new coaches, tuition increases, etc.). Re-run before each recruiting cycle:

```bash
# Backup old data
mv mens_lacrosse.json mens_lacrosse_backup.json

# Run fresh scrape
node scrape.js
```

## What's Next?

1. **Add coach emails** - scrape from official athletic websites
2. **Add recruiting coordinator info** - often different from head coach
3. **Add program stats** - roster size, graduation rate, etc.
4. **Add automation** - schedule regular scrapes to catch updates

---

Built for recruiting - use responsibly! Always verify data before reaching out to coaches.
