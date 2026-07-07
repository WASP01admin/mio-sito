# Supabase Import Guide - WASP Association Database

**Status:** Ready for import  
**Date:** 2026-07-03  
**Total Records:** 3,779 associations

---

## Pre-Import Checklist

- [ ] Backup existing `associations` table (if any)
- [ ] Verify Supabase project connection
- [ ] Have `master_merged_all.csv` downloaded locally
- [ ] Have `holding_coordinates.csv` for Phase 5 (separate import)

---

## Import Method 1: Via Supabase Dashboard (Easiest)

### Step 1: Navigate to SQL Editor
```
Supabase Dashboard → SQL Editor → New Query
```

### Step 2: Create/Truncate Associations Table
```sql
-- If table doesn't exist, it will be created
-- If it exists and you want fresh import, truncate first:
TRUNCATE TABLE associations CASCADE;
```

### Step 3: Import CSV via Copy Command
```sql
-- Copy the CSV data into the associations table
COPY associations(name, city, country, address, postal_code, email, phone, website)
FROM STDIN WITH (FORMAT csv, HEADER true);
```

Then paste the contents of `master_merged_all.csv` (rows 2 onwards) into the query.

---

## Import Method 2: Via psql (CLI - Recommended)

### Prerequisites
```bash
# Install psql if not already installed
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql-client
# Windows: Install PostgreSQL or use psql via WSL
```

### Step 1: Get Supabase Connection String
```
Supabase Dashboard → Settings → Database → Connection String
```
Copy the connection string (contains: postgresql://user:password@host:port/database)

### Step 2: Import the CSV
```bash
# Replace YOUR_CONNECTION_STRING with your actual connection string
psql "YOUR_CONNECTION_STRING" \
  -c "TRUNCATE TABLE associations CASCADE;"

# Then import the CSV
psql "YOUR_CONNECTION_STRING" \
  -c "\COPY associations(name, city, country, address, postal_code, email, phone, website) \
      FROM '/path/to/master_merged_all.csv' WITH (FORMAT csv, HEADER true);"
```

---

## Import Method 3: Via Node.js Script

```javascript
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

async function importAssociations() {
  // Read CSV
  const fileContent = fs.readFileSync('master_merged_all.csv', 'utf-8');
  const records = csv.parse(fileContent, {
    columns: true,
    skip_empty_lines: true
  });

  console.log(`Importing ${records.length} records...`);

  // Insert in batches of 100
  for (let i = 0; i < records.length; i += 100) {
    const batch = records.slice(i, i + 100);
    const { error } = await supabase
      .from('associations')
      .insert(batch);

    if (error) {
      console.error(`Error importing batch ${i}:`, error);
      process.exit(1);
    }
    console.log(`✓ Imported ${Math.min(i + 100, records.length)}/${records.length}`);
  }

  console.log('✅ Import complete!');
}

importAssociations();
```

---

## Post-Import Validation

### Verify Record Count
```sql
SELECT COUNT(*) as total_records FROM associations;
-- Expected: 3,779
```

### Verify Data Quality
```sql
-- Check records with names
SELECT COUNT(*) as with_names 
FROM associations 
WHERE name IS NOT NULL AND name != '';
-- Expected: ~3,779

-- Check records with email
SELECT COUNT(*) as with_email 
FROM associations 
WHERE email IS NOT NULL AND email != '';
-- Expected: ~3,121

-- Check records with website
SELECT COUNT(*) as with_website 
FROM associations 
WHERE website IS NOT NULL AND website != '';
-- Expected: ~3,079
```

### Check for Duplicates
```sql
-- Count duplicate names (by name + city combination)
SELECT name, city, COUNT(*) as count
FROM associations
WHERE name IS NOT NULL AND name != ''
GROUP BY name, city
HAVING COUNT(*) > 1
ORDER BY count DESC;
```

---

## Phase 5: Import Coordinates (Separate)

After associations are imported, import coordinates to separate table:

```sql
-- If coordinates table doesn't exist, create it:
CREATE TABLE IF NOT EXISTS association_coordinates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id UUID REFERENCES associations(id) ON DELETE CASCADE,
  lat NUMERIC(10, 8) NOT NULL,
  lon NUMERIC(11, 8) NOT NULL,
  source_file TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Then import coordinates from holding_coordinates.csv
COPY association_coordinates(lat, lon, source_file)
FROM STDIN WITH (FORMAT csv, HEADER true);
```

---

## Data Quality Notes

### Clean Records (3,405)
- ✅ Have proper organization names
- ✅ Validated email format (91.7%)
- ✅ Validated website format (90.4%)
- ✅ Ready for production use

### Salvaged Records (374)
- ⚠️ Names generated from address or email
- ⚠️ Flagged with `_review_needed = 'yes'`
- ✅ Have contact information (email/website/address)
- 📝 Should be reviewed before assigning to users

### Review Flagged Records
```sql
-- Find all salvaged records
SELECT name, email, website, address, _review_needed, _file
FROM associations
WHERE _source = 'salvage'
ORDER BY _file, name;

-- After review, update the record:
UPDATE associations
SET _review_needed = 'no'
WHERE id = 'UUID-HERE';
```

---

## Troubleshooting

### Error: "violates not-null constraint"
**Cause:** A required column is missing  
**Solution:** Ensure all rows have values for required columns (name, city, etc.)

### Error: "duplicate key value"
**Cause:** Email or name appears twice  
**Solution:** Check for duplicates using the validation query above

### Error: "invalid input syntax"
**Cause:** Data format doesn't match column type  
**Solution:** Review the CSV encoding and field types

### Large Import Fails
**Cause:** Supabase timeout on large batch  
**Solution:** Use the Node.js script method with batch processing (100 records at a time)

---

## Next Steps After Import

1. ✅ **Import associations data** (this step)
2. ✅ **Import coordinates** (Phase 5 - holding_coordinates.csv)
3. ⏳ **Review salvaged records** (_review_needed = 'yes')
4. ⏳ **Generate WASP cards** for approved associations
5. ⏳ **Set up search** and filtering UI

---

## Files in This Consolidation

```
consolidation/phase_1/
├── metadata/
│   ├── master_merged_all.csv          ← IMPORT THIS (3,779 records)
│   ├── master_clean.csv               (backup: 3,405 clean-only)
│   ├── master_unverified_salvage.csv  (reference: 374 salvaged)
│   ├── holding_coordinates.csv        (Phase 5: 249 LAT/LON pairs)
│   └── *.json                         (audit reports)
└── [scripts and logs]
```

---

**Status: READY FOR IMPORT ✅**

Next action: Choose import method above and execute.
