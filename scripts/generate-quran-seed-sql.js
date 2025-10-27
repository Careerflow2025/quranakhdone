// Generate SQL migration for seeding quran_ayahs
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

// Generate SQL
let sql = `-- Seed quran_ayahs table with all 6,236 ayahs
-- Generated: ${new Date().toISOString()}

-- Get uthmani-hafs script_id
DO $$
DECLARE
  v_script_id UUID;
BEGIN
  -- Get script_id for uthmani-hafs
  SELECT id INTO v_script_id FROM quran_scripts WHERE code = 'uthmani-hafs';

  IF v_script_id IS NULL THEN
    RAISE EXCEPTION 'Script uthmani-hafs not found';
  END IF;

  -- Insert all ayahs
  INSERT INTO quran_ayahs (script_id, surah, ayah, text, token_positions) VALUES\n`;

const values = [];
let ayahCount = 0;

for (const surah of quranData) {
  const surahNumber = surah.id;

  for (const verse of surah.verses) {
    const ayahNumber = verse.id;
    const ayahText = verse.text;
    const tokenPositions = generateTokenPositions(ayahText);

    // Create SQL value
    const escapedText = escapeSql(ayahText);
    const escapedTokens = escapeSql(JSON.stringify(tokenPositions));

    values.push(
      `  (v_script_id, ${surahNumber}, ${ayahNumber}, '${escapedText}', '${escapedTokens}'::jsonb)`
    );

    ayahCount++;
  }
}

sql += values.join(',\n');
sql += ';\n\nEND $$;\n';

// Write to file
const outputPath = path.join(__dirname, '../supabase/migrations/seed_quran_ayahs.sql');
fs.writeFileSync(outputPath, sql, 'utf-8');

console.log(`✅ Generated SQL migration: ${outputPath}`);
console.log(`📊 Total ayahs: ${ayahCount}`);
console.log(`📖 Expected: 6,236 ayahs`);

if (ayahCount !== 6236) {
  console.log(`⚠️  Warning: Ayah count mismatch!`);
  process.exit(1);
}

console.log(`\n✨ Ready to apply migration!`);
console.log(`   File size: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
