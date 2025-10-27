// Generate SQL batches for remaining ayahs (starting from index 10)
const fs = require('fs');
const path = require('path');

// Read all ayahs data
const allAyahs = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'ayahs-data.json'), 'utf-8')
);

console.log(`Total ayahs in JSON: ${allAyahs.length}`);

// Start from index 10 (first 10 already inserted)
const BATCH_SIZE = 50;
const START_INDEX = 10;
const outputDir = path.join(__dirname, 'mcp_batches');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Clean existing batch files
const existingFiles = fs.readdirSync(outputDir).filter(f => f.startsWith('batch_'));
existingFiles.forEach(f => fs.unlinkSync(path.join(outputDir, f)));

let batchNumber = 1;
let currentIndex = START_INDEX;
let totalProcessed = 0;

while (currentIndex < allAyahs.length) {
  const batchEnd = Math.min(currentIndex + BATCH_SIZE, allAyahs.length);
  const batch = allAyahs.slice(currentIndex, batchEnd);

  // Generate SQL for this batch
  const values = batch.map(a =>
    `  (${a.surah}, ${a.ayah}, '${a.text}', '${a.tokens}')`
  ).join(',\n');

  const sql = `INSERT INTO quran_ayahs (script_id, surah, ayah, text, token_positions)
SELECT
  (SELECT id FROM quran_scripts WHERE code = 'uthmani-hafs'),
  surah, ayah, text, token_positions::jsonb
FROM (VALUES
${values}
) AS v(surah, ayah, text, token_positions);
`;

  // Write batch file
  const filename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, sql, 'utf-8');

  console.log(`✅ Batch ${batchNumber}: Ayahs ${currentIndex + 1}-${batchEnd} (${batch.length} ayahs) → ${filename}`);

  totalProcessed += batch.length;
  batchNumber++;
  currentIndex = batchEnd;
}

console.log(`\n📊 Summary:`);
console.log(`   Total ayahs processed: ${totalProcessed}`);
console.log(`   Total batches generated: ${batchNumber - 1}`);
console.log(`   Output directory: ${outputDir}`);
console.log(`   Batch size: ${BATCH_SIZE} ayahs per file`);
console.log(`\n✨ Ready to execute batches via MCP!`);
