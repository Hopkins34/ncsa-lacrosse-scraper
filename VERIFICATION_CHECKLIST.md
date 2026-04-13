# Data Verification Checklist for Recruiting

## Summary
- **Total Schools**: 436
- **Missing Head Coach**: 21 schools (4.8%)
- **Missing Tuition**: 11 schools (2.5%)
- **Missing Website**: 9 schools (2.1%)

## Before You Start Contacting Coaches

### ✅ CRITICAL: Verify These Steps

1. **Manually verify 5-10 target schools** before mass outreach
   - Check coach name on official athletic website
   - Get coach email from athletic site (not in this data)
   - Verify they still coach there (coaches move jobs frequently!)

2. **For missing coaches** - 21 schools need manual lookup:
   - Visit school's official athletic website
   - Look for Men's Lacrosse roster/staff page
   - Add coach name manually to your contact list

3. **Cross-check recent news**
   - Google "[School Name] lacrosse coach" to check for recent changes
   - Coaching changes happen mid-season and off-season

## Top Priority Schools to Verify (D1 Programs)

Since you're recruiting, these top programs are critical to get right:

| School | Current Data | Verify URL |
|--------|--------------|------------|
| Johns Hopkins | **MISSING COACH** ⚠️ | https://www.ncsasports.org/mens-lacrosse/colleges |
| Duke | Matt Danowski | https://goduke.com/sports/mens-lacrosse |
| Syracuse | Pat March | https://cuse.com/sports/mens-lacrosse |
| Maryland | John Tillman | https://umterps.com/sports/mens-lacrosse |
| Virginia | Lars Tiffany | https://virginiasports.com/sports/mens-lacrosse |
| Penn State | Jeff Tambroni | (check data) |
| Notre Dame | Kevin Corrigan | (check data) |

## Schools With Missing Data

### Missing Head Coach (21 schools)
These need manual lookup before contacting:

**NCAA D1 (Priority)**
- Bellarmine University ⚠️
- Johns Hopkins University ⚠️
- Long Island University ⚠️

**NCAA D2**
- American International College

**NCAA D3 (17 schools)**
- Anderson University – Indiana
- Ferrum College
- King's College – Pennsylvania
- Marietta College
- Monmouth College
- North Central University
- Northern Vermont University – Lyndon
- Pennsylvania College of Technology
- Rosemont College
- SUNY Canton
- University of Dallas
- University of Maine at Farmington
- Whittier College

**JC (1 school)**
- Brookdale Community College
- Delaware Technical Community College

**NAIA (2 schools)**
- Morningside University
- Multnomah University

### Missing Tuition (11 schools)
Not critical for recruiting, but note:
- 4 Military Academies (free tuition)
- 7 other schools

## Recommended Workflow

1. **Filter your target schools** by division, location, etc.
2. **For each target school:**
   - ✅ Verify coach name on official athletic website
   - ✅ Find coach email (athletic.site/staff usually)
   - ✅ Google recent news about the program
   - ✅ Check roster for graduation/recruiting needs
3. **Track your outreach** separately from this data
4. **Re-run scraper** before each recruiting cycle (data changes!)

## Data Quality Notes

- **Coach names**: Current as of scrape date, but coaches change jobs!
- **Tuition**: Approximate, verify with school financial aid office
- **Enrollment**: Approximate
- **Conferences**: Some schools change conferences

## Quick Spot Check Examples

Run these checks yourself to build confidence in the data:

```bash
# Check a school you're familiar with
node -e "
const data = require('./mens_lacrosse.json');
const school = data.find(s => s.school.includes('YOUR_SCHOOL_NAME'));
console.log(JSON.stringify(school, null, 2));
"
```

## Next Steps

1. Export CSV to Google Sheets
2. Add columns for: Coach Email, Contact Date, Response Status
3. Manually verify your top 20 target schools
4. Start outreach with verified data only
5. Build relationships - mention specifics about their program!

---
**Remember**: This data is a starting point. Always verify before contacting. One wrong coach name = loss of credibility.
