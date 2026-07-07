#!/usr/bin/env python3
"""
Deep dive into the 3,025 dropped records.
Check for ANY salvageable data: name, email, website, address, city, country
Create an "unverified" set of records that have SOME useful info.
"""

import csv
import json
from pathlib import Path
from datetime import datetime
from collections import defaultdict

METADATA_DIR = Path("C:\\Users\\robbu\\Documents\\mio-sito\\consolidation\\phase_1\\metadata")

print("=" * 70)
print("DEEP DIVE: INVESTIGATING DROPPED RECORDS")
print("=" * 70)
print()

# Define name columns to check
NAME_COLS = ['name', 'NAME', 'NOME', 'NOME ASSOCIAZIONE', 'Name', 'Name ']
EMAIL_COLS = ['email', 'EMAIL', 'Email', 'email1', 'email2', 'email3']
WEBSITE_COLS = ['website', 'WEBSITE', 'WEB', 'WEB PAGE', 'Website', 'web', 'Web', 'SITO WEB']
ADDRESS_COLS = ['address', 'ADDRESS', 'Address', 'INDIRIZZO', 'Indirizzo']
CITY_COLS = ['city', 'City', 'LOCALITÃ€', 'CITTÃ€', 'città']
COUNTRY_COLS = ['country', 'COUNTRY', 'Country']

dropped_records = []
salvageable_records = []
investigation = {
    'total_dropped': 0,
    'has_name': 0,
    'has_email': 0,
    'has_website': 0,
    'has_address': 0,
    'has_city': 0,
    'has_country': 0,
    'has_any_field': 0,
    'completely_empty': 0,
    'by_file': {},
    'data_patterns': defaultdict(int),
}

print("Reading master_deduplicated.csv...")
master_file = METADATA_DIR / "master_deduplicated.csv"

with open(master_file, 'r', encoding='utf-8', errors='ignore') as f:
    reader = csv.DictReader(f)
    for row in reader:
        # Check for name
        name = None
        for col in NAME_COLS:
            val = (row.get(col) or '').strip()
            if val:
                name = val
                break

        # Skip if has name (these are kept)
        if name:
            continue

        investigation['total_dropped'] += 1
        source_file = row.get('_file', 'unknown')

        # Check for other useful data
        email = next((row.get(c, '').strip() for c in EMAIL_COLS if row.get(c, '').strip()), '')
        website = next((row.get(c, '').strip() for c in WEBSITE_COLS if row.get(c, '').strip()), '')
        address = next((row.get(c, '').strip() for c in ADDRESS_COLS if row.get(c, '').strip()), '')
        city = next((row.get(c, '').strip() for c in CITY_COLS if row.get(c, '').strip()), '')
        country = next((row.get(c, '').strip() for c in COUNTRY_COLS if row.get(c, '').strip()), '')

        # Track stats
        if email:
            investigation['has_email'] += 1
        if website:
            investigation['has_website'] += 1
        if address:
            investigation['has_address'] += 1
        if city:
            investigation['has_city'] += 1
        if country:
            investigation['has_country'] += 1

        # Track file origin
        if source_file not in investigation['by_file']:
            investigation['by_file'][source_file] = {'total': 0, 'salvageable': 0}
        investigation['by_file'][source_file]['total'] += 1

        # Check if salvageable (has ANY useful field)
        has_any = email or website or address or city or country
        if has_any:
            investigation['has_any_field'] += 1
            investigation['by_file'][source_file]['salvageable'] += 1

            # Create pattern description
            pattern = []
            if email:
                pattern.append('email')
            if website:
                pattern.append('website')
            if address:
                pattern.append('address')
            if city:
                pattern.append('city')
            if country:
                pattern.append('country')
            pattern_key = '+'.join(pattern)
            investigation['data_patterns'][pattern_key] += 1

            # Store for potential recovery
            salvageable_records.append({
                'name': name or f"[NO NAME - {source_file}]",
                'city': city,
                'country': country,
                'address': address,
                'postal_code': '',
                'email': email,
                'phone': '',
                'website': website,
                '_file': source_file,
                '_dropped_reason': 'no_name',
                '_salvage_source': '+'.join(pattern),
            })
        else:
            investigation['completely_empty'] += 1
            dropped_records.append({
                'file': source_file,
                'reason': 'completely_empty'
            })

print()
print("=" * 70)
print("DROPPED RECORDS BREAKDOWN")
print("=" * 70)
print()
print(f"Total dropped (no name field): {investigation['total_dropped']}")
print()
print("Data present in dropped records:")
print(f"  Has email.............. {investigation['has_email']} records ({100*investigation['has_email']/max(1, investigation['total_dropped']):.1f}%)")
print(f"  Has website............ {investigation['has_website']} records ({100*investigation['has_website']/max(1, investigation['total_dropped']):.1f}%)")
print(f"  Has address............ {investigation['has_address']} records ({100*investigation['has_address']/max(1, investigation['total_dropped']):.1f}%)")
print(f"  Has city............... {investigation['has_city']} records ({100*investigation['has_city']/max(1, investigation['total_dropped']):.1f}%)")
print(f"  Has country............ {investigation['has_country']} records ({100*investigation['has_country']/max(1, investigation['total_dropped']):.1f}%)")
print()
print(f"  Has ANY field.......... {investigation['has_any_field']} records ({100*investigation['has_any_field']/max(1, investigation['total_dropped']):.1f}%)")
print(f"  Completely empty....... {investigation['completely_empty']} records ({100*investigation['completely_empty']/max(1, investigation['total_dropped']):.1f}%)")
print()

print("Data patterns in salvageable records:")
for pattern, count in sorted(investigation['data_patterns'].items(), key=lambda x: -x[1]):
    print(f"  {pattern:40} : {count:4} records")

print()
print("=" * 70)
print("DROPPED RECORDS BY SOURCE FILE")
print("=" * 70)
print()

for file_name in sorted(investigation['by_file'].keys()):
    stats = investigation['by_file'][file_name]
    salvage_pct = 100 * stats['salvageable'] / max(1, stats['total'])
    print(f"{file_name:55} : {stats['total']:4} dropped, {stats['salvageable']:4} salvageable ({salvage_pct:5.1f}%)")

print()
print("=" * 70)
print("SALVAGE STATISTICS")
print("=" * 70)
print()
print(f"Currently kept (clean): 3,405 records")
print(f"Can salvage: {len(salvageable_records)} records")
print(f"Potential total: {3405 + len(salvageable_records)} records")
print(f"Gain: {len(salvageable_records)} records ({100*len(salvageable_records)/3405:.1f}% increase)")
print()

# Write salvageable records to CSV for manual review
unverified_file = METADATA_DIR / "master_unverified_salvage.csv"
print(f"Writing {len(salvageable_records)} salvageable records to: master_unverified_salvage.csv")
print()

import csv
with open(unverified_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=[
        'name', 'city', 'country', 'address', 'postal_code', 'email', 'phone', 'website',
        '_file', '_dropped_reason', '_salvage_source'
    ], restval='')
    writer.writeheader()
    writer.writerows(salvageable_records)

# Write investigation report
report = {
    'timestamp': datetime.now().isoformat(),
    'investigation': 'dropped_records_deep_dive',
    'summary': {
        'originally_kept': 3405,
        'dropped_no_name': investigation['total_dropped'],
        'salvageable_with_data': len(salvageable_records),
        'completely_empty': investigation['completely_empty'],
        'potential_total': 3405 + len(salvageable_records),
    },
    'data_in_dropped': {
        'with_email': investigation['has_email'],
        'with_website': investigation['has_website'],
        'with_address': investigation['has_address'],
        'with_city': investigation['has_city'],
        'with_country': investigation['has_country'],
        'with_any_field': investigation['has_any_field'],
    },
    'data_patterns': dict(investigation['data_patterns']),
    'by_file': investigation['by_file'],
}

report_file = METADATA_DIR / "investigation_dropped_records.json"
with open(report_file, 'w', encoding='utf-8') as f:
    json.dump(report, f, indent=2)

print("Report saved: investigation_dropped_records.json")
print()
print("=" * 70)
print("NEXT STEPS")
print("=" * 70)
print()
print("1. Review master_unverified_salvage.csv (for manual inspection)")
print("2. Decide: merge salvageable records into final dataset?")
print(f"3. If yes, you'll have ~{3405 + len(salvageable_records)} total records (up from 3,405)")
print()
