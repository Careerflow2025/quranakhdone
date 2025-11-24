#!/usr/bin/env node

/**
 * Fetch Quran data from Quran.com API with line numbers
 * Downloads all 604 Madani mushaf pages and organizes words by line
 */

const fs = require('fs');
const https = require('https');

const API_BASE = 'https://api.quran.com/api/v4';
const TOTAL_PAGES = 604;
const OUTPUT_FILE = './quran-with-lines.json';

// Rate limiting - 1 request per 200ms to avoid overloading API
const DELAY_MS = 200;

async function fetchPage(pageNumber) {
  return new Promise((resolve, reject) => {
    const url = `${API_BASE}/verses/by_page/${pageNumber}?words=true&word_fields=verse_key,verse_id,page_number,line_number,text_uthmani`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function organizePageByLines(pageData) {
  const lines = {};

  // Group words by line number
  pageData.verses.forEach(verse => {
    verse.words.forEach(word => {
      const lineNum = word.line_number;

      if (!lines[lineNum]) {
        lines[lineNum] = [];
      }

      lines[lineNum].push({
        text: word.text_uthmani || word.text,
        verseKey: word.verse_key,
        position: word.position,
        isEnd: word.char_type_name === 'end'
      });
    });
  });

  // Convert to array sorted by line number
  return Object.keys(lines)
    .sort((a, b) => parseInt(a) - parseInt(b))
    .map(lineNum => ({
      lineNumber: parseInt(lineNum),
      words: lines[lineNum]
    }));
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchAllPages() {
  console.log(`📖 Fetching Quran data for ${TOTAL_PAGES} pages...`);

  const allPages = {};

  for (let page = 1; page <= TOTAL_PAGES; page++) {
    try {
      console.log(`  Fetching page ${page}/${TOTAL_PAGES}...`);

      const pageData = await fetchPage(page);
      const lines = organizePageByLines(pageData);

      allPages[page] = {
        page: page,
        lines: lines,
        totalLines: lines.length
      };

      // Rate limiting delay
      if (page < TOTAL_PAGES) {
        await delay(DELAY_MS);
      }

      // Progress updates every 50 pages
      if (page % 50 === 0) {
        console.log(`  ✅ Progress: ${page}/${TOTAL_PAGES} (${Math.round(page/TOTAL_PAGES*100)}%)`);
      }
    } catch (error) {
      console.error(`  ❌ Error fetching page ${page}:`, error.message);
      // Retry once after longer delay
      await delay(2000);
      try {
        const pageData = await fetchPage(page);
        const lines = organizePageByLines(pageData);
        allPages[page] = {
          page: page,
          lines: lines,
          totalLines: lines.length
        };
        console.log(`  ✅ Retry successful for page ${page}`);
      } catch (retryError) {
        console.error(`  ❌ Retry failed for page ${page}:`, retryError.message);
      }
    }
  }

  return allPages;
}

async function main() {
  console.log('🚀 Starting Quran data download with line numbers from Quran.com API\n');

  const startTime = Date.now();

  try {
    const allPages = await fetchAllPages();

    // Save to file
    const jsonData = JSON.stringify(allPages, null, 2);
    fs.writeFileSync(OUTPUT_FILE, jsonData, 'utf-8');

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    const sizeKB = (jsonData.length / 1024).toFixed(0);

    console.log(`\n✅ SUCCESS!`);
    console.log(`   - Downloaded ${Object.keys(allPages).length} pages`);
    console.log(`   - Saved to: ${OUTPUT_FILE}`);
    console.log(`   - File size: ${sizeKB} KB`);
    console.log(`   - Time taken: ${duration}s`);

  } catch (error) {
    console.error('\n❌ FATAL ERROR:', error);
    process.exit(1);
  }
}

main();
