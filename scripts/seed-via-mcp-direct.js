// Seed ayahs via small batches - outputs SQL for MCP execution
const fs = require('fs');
const path = require('path');

// Read Quran JSON
const quranData = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, '../frontend/data/quran/quran-clean.json'),
    'utf-8'
  )
);

// Generate token positions
function generateTokenPositions(text) {
  const words = text.split(' ').filter(w => w.trim() !== '');
  const tokens = [];
  let currentPosition = 0;
  words.forEach((word, index) => {
    const start = currentPosition;
    const end = start + word.length;
    tokens.push({ token: index, text: word, start, end });
    currentPosition = end + 1;
  });
  return tokens;
}

// Escape SQL
function escapeSql(str) {
  return str.replace(/'/g, "''").replace(/\\/g, '\\\\');
}

// Collect all ayahs
const allAyahs = [];
for (const surah of quranData) {
  for (const verse of surah.verses) {
    const tokens = generateTokenPositions(verse.text);
    allAyahs.push({
      surah: surah.id,
      ayah: verse.id,
      text: escapeSql(verse.text),
      tokens: escapeSql(JSON.stringify(tokens))
    });
  }
}

console.log(`Total ayahs: ${allAyahs.length}`);

// Generate single INSERT for first 10 ayahs as test
const testBatch = allAyahs.slice(0, 10);

const sql = `
INSERT INTO quran_ayahs (script_id, surah, ayah, text, token_positions)
SELECT
  (SELECT id FROM quran_scripts WHERE code = 'uthmani-hafs'),
  surah, ayah, text, token_positions::jsonb
FROM (VALUES
${testBatch.map((a, i) => `  (${a.surah}, ${a.ayah}, '${a.text}', '${a.tokens}')`).join(',\n')}
) AS v(surah, ayah, text, token_positions);
`;

fs.writeFileSync(path.join(__dirname, 'test-insert.sql'), sql, 'utf-8');
console.log('\n✅ Generated test-insert.sql with first 10 ayahs');
console.log('   You can test this with MCP execute_sql\n');

// Also output the ayahs as JSON for programmatic insertion
fs.writeFileSync(
  path.join(__dirname, 'ayahs-data.json'),
  JSON.stringify(allAyahs, null, 2),
  'utf-8'
);
console.log('✅ Generated ayahs-data.json with all', allAyahs.length, 'ayahs');
console.log('   This can be used for programmatic insertion\n');
