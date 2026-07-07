# Country Import Checklist - Rock Solid Process

Use this checklist for importing EVERY country. No deviations.

## Pre-Import (Before you start)

- [ ] **Get the source CSV file**
  - Obtain the country data CSV from your data source
  - Store in a dedicated folder: `./country_data/[COUNTRY_NAME]/`

- [ ] **Verify country name**
  - Must be EXACT match from valid list:
    - Italy ✓
    - Canada ✓
    - United Kingdom ✓
    - United States ✓
    - Australia ✓
    - New Zealand ✓
    - Ireland ✓
  - (Add to IMPORT_SCHEMA.md if new country)

- [ ] **Inspect the CSV**
  - Open in a spreadsheet
  - Identify columns and map to standard 14 headers:
    - Required: `name` (association name)
    - Optional: address, city, postal_code, email, email_secondary, phone, website, lat, lng, facebook_url, instagram, contact_person, extra_details
  - Note any variations (e.g., "Full Name" vs "name", "Phone Number" vs "phone")
  - Check for encoding issues (non-ASCII characters)

- [ ] **Create import script from template**
  ```bash
  cp import_country_template.js import_[COUNTRY_LOWERCASE].js
  # Example: cp import_country_template.js import_canada.js
  ```

## Configure Import Script

- [ ] **Edit the CONFIGURATION section only**
  ```javascript
  const COUNTRY_CONFIG = {
    countryName: 'Canada',  // ← Change this
    sourceCSVPath: './country_data/canada/associations.csv',  // ← Change this
    columnMapping: {
      "Association Code": "code",  // ← If needed, add CSV column → schema mappings
      "Full Name": "name",
      // Only if columns don't match standards!
    },
    preprocessRecords: null,  // ← Leave as null unless special processing needed
  };
  ```

- [ ] **Verify: Do NOT change any other code**
  - The import logic is universal
  - Column mapping logic is in association_import_utils.js
  - Validation rules are standardized
  - Batch insertion logic is identical

## Pre-Flight Checks

- [ ] **Run the import in DRY-RUN mode** (optional, if you want to preview)
  ```bash
  # Just parse and validate without inserting
  node import_canada.js --dry-run
  ```

- [ ] **Review generated audit files**
  - Check for expected record count
  - Note any validation warnings
  - Confirm no fatal errors

## Execute Import

- [ ] **Run the import script**
  ```bash
  node import_canada.js
  ```

- [ ] **Monitor console output**
  - Watch for batch completion messages
  - No errors should appear
  - Total inserted count matches expected

- [ ] **Verify generated files**
  - `[country]_associations_normalized.csv` - cleaned data
  - `[country]_import_audit.log` - complete report

## Post-Import Verification

- [ ] **Check the database counts**
  ```sql
  SELECT country, COUNT(*) as total,
    COUNT(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 1 END) as with_coords
  FROM associations
  WHERE country = 'Canada'
  GROUP BY country;
  ```
  
  Expected output should match audit report

- [ ] **Verify no duplicates introduced**
  ```sql
  SELECT code, COUNT(*) as cnt
  FROM associations
  WHERE country = 'Canada'
  GROUP BY code
  HAVING COUNT(*) > 1;
  ```
  
  Should return 0 rows

- [ ] **Check data completeness**
  ```sql
  -- Data quality by field
  SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as with_email,
    COUNT(CASE WHEN website IS NOT NULL AND website != '' THEN 1 END) as with_website,
    COUNT(CASE WHEN phone IS NOT NULL AND phone != '' THEN 1 END) as with_phone,
    COUNT(CASE WHEN lat IS NOT NULL AND lng IS NOT NULL THEN 1 END) as with_coordinates
  FROM associations 
  WHERE country = 'Canada';
  ```

- [ ] **Review sample records**
  - Open the normalized CSV in a spreadsheet
  - Spot-check 10-20 records
  - Verify data looks reasonable

- [ ] **Check map visibility**
  - Login to admin panel
  - Navigate to Associations
  - Click on [Country] tab
  - Verify count matches database
  - Check that records with coordinates show "ON MAP" badge

## If Issues Found

| Issue | Resolution |
|-------|-----------|
| "Missing required fields: name" errors | CSV has records with no name/organization. Check source data for blanks. |
| "Invalid country" error | Country name in script doesn't match IMPORT_SCHEMA.md list exactly (case-sensitive). |
| Duplicate codes detected | This country was already imported. Verify via SQL query before re-importing. |
| Coordinate validation errors | Check lat/lng formats. Should be decimal numbers (e.g., 41.8719, 12.5674). Both must be present if one is. |
| Email validation errors | Non-critical, logged to audit only. CSV email format issue—can be fixed in bulk edit. |
| Very low "with coordinates" count | Coordinate data is sparse in source—OK. We'll geocode missing coordinates later. |
| Very low "with email/website" count | This is OK—optional fields. Records still valid if they have a name. |
| Import script crashes | Check sourceCSVPath exists, country name is valid, Supabase credentials are set. |

## Done!

- [ ] **Archive the audit files**
  - Save `[country]_import_audit.log` for record-keeping
  - Save `[country]_associations_normalized.csv` for future reference

- [ ] **Update MEMORY if needed**
  - Document any country-specific quirks
  - Note data quality issues for future improvement

- [ ] **Move on to next country**
  - Repeat this checklist from the top
  - Same process, same validation, same standards

---

## Key Principle: CONSISTENCY

Every country import uses:
- ✓ Same schema (IMPORT_SCHEMA.md)
- ✓ Same validation rules (association_import_utils.js)
- ✓ Same batch insertion (100 records)
- ✓ Same audit logging
- ✓ Same verification queries

**No exceptions. No custom logic per country.**

This is what makes the system scalable to 1,000,000+ records.
