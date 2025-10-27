// Seed quran_ayahs using batched inserts
const fs = require('fs');
const path = require('path');

// Read Quran JSON
const quranData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../frontend/data/quran/quran-clean.json'),
    'utf-8'
  )
);

// Generate token positions from Arabic text
function generateTokenPositions(text) {
  const words = text.split(' ').filter(w => w.trim() !== '');
  const tokens = [];

  let currentPosition = 0;
  words.forEach((word, index) => {
    const start = currentPosition;
    const end = start + word.length;

    tokens.push({
      token: index,
      text: word,
      start,
      end,
    });

    currentPosition = end + 1;
  });

  return tokens;
}

// Escape SQL strings
function escapeSql(str) {
  return str.replace(/'/g, "''");
}

// Generate batched SQL files
const BATCH_SIZE = 100;
const outputDir = path.join(__dirname, '../supabase/migrations/quran_batches');

// Create output directory
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔄 Generating batched SQL migrations...\n');

let batchNumber = 1;
let currentBatch = [];
let totalAyahs = 0;

for (const surah of quranData) {
  const surahNumber = surah.id;

  for (const verse of surah.verses) {
    const ayahNumber = verse.id;
    const ayahText = verse.text;
    const tokenPositions = generateTokenPositions(ayahText);

    // Create SQL value
    const escapedText = escapeSql(ayahText);
    const escapedTokens = escapeSql(JSON.stringify(tokenPositions));

    currentBatch.push({
      surah: surahNumber,
      ayah: ayahNumber,
      text: escapedText,
      tokens: escapedTokens,
    });

    totalAyahs++;

    // Write batch when it reaches BATCH_SIZE
    if (currentBatch.length >= BATCH_SIZE) {
      writeBatchFile(batchNumber, currentBatch);
      batchNumber++;
      currentBatch = [];
    }
  }
}

// Write remaining ayahs
if (currentBatch.length > 0) {
  writeBatchFile(batchNumber, currentBatch);
}

function writeBatchFile(batchNum, ayahs) {
  const sql = `-- Batch ${batchNum}: Ayahs ${((batchNum - 1) * BATCH_SIZE) + 1} to ${((batchNum - 1) * BATCH_SIZE) + ayahs.length}

DO $$
DECLARE
  v_script_id UUID;
BEGIN
  SELECT id INTO v_script_id FROM quran_scripts WHERE code = 'uthmani-hafs';

  IF v_script_id IS NULL THEN
    RAISE EXCEPTION 'Script uthmani-hafs not found';
  END IF;

  INSERT INTO quran_ayahs (script_id, surah, ayah, text, token_positions) VALUES
${ayahs.map(a => `  (v_script_id, ${a.surah}, ${a.ayah}, '${a.text}', '${a.tokens}'::jsonb)`).join(',\n')};

END $$;
`;

  const filename = `batch_${String(batchNum).padStart(3, '0')}.sql`;
  const filepath = path.join(outputDir, filename);

  fs.writeFileSync(filepath, sql, 'utf-8');
  console.log(`✅ Batch ${batchNum}: ${ayahs.length} ayahs → ${filename}`);
}

console.log(`\n✅ Generated ${batchNumber} batch files`);
console.log(`📊 Total ayahs: ${totalAyahs}`);
console.log(`📂 Output directory: ${outputDir}`);
console.log(`\n🎯 Now you can apply these migrations using MCP one by one or via psql`);
