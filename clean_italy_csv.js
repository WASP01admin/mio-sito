#!/usr/bin/env node

/**
 * CLEAN ITALY CSV
 * Remove records without addresses
 */

const fs = require('fs');
const readline = require('readline');

async function cleanItalyCSV() {
  const inputFile = 'C:\\Users\\robbu\\Downloads\\ITALY_MISSING_COORDS_554.csv';
  const outputFile = 'C:\\Users\\robbu\\Downloads\\ITALY_MISSING_COORDS_WITH_ADDRESSES.csv';

  console.log('╔════════════════════════════════════════╗');
  console.log('║  CLEAN ITALY CSV - Keep Addresses Only ║');
  console.log('╚════════════════════════════════════════╝\n');

  const fileStream = fs.createReadStream(inputFile);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const lines = [];
  let headerLine = null;
  let addressIndex = -1;
  let totalRecords = 0;
  let recordsWithAddress = 0;

  for await (const line of rl) {
    if (!headerLine) {
      headerLine = line;
      lines.push(line);

      // Find the address column index
      const headers = line.split(',').map(h => h.trim().replace(/^"(.*)"$/, '$1'));
      addressIndex = headers.indexOf('address');
      console.log(`Found 'address' column at index ${addressIndex}\n`);
      continue;
    }

    totalRecords++;

    // Parse the CSV line carefully to handle quoted values
    const values = [];
    let current = '';
    let insideQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (insideQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);

    // Get the address value
    const address = values[addressIndex]?.trim() || '';

    // Keep records with non-empty address
    if (address && address.length > 0) {
      lines.push(line);
      recordsWithAddress++;
    }

    // Progress
    if (totalRecords % 100 === 0) {
      process.stdout.write(`\r Processed: ${totalRecords}/554 | With address: ${recordsWithAddress}`);
    }
  }

  // Write cleaned CSV
  fs.writeFileSync(outputFile, lines.join('\n'), 'utf8');

  console.log(`\n\n╔════════════════════════════════════════╗`);
  console.log(`║         CLEANING COMPLETE!             ║`);
  console.log(`╚════════════════════════════════════════╝`);
  console.log(`✓ Original records: ${totalRecords}`);
  console.log(`✓ With addresses: ${recordsWithAddress}`);
  console.log(`✗ Removed (no address): ${totalRecords - recordsWithAddress}`);
  console.log(`\n📄 Cleaned file: ${outputFile}\n`);
}

cleanItalyCSV().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
