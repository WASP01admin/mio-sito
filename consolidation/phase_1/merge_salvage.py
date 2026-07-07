#!/usr/bin/env python3
"""
Merge clean records with salvageable records to maximize data recovery.
Strategy:
- Keep all 3,405 clean records (with names)
- Add 377 salvageable records (using email/address as identifier when no name)
- Flag salvage records for optional manual review
"""

import csv
from pathlib import Path

METADATA_DIR = Path("C:\\Users\\robbu\\Documents\\mio-sito\\consolidation\\phase_1\\metadata")

print("=" * 70)
print("MERGING CLEAN + SALVAGEABLE RECORDS")
print("=" * 70)
print()

# Load clean records
clean_file = METADATA_DIR / "master_clean.csv"
clean_records = []

with open(clean_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        row['_source'] = 'clean'
        row['_review_needed'] = 'no'
        clean_records.append(row)

print(f"Loaded {len(clean_records)} clean records")

# Load salvageable records
salvage_file = METADATA_DIR / "master_unverified_salvage.csv"
salvage_records = []

with open(salvage_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Only use email or website as a fallback name if it looks reasonable
        if not row['name'] or row['name'].startswith('[NO NAME'):
            # Generate a pseudo-name from address, email, or website
            if row['address']:
                row['name'] = f"Location: {row['address'][:50]}"
            elif row['email'] and '@' in row['email'] and not row['email'].startswith('http'):
                row['name'] = f"Contact: {row['email'].split('@')[0]}"
            elif row['website']:
                row['name'] = f"Website: {row['website'][:40]}"
            else:
                continue  # Skip if we can't create any identifier

        row['_source'] = 'salvage'
        row['_review_needed'] = 'yes'  # Flag for manual review
        row['_salvage_reason'] = row.get('_salvage_source', 'unknown')
        del row['_salvage_source']
        del row['_dropped_reason']
        salvage_records.append(row)

print(f"Prepared {len(salvage_records)} salvageable records for merging")
print()

# Merge datasets
merged_records = clean_records + salvage_records

print(f"Merged total: {len(merged_records)} records")
print()

# Write merged file
merged_file = METADATA_DIR / "master_merged_all.csv"

all_columns = [
    'name', 'city', 'country', 'address', 'postal_code', 'email', 'phone', 'website',
    '_source', '_review_needed', '_salvage_reason', '_file'
]

with open(merged_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=all_columns, restval='')
    writer.writeheader()
    writer.writerows(merged_records)

print(f"Written to: master_merged_all.csv")
print()

# Create summary
clean_count = len(clean_records)
salvage_count = len(salvage_records)
total = len(merged_records)

print("=" * 70)
print("FINAL SUMMARY")
print("=" * 70)
print()
print(f"Clean records (with proper names):        {clean_count:,}")
print(f"Salvaged records (address/email-based):    {salvage_count:,}")
print(f"TOTAL:                                    {total:,}")
print()
print(f"Improvement: +{salvage_count} records ({100*salvage_count/clean_count:.1f}% increase)")
print()
print("Output files:")
print(f"  1. master_clean.csv              - {clean_count:,} records (clean, ready to import)")
print(f"  2. master_unverified_salvage.csv - {salvage_count:,} records (needs review)")
print(f"  3. master_merged_all.csv         - {total:,} records (combined, flagged for review)")
print()
print("Recommendation:")
print(f"  Option A: Use master_clean.csv ({clean_count:,} records) - conservative")
print(f"  Option B: Use master_merged_all.csv ({total:,} records) - aggressive recovery")
print()
