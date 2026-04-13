# NCSA Lacrosse College Database

Simple database of all 436 men's lacrosse college programs.

## Files

- **schools.json** - Main data file (THIS IS WHAT YOU USE)
- **scrape.js** - Script to re-scrape NCSA and update schools.json
- **search.js** - Search for schools
- **verify.js** - Check data quality

## Data Structure

Each school in `schools.json` has:

```json
{
  "school": "Duke University",
  "city": "Durham",
  "state": "North Carolina",
  "association": "NCAA",
  "division": 1,
  "conference": "Atlantic Coast Conference",
  "head_coach": "John Danowski",
  "coach_email": "",
  "official_website": "https://duke.edu",
  "tuition": 66104,
  "enrollment": 6717,
  "size": "Medium",
  "religious_affiliation": "None"
}
```

## Usage

### View the data
```bash
cat schools.json | head -50
```

### Search for schools
```bash
node search.js "Duke"
node search.js "North Carolina"
```

### Re-scrape NCSA (updates coach names)
```bash
node scrape.js
```

### Check data quality
```bash
node verify.js
```

## Adding Coach Emails

The `coach_email` field is empty for most schools. To add emails:

1. Open `schools.json`
2. Find the school
3. Add the email to `coach_email` field
4. Save

Or import to a spreadsheet for easier editing.

## Stats

- Total schools: 436
- NCAA D1: 76
- NCAA D2: 75  
- NCAA D3: 237
- NAIA: 28
- Junior College: 20

Coach names: 95% complete (from NCSA)
Coach emails: You need to add these manually

## Re-scraping

To get fresh data from NCSA:
```bash
node scrape.js
```

This updates:
- Coach names
- Tuition
- Enrollment
- Conference info

Takes about 7-10 minutes for all 436 schools.
