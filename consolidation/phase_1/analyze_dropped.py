#!/usr/bin/env python3
"""
Analyze the 3,025 dropped records from Phase 3.
Find if they have useful data (email, website, etc.) that we're losing.
"""

import csv
from pathlib import Path
from collections import defaultdict

METADATA_DIR = Path("C:\\Users\\robbu\\Documents\\mio-sito\\consolidation\\phase_1\\metadata")

# Read master_deduplicated.csv
master_file = METADATA_DIR / "master_deduplicated.csv"
kept_records = set()

print("=" * 60)
print("ANALYZING DROPPED RECORDS FROM PHASE 3")
print("=" * 60)
print()

# First, get list of kept records (by name or unique identifier)
clean_file = METADATA_DIR / "master_clean.csv"
with open(clean_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        kept_records.add(row['name'].strip())

print(f"Kept records: {len(kept_records)}")
print()

# Now analyze all records in master_deduplicated
dropped_analysis = {
    'total_dropped': 0,
    'with_email': 0,
    'with_website': 0,
    'with_address': 0,
    'with_phone': 0,
    'with_any_data': 0,
    'completely_empty': 0,
    'samples_with_email': [],
    'samples_with_website': [],
}

print("Analyzing master_deduplicated.csv for dropped records...")
print()

with open(master_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        name_variants = [
            row.get('name', '').strip(),
            row.get('NAME', '').strip(),
            row.get('NOME', '').strip(),
            row.get('NOME ASSOCIAZIONE', '').strip(),
            row.get('Name', '').strip(),
        ]
        has_name = any(n for n in name_variants)

        if not has_name:
            dropped_analysis['total_dropped'] += 1

            email = row.get('email', '').strip() or row.get('EMAIL', '').strip()
            website = row.get('website', '').strip() or row.get('WEB PAGE', '').strip() or row.get('WEBSITE', '').strip()
            address = row.get('address', '').strip() or row.get('ADDRESS', '').strip()
            phone = row.get('phone', '').strip() or row.get('TELEFONO', '').strip()

            if email:
                dropped_analysis['with_email'] += 1
                if len(dropped_analysis['samples_with_email']) < 3:
                    dropped_analysis['samples_with_email'].append({
                        'email': email,
                        'website': website,
                        'source': row.get('_file', 'unknown')
                    })

            if website:
                dropped_analysis['with_website'] += 1
                if len(dropped_analysis['samples_with_website']) < 3:
                    dropped_analysis['samples_with_website'].append({
                        'website': website,
                        'email': email,
                        'source': row.get('_file', 'unknown')
                    })

            if address:
                dropped_analysis['with_address'] += 1

            if phone:
                dropped_analysis['with_phone'] += 1

            if email or website or address or phone:
                dropped_analysis['with_any_data'] += 1
            else:
                dropped_analysis['completely_empty'] += 1

print("DROPPED RECORDS ANALYSIS:")
print(f"  Total dropped (no name): {dropped_analysis['total_dropped']}")
print(f"  With email address: {dropped_analysis['with_email']}")
print(f"  With website: {dropped_analysis['with_website']}")
print(f"  With address: {dropped_analysis['with_address']}")
print(f"  With phone: {dropped_analysis['with_phone']}")
print(f"  With ANY contact data: {dropped_analysis['with_any_data']}")
print(f"  Completely empty: {dropped_analysis['completely_empty']}")
print()

print("RECOMMENDATION:")
if dropped_analysis['with_any_data'] > 100:
    print(f"WARNING: {dropped_analysis['with_any_data']} records with useful data were dropped!")
    print("These could be salvaged by using email or website as fallback identifier.")
else:
    print(f"OK: Only {dropped_analysis['with_any_data']} dropped records have data.")
    print("Most dropped records appear to be junk/empty rows.")

print()
print("Sample dropped records WITH EMAIL:")
for sample in dropped_analysis['samples_with_email']:
    print(f"  Email: {sample['email']}")
    print(f"  Website: {sample['website']}")
    print(f"  Source: {sample['source']}")
    print()

print("Sample dropped records WITH WEBSITE:")
for sample in dropped_analysis['samples_with_website']:
    print(f"  Website: {sample['website']}")
    print(f"  Email: {sample['email']}")
    print(f"  Source: {sample['source']}")
    print()
