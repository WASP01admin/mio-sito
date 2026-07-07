const fs = require('fs');
const readline = require('readline');

function parseCSVLine(line) {
  const result = [];
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
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

async function readCSV(filePath) {
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  const records = [];
  let headerRow = null;
  let lineNum = 0;

  for await (const line of rl) {
    lineNum++;
    if (!line.trim() || line.trim().toUpperCase().includes('START')) continue;

    if (!headerRow) {
      headerRow = parseCSVLine(line);
      continue;
    }

    const values = parseCSVLine(line);
    const row = {};
    headerRow.forEach((header, idx) => {
      row[header?.trim()] = values[idx]?.trim() || '';
    });

    const name = row['NOME ASSOCIAZIONE'] || '';
    if (name) {
      records.push(name);
    }
  }

  return records;
}

(async () => {
  console.log('Reading CSV files...\n');

  const piemonteFile = 'C:\\Users\\robbu\\Desktop\\WASSP\\FILE EXCEL\\ITA - PIEMONTE.csv';
  const mainFile = 'C:\\Users\\robbu\\Downloads\\TOTALE ASS ITALIANE 963 - ITA COMPLETE LIST(1).csv';

  const piemonteNames = await readCSV(piemonteFile);
  const mainNames = await readCSV(mainFile);

  console.log(`PIEMONTE file: ${piemonteNames.length} associations`);
  console.log(`Main Italy file: ${mainNames.length} associations\n`);

  const mainSet = new Set(mainNames.map(n => n.toLowerCase().trim()));
  const duplicates = [];
  const notFound = [];

  piemonteNames.forEach((name, idx) => {
    const normalized = name.toLowerCase().trim();
    if (mainSet.has(normalized)) {
      duplicates.push(name);
    } else {
      notFound.push(name);
    }
  });

  console.log(`================== RESULTS ==================\n`);
  console.log(`✓ Found in main file (DUPLICATES): ${duplicates.length}`);
  console.log(`✗ NOT found (new): ${notFound.length}`);
  console.log(`Total: ${piemonteNames.length}\n`);

  if (duplicates.length > 0) {
    console.log(`\nDUPLICATES (${duplicates.length}):`);
    duplicates.forEach(name => console.log(`  ✓ ${name}`));
  }

  if (notFound.length > 0) {
    console.log(`\nNOT FOUND - NEW RECORDS (${notFound.length}):`);
    notFound.slice(0, 20).forEach(name => console.log(`  ✗ ${name}`));
    if (notFound.length > 20) {
      console.log(`  ... and ${notFound.length - 20} more`);
    }
  }
})();
