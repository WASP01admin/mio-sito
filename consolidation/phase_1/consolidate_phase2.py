#!/usr/bin/env python3
"""
Phase 2: Consolidation - Fuzzy Deduplication
- Loads all deduplicated CSVs from Phase 1
- Normalizes columns across different file formats
- Uses fuzzy matching (name + city) to identify cross-file duplicates
- Merges records intelligently, keeping most complete data
- Outputs master deduplicated CSV
"""

import os
import csv
import json
from pathlib import Path
from datetime import datetime
from difflib import SequenceMatcher
from collections import defaultdict

# Directory structure
PHASE1_DIR = Path(__file__).parent
DEDUP_STAGING_DIR = PHASE1_DIR / "dedup_staging"
COORDINATES_DIR = PHASE1_DIR / "coordinates"
METADATA_DIR = PHASE1_DIR / "metadata"

# Column mapping patterns (flexible to handle variations)
COLUMN_MAPPINGS = {
    "name": [
        "name", "nome", "association", "associazione", "organizacao",
        "organization", "org name", "facility name", "title"
    ],
    "city": [
        "city", "città", "localita", "locality", "location", "town",
        "comune", "place", "region"
    ],
    "email": [
        "email", "e-mail", "mail", "contact email", "primary email"
    ],
    "phone": [
        "phone", "telephone", "tel", "telefono", "contact phone", "number"
    ],
    "website": [
        "website", "web", "url", "web page", "web site", "sito web", "homepage"
    ],
    "address": [
        "address", "indirizzo", "street", "location", "sede"
    ],
    "country": [
        "country", "nazione", "paese"
    ],
    "postal_code": [
        "postal code", "zip", "postal", "cap", "zip code", "postcode"
    ],
}


def detect_header_row(file_path, max_rows=20):
    """Auto-detect header row by looking for common column keywords."""
    try:
        with open(file_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
            for row_idx, line in enumerate(f):
                if row_idx > max_rows:
                    return 0, []

                cols = [c.lower().strip() for c in line.split(',')]
                col_text = " ".join(cols[:10])

                # Check if this looks like a header
                keywords = ["name", "email", "city", "phone", "web", "address",
                           "nome", "email", "città", "localita", "country", "map"]
                if sum(1 for k in keywords if k in col_text) >= 2:
                    # Found header row
                    with open(file_path, 'r', encoding='utf-8-sig', errors='ignore') as f2:
                        reader = csv.reader(f2)
                        for i in range(row_idx + 1):
                            header = next(reader, None)
                        return row_idx, header or []
    except:
        pass

    return 0, []


def normalize_column_name(col_name):
    """Map a CSV column name to a standard key (name, city, email, etc)."""
    col_lower = col_name.lower().strip()

    for standard_key, patterns in COLUMN_MAPPINGS.items():
        for pattern in patterns:
            if pattern in col_lower:
                return standard_key

    return None


def load_csv_with_normalization(file_path):
    """
    Load CSV and return list of dicts with normalized column names.
    Returns (records, normalized_headers, file_name)
    """
    file_name = file_path.name

    try:
        header_idx, header_row = detect_header_row(file_path)

        with open(file_path, 'r', encoding='utf-8-sig', errors='ignore') as f:
            reader = csv.reader(f)

            # Skip to header row
            for _ in range(header_idx + 1):
                next(reader, None)

            # Read actual header
            if not header_row:
                header_row = next(reader, None)

            if not header_row:
                return [], [], file_name

            # Normalize column names
            normalized_headers = []
            col_mapping = {}  # original -> normalized
            for i, col in enumerate(header_row):
                standard = normalize_column_name(col)
                normalized_headers.append(standard or f"_col{i}")
                col_mapping[i] = normalized_headers[-1]

            # Load records
            records = []
            for row in reader:
                if not any(row):  # skip empty rows
                    continue

                record = {
                    "_file": file_name,
                    "_raw_row": len(records) + 1,
                }
                for i, val in enumerate(row):
                    col_key = col_mapping.get(i, f"_col{i}")
                    record[col_key] = val.strip() if val else ""

                # Add original columns for debugging
                for i, (orig_col, val) in enumerate(zip(header_row, row)):
                    if orig_col not in record:
                        record[orig_col] = val.strip() if val else ""

                records.append(record)

            return records, normalized_headers, file_name

    except Exception as e:
        print(f"[WARN] Error loading {file_path.name}: {e}")
        return [], [], file_name


def fuzzy_match(str1, str2, threshold=0.75):
    """Simple fuzzy match using SequenceMatcher."""
    s1 = str1.lower().strip()
    s2 = str2.lower().strip()

    if not s1 or not s2:
        return False

    ratio = SequenceMatcher(None, s1, s2).ratio()
    return ratio >= threshold


def merge_records(records_group):
    """
    Merge a group of duplicate records, keeping the most complete data.
    Returns a single merged record dict.
    """
    if not records_group:
        return {}

    if len(records_group) == 1:
        return records_group[0]

    # Start with the most complete record (most non-empty fields)
    merged = max(records_group, key=lambda r: sum(1 for k, v in r.items() if v and (isinstance(v, str) and not k.startswith('_'))))

    # Fill in missing fields from other records
    for record in records_group:
        for key, val in record.items():
            if not key.startswith('_'):
                if not merged.get(key) and val:
                    merged[key] = val

    # Mark source files
    sources = [r.get('_file', 'unknown') for r in records_group]
    merged['_merged_from'] = '; '.join(sorted(set(sources)))
    merged['_duplicate_count'] = len(records_group)

    return merged


def deduplicate_records(all_records):
    """
    Group records by fuzzy match on (name + city).
    Returns list of merged records.
    """
    # Build match groups
    matched_indices = set()
    groups = []

    for i, rec_i in enumerate(all_records):
        if i in matched_indices:
            continue

        name_i = rec_i.get('name', '')
        city_i = rec_i.get('city', '')

        if not name_i:  # skip records without name
            groups.append([rec_i])
            matched_indices.add(i)
            continue

        # Find all matches
        group = [rec_i]
        matched_indices.add(i)

        for j in range(i + 1, len(all_records)):
            if j in matched_indices:
                continue

            rec_j = all_records[j]
            name_j = rec_j.get('name', '')
            city_j = rec_j.get('city', '')

            if not name_j:
                continue

            # Fuzzy match on name (stricter) and city (if available)
            if fuzzy_match(name_i, name_j, threshold=0.80):
                if not city_i or not city_j or fuzzy_match(city_i, city_j, threshold=0.75):
                    group.append(rec_j)
                    matched_indices.add(j)

        groups.append(group)

    # Merge each group
    merged = [merge_records(g) for g in groups]

    return merged


def main():
    print("=" * 60)
    print("PHASE 2: FUZZY DEDUPLICATION (name+city matching)")
    print("=" * 60)

    # Step 1: Load all CSV files
    print(f"\n[LOAD] CSV files from dedup_staging/...")

    csv_files = sorted(DEDUP_STAGING_DIR.glob("*.csv"))
    all_records = []
    file_metadata = {}

    for csv_file in csv_files:
        records, headers, fname = load_csv_with_normalization(csv_file)
        file_metadata[fname] = {
            "records": len(records),
            "headers": [h for h in headers if h],
        }
        all_records.extend(records)
        print(f"  [OK] {fname}: {len(records)} records")

    print(f"\n[TOTAL] Loaded {len(all_records)} records from {len(csv_files)} files")

    # Step 2: Deduplicate
    print(f"\n[DEDUPLICATE] Using fuzzy match (name+city, threshold 0.80)...")
    merged_records = deduplicate_records(all_records)

    print(f"\n[RESULTS]")
    print(f"  Original records: {len(all_records)}")
    print(f"  After dedup: {len(merged_records)}")
    print(f"  Duplicates removed: {len(all_records) - len(merged_records)}")

    # Step 3: Write master CSV
    print(f"\n[EXPORT] Master deduplicated CSV...")

    # Collect all column names
    all_columns = set()
    for record in merged_records:
        all_columns.update(record.keys())

    # Separate data and metadata columns
    data_cols = sorted([c for c in all_columns if not c.startswith('_')])
    meta_cols = sorted([c for c in all_columns if c.startswith('_')])

    # Put common columns first
    priority_cols = ['name', 'city', 'email', 'phone', 'website', 'address', 'country', 'postal_code']
    data_cols = [c for c in priority_cols if c in data_cols] + [c for c in data_cols if c not in priority_cols]

    # Combine all columns
    columns = data_cols + meta_cols

    master_file = METADATA_DIR / "master_deduplicated.csv"
    with open(master_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=columns, restval='')
        writer.writeheader()
        writer.writerows(merged_records)

    print(f"  Saved to: {master_file.name}")

    # Step 4: Create dedup report
    print(f"\n[REPORT] Creating deduplication report...")

    dedup_report = {
        "timestamp": datetime.now().isoformat(),
        "phase": "phase_2_fuzzy_dedup",
        "source_records": len(all_records),
        "merged_records": len(merged_records),
        "duplicates_removed": len(all_records) - len(merged_records),
        "dedup_ratio": f"{(1 - len(merged_records)/len(all_records))*100:.1f}%",
        "files_processed": len(csv_files),
        "file_details": file_metadata,
    }

    report_file = METADATA_DIR / "phase_2_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(dedup_report, f, indent=2)

    print(f"  Saved to: {report_file.name}")

    print("\n" + "=" * 60)
    print("OK - PHASE 2 COMPLETE")
    print("=" * 60)
    print(f"\n[OUTPUT]")
    print(f"  Master CSV: {master_file}")
    print(f"  Report: {report_file}")
    print(f"\n[NEXT] Phase 3 - Validation & Cleanup")
    print(f"\nSummary:")
    print(f"  {len(all_records)} records -> {len(merged_records)} unique associations")
    print(f"  Removed {dedup_report['duplicates_removed']} duplicates ({dedup_report['dedup_ratio']})")


if __name__ == "__main__":
    main()
