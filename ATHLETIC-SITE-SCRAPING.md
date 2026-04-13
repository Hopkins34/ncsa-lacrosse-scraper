# Athletic Site Scraping Guide

## What This Does

Scrapes **official athletic websites** to get current coach info that NCSA might not have:
- ✅ Current head coach name (verified from source)
- ✅ Coach email addresses (when available)
- ✅ Full coaching staff (head coach + assistants)
- ✅ Athletic website URL for each school

## Quick Start

### 1. Test with manually-mapped schools (recommended)
```bash
node scrape-coaches.js test
```
Scrapes 10 schools we know the athletic domains for (Duke, Syracuse, etc.)

### 2. Merge new data into your dataset
```bash
node merge-coach-data.js
```
Creates `mens_lacrosse_updated.json` and `mens_lacrosse_updated.csv`

### 3. Check results
```bash
node search.js "Duke"
```

## Advanced Usage

### Scrape all D1 schools
```bash
node scrape-coaches.js d1
```
Scrapes all 76 D1 schools (takes ~2 minutes)

### Scrape schools with missing coaches
```bash
node scrape-coaches.js missing
```
Targets the 21 schools where NCSA had no coach data

### Scrape ALL schools
```bash
node scrape-coaches.js all
```
⚠️ Takes ~10-15 minutes for all 436 schools

## How It Works

### 1. Athletic Domain Mapping
`athletic-domains.json` contains manually verified athletic websites for top schools:
- Syracuse → cuse.com
- Duke → goduke.com
- Johns Hopkins → hopkinssports.com
- etc.

### 2. Pattern Matching
For schools not in the manual list, we try common patterns:
- `go[schoolname].com`
- `[schoolname]athletics.com`
- `[schoolname]sports.com`

### 3. Coach Extraction
The scraper looks for:
- Sidearm Sports roster format (used by most NCAA schools)
- Generic staff listings
- Text patterns like "Head Coach: Name"

## Current Results (Test Run)

✅ **9/10 schools** found coach data  
✅ **5/10 schools** found email addresses  
✅ **All assistant coaches** captured

### Example Output:
```
Duke University
  Coach: John Danowski
  Email: ec83@duke.edu
  Athletic Site: https://goduke.com
```

## Adding More Schools

To add athletic domains for schools you care about:

1. **Find the athletic website** (Google "[school name] athletics")
2. **Add to `athletic-domains.json`**:
```json
{
  "Syracuse University": "cuse.com",
  "Your School": "schoolathletics.com"
}
```
3. **Re-run the scraper**

## Limitations & Notes

### ✅ What Works Well
- NCAA Division 1 schools (most use Sidearm Sports platform)
- Schools with standard roster pages
- Finding head coaches and assistant coaches

### ⚠️ Challenges
- Email addresses only on ~50% of sites
- Some schools hide coach info behind login
- D3/NAIA schools often have custom sites (harder to scrape)
- Coach phone numbers rarely public on athletic sites

### 💡 Recommendations
1. **Start with your target schools** - manually map their athletic domains first
2. **Verify critical schools** - always double-check top targets before outreach
3. **Re-run quarterly** - coaching changes happen frequently
4. **Get emails from staff directories** - athletic sites often link to university staff pages with more contact info

## Workflow for Recruiting

1. **Filter to your target division/conference**
   ```bash
   node search.js "Big Ten"
   ```

2. **Run scraper on those schools**
   - Add their athletic domains to `athletic-domains.json`
   - Run `node scrape-coaches.js test`

3. **Merge the data**
   ```bash
   node merge-coach-data.js
   ```

4. **Export to Google Sheets**
   - Open `mens_lacrosse_updated.csv`
   - Add tracking columns (Contact Date, Response, Notes)

5. **Manual verification**
   - Visit each athletic site
   - Verify coach is still there (check recent news)
   - Look for recruiting coordinator if different from head coach

## Next Steps

### To improve email collection:
- Scrape university staff directory pages
- Look for "contact" pages on athletic sites
- Cross-reference with LinkedIn

### To automate updates:
- Schedule monthly scrapes
- Compare with previous data to detect coaching changes
- Alert when target schools change coaches

---

**Remember**: Athletic sites are more accurate than NCSA, but coaching changes happen mid-season. Always verify before contacting!
