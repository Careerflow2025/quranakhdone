// Script to fetch all 604 pages of the Madani Mushaf
const fs = require('fs');
const https = require('https');

async function fetchPage(pageNum) {
  return new Promise((resolve, reject) => {
    https.get(`https://api.alquran.cloud/v1/page/${pageNum}/quran-uthmani`, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.status === 'OK' && parsed.data) {
            const ayahs = parsed.data.ayahs || [];
            if (ayahs.length > 0) {
              const firstAyah = ayahs[0];
              const lastAyah = ayahs[ayahs.length - 1];

              // Get unique surahs on this page
              const surahsOnPage = [...new Set(ayahs.map(a => a.surah.number))];

              const pageData = {
                pageNumber: pageNum,
                surahStart: firstAyah.surah.number,
                ayahStart: firstAyah.numberInSurah,
                surahEnd: lastAyah.surah.number,
                ayahEnd: lastAyah.numberInSurah,
                juz: firstAyah.juz,
                hizb: firstAyah.hizbQuarter,
                totalAyahs: ayahs.length,
                surahsOnPage: surahsOnPage
              };

              console.log(`Page ${pageNum}: Surah ${pageData.surahStart}:${pageData.ayahStart} to ${pageData.surahEnd}:${pageData.ayahEnd} (${pageData.totalAyahs} ayahs)`);
              resolve(pageData);
            } else {
              resolve(null);
            }
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing page ${pageNum}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', reject);
  });
}

async function fetchAllPages() {
  const pages = [];

  console.log('Fetching all 604 pages of the Madani Mushaf...');

  // Fetch in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 1; i <= 604; i += batchSize) {
    const batch = [];
    for (let j = i; j < Math.min(i + batchSize, 605); j++) {
      batch.push(fetchPage(j));
    }

    const results = await Promise.all(batch);
    pages.push(...results.filter(p => p !== null));

    // Small delay between batches
    if (i + batchSize <= 604) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  return pages;
}

// Run the script
fetchAllPages().then(pages => {
  // Save to TypeScript file
  const tsContent = `// Complete 604-page Madani Mushaf Layout
// Generated from AlQuran.cloud API

export interface MushafPage {
  pageNumber: number;
  surahStart: number;
  ayahStart: number;
  surahEnd: number;
  ayahEnd: number;
  juz?: number;
  hizb?: number;
  totalAyahs?: number;
  surahsOnPage?: number[];
}

export const mushafPages: MushafPage[] = ${JSON.stringify(pages, null, 2)};

// Helper functions
export function getPageBySurahAyah(surah: number, ayah: number): number {
  const page = mushafPages.find(p => {
    // Check if this surah/ayah combination is on this page
    if (p.surahStart === p.surahEnd && p.surahStart === surah) {
      return ayah >= p.ayahStart && ayah <= p.ayahEnd;
    }
    if (p.surahStart === surah) {
      return ayah >= p.ayahStart;
    }
    if (p.surahEnd === surah) {
      return ayah <= p.ayahEnd;
    }
    if (p.surahsOnPage && p.surahsOnPage.includes(surah)) {
      return true;
    }
    return false;
  });
  return page?.pageNumber || 1;
}

export function getPageContent(pageNumber: number): MushafPage | undefined {
  return mushafPages.find(p => p.pageNumber === pageNumber);
}

export const TOTAL_MUSHAF_PAGES = 604;
`;

  fs.writeFileSync('completeMushafPages.ts', tsContent);
  console.log(`\nSuccessfully saved ${pages.length} pages to completeMushafPages.ts`);

  // Also save raw JSON for reference
  fs.writeFileSync('mushafPages.json', JSON.stringify(pages, null, 2));
  console.log('Also saved raw data to mushafPages.json');
}).catch(console.error);