#!/usr/bin/env python3
"""
Phase 1: Consolidation - Deduplication & Coordinate Extraction
- Identifies and keeps primary versions of duplicate files
- Extracts all LAT/LON data into separate holding file
- Creates metadata inventory
"""

import os
import csv
import json
from pathlib import Path
from datetime import datetime

# Directory structure
PHASE1_DIR = Path(__file__).parent
CSV_INPUT_DIR = PHASE1_DIR / "csv_input"
DEDUP_STAGING_DIR = PHASE1_DIR / "dedup_staging"
COORDINATES_DIR = PHASE1_DIR / "coordinates"
METADATA_DIR = PHASE1_DIR / "metadata"

# Files to exclude (empty/unusable)
EXCLUDE_FILES = {
    "ASSOCIATIONS - SouthAfrika.csv",
    "ASSOCs - GER.csv",
    "ASSOCs - NL.csv",
    "ASSOCs - ROMANIA.csv",
    "ASSOCs - SWISS.csv",
}

# Deduplication rules: keep only the primary version
KEEP_FILES = {
    "BRESCIA": {
        "primary": "Associazioni_Animaliste_Brescia.xlsx - Associazioni Animaliste Brescia.csv",
        "drop": [
            "Associazioni_Animaliste_Brescia - Associazioni Animaliste Brescia.csv",
            "CSV Associazioni_Animaliste_Brescia.xlsx - Associazioni Animaliste Brescia.csv",
        ],
    },
    "UK": {
        "primary": "ASSOCs - UK.csv",  # has coordinates
        "drop": ["ASSOCIATIONS - UK.csv"],
    },
    "CANADA": {
        "primary": "ASSOCs - CANADA.csv",  # larger
        "drop": ["ASSOCIATIONS - CANADA.csv"],
    },
    "IRELAND": {
        "primary": "ASSOCIATIONS - IRELAND.csv",  # larger
        "drop": ["ASSOCs - IREL.csv"],
    },
}

# Known coordinate column patterns (case-insensitive, lowercase match)
COORD_PATTERNS = {
    "lat": ["lat", "latitude", "map"],
    "lon": ["lon", "lng", "longitude"],
}


def get_coord_columns(headers):
    """Detect latitude and longitude columns in a CSV header row."""
    headers_lower = [h.lower() if h else "" for h in headers]

    lat_col, lon_col = None, None

    # Look for explicit patterns
    for i, h in enumerate(headers_lower):
        if any(p in h for p in COORD_PATTERNS["lat"]):
            lat_col = i
        if any(p in h for p in COORD_PATTERNS["lon"]):
            lon_col = i

    # Heuristic: check for numeric columns that look like coordinates
    # (37.xxx, -122.xxx range)
    if lat_col is None or lon_col is None:
        # Try positional: sometimes lat/lon are the first numeric columns
        pass

    return lat_col, lon_col


def extract_coordinates(csv_file, output_coords_list):
    """
    Read a CSV file and extract all lat/lon coordinates.
    Handles both header-labeled and positional coordinates.
    output_coords_list: list to append (filename, row_num, name, lat, lon)
    """
    if not csv_file.exists():
        return

    try:
        with open(csv_file, 'r', encoding='utf-8-sig', errors='ignore') as f:
            reader = csv.reader(f)
            all_rows = list(reader)

            if not all_rows:
                return

            # Find header row (usually has "name", "email", "web", etc.)
            headers = None
            header_row_idx = None
            for i, row in enumerate(all_rows[:10]):
                row_text = " ".join(str(c).lower() for c in row[:5] if c)
                if any(x in row_text for x in ["name", "email", "web", "address", "association"]):
                    headers = row
                    header_row_idx = i
                    break

            if headers is None:
                # No clear headers found, assume row 0 is header
                headers = all_rows[0] if all_rows else []
                header_row_idx = 0

            lat_col, lon_col = get_coord_columns(headers)

            # Fallback: try positional coordinates (columns 1-2 are often lat/lon)
            if lat_col is None or lon_col is None:
                # Check if columns 1 and 2 contain numeric values
                coord_count = 0
                for row in all_rows[header_row_idx + 1:]:
                    if len(row) > 2:
                        try:
                            float(row[1])
                            float(row[2])
                            coord_count += 1
                        except:
                            pass
                if coord_count > len(all_rows) * 0.1:  # If >10% of rows have numeric cols 1-2
                    lat_col, lon_col = 1, 2

            # Try to find a name column
            name_col = None
            for i, h in enumerate(headers):
                if h and any(n in h.lower() for n in ["name", "nome", "association"]):
                    name_col = i
                    break

            # Extract coordinates starting after header row
            for row_num, row in enumerate(all_rows[header_row_idx + 1:], start=header_row_idx + 2):
                if lat_col is not None and lon_col is not None:
                    if lat_col < len(row) and lon_col < len(row):
                        lat_str = row[lat_col].strip() if lat_col < len(row) else ""
                        lon_str = row[lon_col].strip() if lon_col < len(row) else ""

                        # Only keep non-empty, numeric-looking coordinates
                        if lat_str and lon_str and _is_coordinate(lat_str) and _is_coordinate(lon_str):
                            name = ""
                            if name_col is not None and name_col < len(row):
                                name = row[name_col].strip()
                            output_coords_list.append({
                                "file": csv_file.name,
                                "row": row_num,
                                "name": name,
                                "lat": lat_str,
                                "lon": lon_str,
                            })
    except Exception as e:
        print(f"[WARN] Error reading {csv_file.name}: {e}")


def _is_coordinate(s):
    """Check if string looks like a coordinate (numeric, optional minus)."""
    try:
        float(s)
        return True
    except:
        return False


def copy_primary_files():
    """Copy primary versions of files to dedup_staging."""
    DEDUP_STAGING_DIR.mkdir(exist_ok=True)

    print("\n[COPY] primary versions to dedup_staging/...")

    # Get all primary files
    primary_files = set()
    for group_data in KEEP_FILES.values():
        primary_files.add(group_data["primary"])

    # Add all non-duplicate files
    for csv_file in CSV_INPUT_DIR.glob("*.csv"):
        if csv_file.name not in EXCLUDE_FILES:
            # Check if it's a primary or a duplicate
            is_primary = csv_file.name in primary_files
            is_duplicate = any(csv_file.name in group["drop"] for group in KEEP_FILES.values())

            if is_primary or not is_duplicate:
                # Copy or skip accordingly
                if csv_file.name in primary_files or not is_duplicate:
                    import shutil
                    dest = DEDUP_STAGING_DIR / csv_file.name
                    shutil.copy(csv_file, dest)
                    print(f"  [OK] {csv_file.name}")


def extract_all_coordinates():
    """Extract coordinates from all CSV files."""
    COORDINATES_DIR.mkdir(exist_ok=True)

    print("\n[EXTRACT] coordinates from all files...")

    all_coords = []

    # Process primary versions only (to avoid duplicates)
    primary_files = set()
    for group_data in KEEP_FILES.values():
        primary_files.add(group_data["primary"])

    # Also include all non-duplicate, non-excluded files
    for csv_file in CSV_INPUT_DIR.glob("*.csv"):
        if csv_file.name not in EXCLUDE_FILES:
            is_primary = csv_file.name in primary_files
            is_duplicate = any(csv_file.name in group["drop"] for group in KEEP_FILES.values())

            if is_primary or not is_duplicate:
                print(f"  Reading {csv_file.name}...", end=" ")
                before = len(all_coords)
                extract_coordinates(csv_file, all_coords)
                found = len(all_coords) - before
                print(f"found {found} coords")

    # Write holding coordinates file
    holding_file = COORDINATES_DIR / "holding_coordinates.csv"
    with open(holding_file, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=["file", "row", "name", "lat", "lon"])
        writer.writeheader()
        writer.writerows(all_coords)

    print(f"\n[OK] Extracted {len(all_coords)} coordinate pairs")
    print(f"   Saved to: holding_coordinates.csv")

    return all_coords


def create_inventory_report(all_coords):
    """Create metadata inventory report."""
    METADATA_DIR.mkdir(exist_ok=True)

    # Count records per file
    file_counts = {}
    for csv_file in CSV_INPUT_DIR.glob("*.csv"):
        if csv_file.name not in EXCLUDE_FILES:
            is_primary = csv_file.name in {g["primary"] for g in KEEP_FILES.values()}
            is_duplicate = any(csv_file.name in g["drop"] for g in KEEP_FILES.values())

            if is_primary or not is_duplicate:
                try:
                    with open(csv_file, 'r', encoding='utf-8-sig', errors='ignore') as f:
                        count = sum(1 for _ in f) - 1  # subtract header
                        file_counts[csv_file.name] = count
                except:
                    file_counts[csv_file.name] = 0

    inventory = {
        "timestamp": datetime.now().isoformat(),
        "phase": "phase_1_deduplication",
        "files_processed": len(file_counts),
        "total_records": sum(file_counts.values()),
        "coordinates_extracted": len(all_coords),
        "files": file_counts,
        "excluded_files": list(EXCLUDE_FILES),
    }

    report_file = METADATA_DIR / "inventory.json"
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(inventory, f, indent=2)

    print(f"\n[INVENTORY] Report:")
    print(f"   Files processed: {inventory['files_processed']}")
    print(f"   Total records (estimated): {inventory['total_records']}")
    print(f"   Coordinates extracted: {inventory['coordinates_extracted']}")
    print(f"   Saved to: metadata/inventory.json")

    return inventory


def main():
    print("=" * 60)
    print("PHASE 1: CONSOLIDATION - DEDUP & COORDINATE EXTRACTION")
    print("=" * 60)

    # Step 1: Identify what we're processing
    print(f"\n[INPUT] directory: {CSV_INPUT_DIR}")
    print(f"   Files found: {len(list(CSV_INPUT_DIR.glob('*.csv')))}")

    # Step 2: Copy primary versions
    copy_primary_files()

    # Step 3: Extract all coordinates
    all_coords = extract_all_coordinates()

    # Step 4: Create inventory
    inventory = create_inventory_report(all_coords)

    print("\n" + "=" * 60)
    print("OK - PHASE 1 COMPLETE")
    print("=" * 60)
    print(f"\n[OUTPUT] locations:")
    print(f"   Deduplicated CSVs: {DEDUP_STAGING_DIR}")
    print(f"   Coordinates hold: {COORDINATES_DIR / 'holding_coordinates.csv'}")
    print(f"   Metadata: {METADATA_DIR}")
    print(f"\n[NEXT] Phase 2 - Name+City+Email fuzzy deduplication")


if __name__ == "__main__":
    main()
