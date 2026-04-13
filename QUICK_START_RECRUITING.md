# Quick Start Guide for Recruiting

## Your Data is Ready! 📊

**Main File**: `comprehensive_lacrosse_data.csv`
- All 436 schools
- Coach names (95% complete)
- 13 verified email addresses (D1 only so far)
- Sortable/filterable in Excel or Google Sheets

## What's in the Data

| Division | Schools | With Coaches | With Emails |
|----------|---------|--------------|-------------|
| D1       | 76      | 74 (97%)     | 13 (17%)    |
| D2       | 75      | 74 (99%)     | 0 (0%)      |
| D3       | 237     | 224 (95%)    | 0 (0%)      |
| NAIA     | 28      | 26 (93%)     | 0 (0%)      |
| JC       | 20      | 18 (90%)     | 0 (0%)      |

## Workflow for D2/D3 Recruiting

### 1. Open the CSV
```bash
open comprehensive_lacrosse_data.csv
```

### 2. Import to Google Sheets
- File → Import → Upload comprehensive_lacrosse_data.csv
- Add these columns for tracking:
  - `contact_date`
  - `email_sent`
  - `response_status`
  - `notes`

### 3. Filter Your Targets
**For D2 Schools:**
- Filter `division` = 2
- Filter `state` = your target states
- Sort by `tuition` (if budget matters)
- Sort by `enrollment` (school size preference)

**For D3 Schools:**
- Filter `division` = 3
- Same criteria as above

### 4. Find Missing Emails

For schools with `has_email` = NO:

**Option A: Visit Their Athletic Website**
1. Look at the `athletic_website` column (if populated)
2. Navigate to Mens Lacrosse → Staff/Roster
3. Look for mailto: links or contact forms

**Option B: Visit Official Website**
1. Use `official_website` column
2. Go to Athletics → Mens Lacrosse
3. Find staff directory

**Option C: Check NCSA**
1. Use `ncsa_url` column
2. Sometimes has contact forms

**Option D: LinkedIn**
1. Search "[Coach Name] [School] lacrosse"
2. Many coaches list their email in profiles

### 5. Manual Email Finding Script

I created tools to help:

```bash
# Search for a specific school
node search.js "Adelphi"

# Add athletic domains you discover
node add-school-domain.js
```

## Priority Order for Email Hunting

### Tier 1: Schools with Athletic Websites (Easiest)
Schools where `athletic_website` is not empty - just visit and scrape

### Tier 2: Known Athletic Platforms
Schools using Sidearm Sports, Presto Sports, or other standardized platforms

### Tier 3: Custom Sites
Small schools with custom sites - requires manual lookup

## Current Status

✅ **Ready to Use:**
- All school locations, divisions, conferences
- 95% have coach names from NCSA
- 13 D1 schools have verified emails

⏳ **In Progress:**
- D2 intensive scraper running now
- Will add more D2/D3 emails automatically

❌ **Needs Manual Work:**
- Most D2/D3 emails (they hide contact info better)
- Some D3 schools don't list coaches publicly

## Tips for Success

**Before Contacting:**
1. ✅ Verify coach still works there (Google recent news)
2. ✅ Check roster to see graduation needs
3. ✅ Personalize - mention something specific about their program
4. ✅ Have highlight film ready

**Email Best Practices:**
- Subject: "2027 Midfielder - [Your Name] - [Your HS/Club]"
- Keep it short (3-4 paragraphs max)
- Include key stats, GPA, test scores
- Link to film (YouTube/Hudl)
- Attach recruiting resume as PDF

**Follow Up:**
- Week 1: Initial email
- Week 2: Follow up if no response
- Week 3: Try phone call (if you find number)
- Week 4: Move on to next school

## Tools Available

```bash
# Search for schools
node search.js "Ohio"

# Scrape more D2 schools
node scrape-d2-d3-intensive.js d2

# Scrape D3 schools
node scrape-d2-d3-intensive.js d3

# Regenerate CSV after updates
node create-comprehensive-dataset.js
```

## What's Running Now

The D2 intensive scraper is trying to find athletic websites for all 75 D2 schools.
It's checking multiple URL patterns for each school.
Should finish in ~10-15 minutes and auto-update your CSV.

---

**Remember**: This data is a starting point. Always verify before sending emails!
