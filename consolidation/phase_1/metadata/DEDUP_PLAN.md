# Phase 1: Deduplication Plan
**Created:** 2026-07-03
**Status:** In Progress

## Summary
- **Total CSV files:** 32
- **Duplicate groups:** 4 (Brescia x3, UK x2, Canada x2, Ireland x2)
- **Files to exclude:** 5 (empty/too small)
- **Files to process:** 23 (after dedup)

---

## Deduplication Strategy

### BRESCIA (3 files → keep 1)
Files:
1. `Associazioni_Animaliste_Brescia - Associazioni Animaliste Brescia.csv` (1,732 bytes) — messy, headers + explanation text
2. `Associazioni_Animaliste_Brescia.xlsx - Associazioni Animaliste Brescia.csv` (3,870 bytes) — clean, proper columns
3. `CSV Associazioni_Animaliste_Brescia.xlsx - Associazioni Animaliste Brescia.csv` (3,870 bytes) — identical to #2

**Decision:** Keep file #2 (identical to #3). Delete #1 and #3.
**Reason:** File #2 has proper headers, no explanatory text, all columns present.

### UK (2 files → merge both, keep 1)
Files:
1. `ASSOCIATIONS - UK.csv` (37,930 bytes) — columns: NAME, WEB PAGE, EMAIL
2. `ASSOCs - UK.csv` (35,017 bytes) — columns include LAT/LON coordinates

**Decision:** Keep #2 (ASSOCs - UK.csv) as primary since it has coordinates.
**Action:** Extract coordinates from #2 first; compare for missing records and backfill from #1 if needed.

### CANADA (2 files → merge both, keep 1)
Files:
1. `ASSOCIATIONS - CANADA.csv` (11,788 bytes)
2. `ASSOCs - CANADA.csv` (39,829 bytes)

**Decision:** Keep #2 (ASSOCs - CANADA.csv) as primary (larger, likely more complete).
**Action:** Check for missing records in #1 and backfill if needed.

### IRELAND (2 files → merge both, keep 1)
Files:
1. `ASSOCIATIONS - IRELAND.csv` (1,878 bytes)
2. `ASSOCs - IREL.csv` (1,210 bytes)

**Decision:** Keep #1 (ASSOCIATIONS - IRELAND.csv) as primary (larger).
**Action:** Check if #2 adds any missing records.

---

## Files to EXCLUDE (empty/unusable)
```
❌ ASSOCIATIONS - SouthAfrika.csv (176 bytes) — only headers
❌ ASSOCs - GER.csv (288 bytes) — only 3 rows, unusable
❌ ASSOCs - NL.csv (457 bytes) — insufficient data
❌ ASSOCs - ROMANIA.csv (164 bytes) — only headers
❌ ASSOCs - SWISS.csv (0 bytes) — empty file
```

---

## Deduplication Process (Step-by-step)

1. ✅ **Step 1:** Identify duplicates and exclude unusable files → **COMPLETE**
2. ⏳ **Step 2:** Move primary versions to `dedup_staging/`
3. ⏳ **Step 3:** Extract coordinates from all files → `coordinates/holding_coordinates.csv`
4. ⏳ **Step 4:** Create final deduplicated CSV set in `dedup_staging/`
5. ⏳ **Step 5:** Inventory: count records, validate structure, create metadata

---

## Phase 1 Completion Checklist
- [ ] Convert Excel files to CSV (if any remain)
- [ ] Move/keep primary versions of duplicate files
- [ ] Extract all LAT/LON coordinate data
- [ ] Create `holding_coordinates.csv`
- [ ] Validate schema consistency across all files
- [ ] Create final inventory report
- [ ] Create staging DB copy (test table)

**Next Phase:** Phase 2 - Deduplication (name+city+email fuzzy matching)
