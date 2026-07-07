#!/usr/bin/env python3
"""
Phase 3: Consolidation - Validation & Cleanup
- Standardizes column names across all records
- Validates email, website, phone formats
- Removes empty/unusable records
- Creates clean import-ready CSV for Supabase
"""

import os
import csv
import json
import re
from pathlib import Path
from datetime import datetime

PHASE1_DIR = Path(__file__).parent
METADATA_DIR = PHASE1_DIR / "metadata"
COORDINATES_DIR = PHASE1_DIR / "coordinates"

# Master standardized column names (what the database expects)
STANDARD_COLUMNS = [
    'name',
    'city',
    'country',
    'address',
    'postal_code',
    'email',
    'phone',
    'website',
]

# Column priority mapping (which raw columns to use for each standard column)
COLUMN_PRIORITY = {
    'name': ['name', 'NAME', 'NOME', 'NOME ASSOCIAZIONE', 'Name'],
    'city': ['city', 'City', 'LOCALITÃ€', 'CITTÃ€', 'city'],
    'country': ['country', 'COUNTRY', 'Country'],
    'address': ['address', 'Address', 'INDIRIZZO', 'ADDRESS'],
    'postal_code': ['postal_code', 'postal code', 'postal', 'cap', 'postal code'],
    'email': ['email', 'EMAIL', 'Email', 'email1'],  # Take first email only
    'phone': ['phone', 'TELEFONO', 'Phone', 'Telephone', 'telephone'],
    'website': ['website', 'WEBSITE', 'WEB', 'WEB PAGE', 'Website', 'web'],
}


def extract_first_email(record):
    """Extract first non-empty email from multiple email columns."""
    for col in ['email', 'EMAIL', 'Email', 'email1', 'EMAIL 2', 'EMAIL 3']:
        val = record.get(col, '')
        if val and val.strip() and '@' in val:
            return val.strip()
    return ''


def extract_first_website(record):
    """Extract first non-empty website URL."""
    for col in ['website', 'WEBSITE', 'WEB', 'WEB PAGE', 'Website', 'web', 'Web']:
        val = record.get(col, '')
        if val and val.strip() and ('http' in val or '.' in val):
            return val.strip()
    return ''


def validate_email(email):
    """Basic email validation."""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone):
    """Check if phone looks reasonable (at least 5 digits)."""
    if not phone:
        return False
    digits = re.sub(r'\D', '', phone)
    return len(digits) >= 5


def validate_website(website):
    """Check if website looks reasonable."""
    if not website:
        return False
    website_lower = website.lower()
    return ('http' in website_lower or 'www' in website_lower or '.' in website)


def clean_record(record):
    """
    Clean and standardize a record.
    Returns dict with STANDARD_COLUMNS only.
    """
    cleaned = {}

    for std_col in STANDARD_COLUMNS:
        raw_cols = COLUMN_PRIORITY.get(std_col, [std_col])
        value = ''

        for raw_col in raw_cols:
            if raw_col in record:
                val = record.get(raw_col, '').strip()
                if val:
                    value = val
                    break

        # Special handling for email (take first only)
        if std_col == 'email':
            value = extract_first_email(record)

        # Special handling for website (take first valid only)
        if std_col == 'website':
            value = extract_first_website(record)

        cleaned[std_col] = value

    return cleaned


def main():
    print("=" * 60)
    print("PHASE 3: VALIDATION & CLEANUP")
    print("=" * 60)

    master_file = METADATA_DIR / "master_deduplicated.csv"
    output_file = METADATA_DIR / "master_clean.csv"

    # Step 1: Load and clean
    print(f"\n[LOAD] Master deduplicated CSV...")

    records = []
    validation_stats = {
        'total_loaded': 0,
        'valid_name': 0,
        'valid_email': 0,
        'valid_website': 0,
        'valid_phone': 0,
        'kept': 0,
        'dropped_no_name': 0,
        'issues': [],
    }

    try:
        with open(master_file, 'r', encoding='utf-8', errors='ignore') as f:
            reader = csv.DictReader(f)
            for row_num, row in enumerate(reader, start=2):
                validation_stats['total_loaded'] += 1

                # Clean the record
                cleaned = clean_record(row)

                # Validation checks
                if not cleaned['name'] or not cleaned['name'].strip():
                    validation_stats['dropped_no_name'] += 1
                    continue

                validation_stats['valid_name'] += 1

                if cleaned['email'] and validate_email(cleaned['email']):
                    validation_stats['valid_email'] += 1

                if cleaned['website'] and validate_website(cleaned['website']):
                    validation_stats['valid_website'] += 1

                if cleaned['phone'] and validate_phone(cleaned['phone']):
                    validation_stats['valid_phone'] += 1

                # Keep record if it has at least name + one other field
                other_fields = sum(1 for col in ['email', 'website', 'phone', 'address', 'city']
                                  if cleaned.get(col))
                if other_fields >= 1 or cleaned['name']:
                    records.append(cleaned)
                    validation_stats['kept'] += 1

    except Exception as e:
        print(f"[ERROR] Failed to load master CSV: {e}")
        return

    print(f"  Loaded: {validation_stats['total_loaded']}")
    print(f"  Dropped (no name): {validation_stats['dropped_no_name']}")
    print(f"  Cleaned records: {len(records)}")

    # Step 2: Write clean CSV
    print(f"\n[EXPORT] Clean CSV with standardized columns...")

    with open(output_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=STANDARD_COLUMNS, restval='')
        writer.writeheader()
        writer.writerows(records)

    print(f"  Saved to: {output_file.name}")

    # Step 3: Create validation report
    print(f"\n[VALIDATION] Report:")
    print(f"  Records with valid name: {validation_stats['valid_name']}")
    print(f"  Records with valid email: {validation_stats['valid_email']} ({100*validation_stats['valid_email']/max(1, validation_stats['valid_name']):.1f}%)")
    print(f"  Records with valid website: {validation_stats['valid_website']} ({100*validation_stats['valid_website']/max(1, validation_stats['valid_name']):.1f}%)")
    print(f"  Records with valid phone: {validation_stats['valid_phone']} ({100*validation_stats['valid_phone']/max(1, validation_stats['valid_name']):.1f}%)")

    report = {
        "timestamp": datetime.now().isoformat(),
        "phase": "phase_3_validation_cleanup",
        "input_records": validation_stats['total_loaded'],
        "output_records": len(records),
        "dropped_records": validation_stats['total_loaded'] - len(records),
        "validation_stats": validation_stats,
        "columns": STANDARD_COLUMNS,
    }

    report_file = METADATA_DIR / "phase_3_report.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2)

    print(f"\n[REPORT] Saved to: {report_file.name}")

    print("\n" + "=" * 60)
    print("OK - PHASE 3 COMPLETE")
    print("=" * 60)
    print(f"\n[OUTPUT]")
    print(f"  Clean master CSV: {output_file}")
    print(f"  Standardized columns: {', '.join(STANDARD_COLUMNS)}")
    print(f"  Final records: {len(records)}")
    print(f"\n[NEXT] Phase 4 - Create Supabase import script")
    print(f"\nYou now have:")
    print(f"  1. master_clean.csv - association data, ready for import")
    print(f"  2. holding_coordinates.csv - LAT/LON data, separate table")


if __name__ == "__main__":
    main()
