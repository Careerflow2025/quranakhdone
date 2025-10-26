// Test script to verify all 6 Qira'at versions return different text
// Run with: node test_qirat_differences.js

const https = require('https');

const editions = {
  'Hafs': 'ara-quranuthmanihaf',
  'Warsh': 'ara-quranwarsh',
  'Qaloon': 'ara-quranqaloon',
  'Al-Duri': 'ara-qurandoori',
  'Al-Bazzi': 'ara-quranbazzi',
  'Qunbul': 'ara-quranqumbul'
};

async function fetchVerse(edition) {
  return new Promise((resolve, reject) => {
    const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${edition}.min.json`;

    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          // Get verse 1:4 (Fatiha verse 4 - the famous malik/maalik difference)
          const verse = json.quran.find(v => v.chapter === 1 && v.verse === 4);
          resolve(verse.text);
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testAllVersions() {
  console.log('\n🔍 Testing Fatiha 1:4 (مَلِك vs مَٰلِك) across all 6 Qira\'at:\n');
  console.log('═'.repeat(80));

  const results = {};

  for (const [name, edition] of Object.entries(editions)) {
    try {
      const text = await fetchVerse(edition);
      results[name] = text;
      console.log(`\n${name.padEnd(12)} | ${text}`);
    } catch (error) {
      console.error(`\n❌ ${name}: Error - ${error.message}`);
    }
  }

  console.log('\n' + '═'.repeat(80));
  console.log('\n📊 Analysis:\n');

  // Check if all texts are unique
  const uniqueTexts = new Set(Object.values(results));

  if (uniqueTexts.size === 1) {
    console.log('❌ PROBLEM: All versions show IDENTICAL text!');
    console.log('   This means the API is not returning different Qira\'at.\n');
  } else if (uniqueTexts.size === 6) {
    console.log('✅ PERFECT: All 6 versions show UNIQUE text!');
    console.log('   The API is correctly returning different Qira\'at.\n');
  } else {
    console.log(`⚠️  PARTIAL: ${uniqueTexts.size} unique versions out of 6`);
    console.log('   Some versions are duplicates.\n');
  }

  // Show which versions are different
  console.log('Unique texts found:');
  Array.from(uniqueTexts).forEach((text, i) => {
    const versions = Object.entries(results)
      .filter(([_, t]) => t === text)
      .map(([name]) => name);
    console.log(`  ${i + 1}. "${text}"`);
    console.log(`     Used by: ${versions.join(', ')}\n`);
  });

  // Specific Warsh vs Hafs comparison
  console.log('═'.repeat(80));
  console.log('\n🎯 Key Difference (Warsh vs Hafs):');
  console.log(`   Hafs:  ${results['Hafs']}  ${results['Hafs'].includes('مَٰلِكِ') ? '✓ Has alif' : '✗ No alif'}`);
  console.log(`   Warsh: ${results['Warsh']}  ${results['Warsh'].includes('مَلِكِ') && !results['Warsh'].includes('مَٰلِكِ') ? '✓ No alif' : '✗ Has alif'}\n`);
}

testAllVersions().catch(console.error);
