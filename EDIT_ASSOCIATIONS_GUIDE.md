# Editing Associations - Quick Guide

## Two Ways to Edit

### 1. Individual Edit (Admin Page)
```
1. Open Associations page in admin
2. Find the association to edit
3. Click "Edit" button on the row
4. Modal opens with editable fields:
   - Latitude
   - Longitude
   - Email
   - Secondary Email
5. Change values, click "Save"
6. Record updates instantly
```

**Location:** Top right of each row in the table
**Best for:** Single records, quick fixes, verifying data
**Access:** From anywhere (web admin page)

---

### 2. Bulk Update (CSV)
```
1. Create CSV file with columns:
   code,lat,lng,email,email_secondary
   
2. Add rows:
   ITA0001,41.8719,12.5674,new@example.com,secondary@example.com
   ITA0002,43.1234,11.4567,another@example.com,
   
3. Save as: updates.csv

4. Run from terminal:
   node update_associations_bulk.js updates.csv
   
5. Script updates matching codes and shows results
```

**Best for:** Updating 10+ records at once, batch coordinate corrections
**Access:** Requires terminal (from your PC with project files)
**Reference:** Shown in blue box on admin page

---

## CSV Format (Bulk Update)

```
code,lat,lng,email,email_secondary
ITA0001,41.8719,12.5674,user@example.com,alternate@example.com
ITA0002,43.1234,11.4567,contact@example.com,
ITA0003,,,,
```

**Rules:**
- First row is header (required)
- `code` must match existing association code exactly
- `lat`/`lng` must be valid decimal numbers (-90 to 90 for lat, -180 to 180 for lng)
- Empty cells are OK (won't update that field)
- Missing columns are OK (won't update those fields)

---

## What Fields Can Be Edited?

**Individual Edit (via Admin Page):**
- ✅ Latitude
- ✅ Longitude
- ✅ Email (primary)
- ✅ Email (secondary)

**Bulk Update (via CSV):**
- ✅ Latitude
- ✅ Longitude
- ✅ Email (primary)
- ✅ Email (secondary)

**Cannot Edit:**
- ❌ Code (unique identifier, immutable)
- ❌ Name, City, Country, Address (use re-import if data is wrong)
- ❌ Phone, Website, Facebook URL (rarely updated)

---

## Scenarios

### Scenario 1: Add missing coordinates to one association
```
→ Use: Individual Edit button in admin page
→ No terminal needed
→ Complete in seconds
```

### Scenario 2: Fix 50 email addresses from spreadsheet
```
→ Use: Bulk Update script
→ Extract codes + new emails from spreadsheet
→ Create CSV
→ Run: node update_associations_bulk.js emails.csv
```

### Scenario 3: Add coordinates to all associations without them
```
→ Use: Geocoding script (future feature)
→ Or manual bulk update if you have coordinates list
```

### Scenario 4: Verify one association's data
```
→ Use: Admin page table (view all fields)
→ Click Edit to inspect current values
→ Make changes if needed
```

---

## From Other Locations

**Problem:** You're away from your PC with project files. Need to edit an association.

**Solution:** Use the Admin Page Edit button
```
✓ No terminal needed
✓ Accessible from any browser/device
✓ Instant save
✓ Reference box shows bulk command for later
```

The bulk update script command is visible in the blue "📝 Bulk Update" box on the admin page, so you never forget it.

---

## Error Handling

**Individual Edit:**
- ❌ Invalid coordinates → Error shown in modal, not saved
- ❌ Invalid email → Error shown in modal, not saved
- ✓ Empty fields → OK (allowed for optional fields)

**Bulk Update:**
- ❌ Code not found → Skipped with warning
- ❌ Invalid coordinates → Skipped with warning
- ✓ Partial rows → Only found codes are updated
- ✓ CSV with errors → Script continues, updates valid rows

---

## Tips

1. **Always verify lat/lng format:** Decimal numbers only (41.8719, not 41° 52' 18")
2. **Email validation:** Basic format check (must have @ and .)
3. **Backup before bulk:** Keep original CSV for reference
4. **Test with small batch first:** Try 5 records before updating 1000
5. **Check results:** After bulk update, refresh admin page to verify

---

## Admin Page Reference Boxes

Two reference boxes appear in the top-right corner of the admin page:

**🧭 Import Gospel** - How to import new countries (always available)

**📝 Bulk Update** - How to run bulk updates from terminal (always available)

No need to memorize or search for docs. Everything is in the corner.

---

**Questions?** Both edit methods are error-safe. Invalid data won't save. Try editing!
