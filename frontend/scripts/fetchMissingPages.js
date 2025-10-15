// Script to fetch missing pages
const fs = require('fs');
const https = require('https');

// Read existing data
const existingData = JSON.parse(fs.readFileSync('mushafPages.json', 'utf8'));
const existingPageNumbers = new Set(existingData.map(p => p.pageNumber));

// Find missing pages
const missingPages = [];
for (let i = 1; i <= 604; i++) {
  if (!existingPageNumbers.has(i)) {
    missingPages.push(i);
  }
}

console.log(`Found ${missingPages.length} missing pages:`, missingPages);

async function fetchPage(pageNum) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.alquran.cloud',
      path: `/v1/page/${pageNum}/quran-uthmani`,
      method: 'GET'
    };

    https.get(options, (res) => {
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

              console.log(`Fetched page ${pageNum}: Surah ${pageData.surahStart}:${pageData.ayahStart} to ${pageData.surahEnd}:${pageData.ayahEnd}`);
              resolve(pageData);
            } else {
              console.log(`Page ${pageNum}: No ayahs found`);
              resolve(null);
            }
          } else {
            console.log(`Page ${pageNum}: API error`);
            resolve(null);
          }
        } catch (e) {
          console.error(`Error parsing page ${pageNum}:`, e.message);
          resolve(null);
        }
      });
    }).on('error', (e) => {
      console.error(`Request error for page ${pageNum}:`, e.message);
      resolve(null);
    });
  });
}

async function fetchMissingPages() {
  const newPages = [];

  for (const pageNum of missingPages) {
    const pageData = await fetchPage(pageNum);
    if (pageData) {
      newPages.push(pageData);
    }
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Combine with existing pages
  const allPages = [...existingData, ...newPages].sort((a, b) => a.pageNumber - b.pageNumber);

  // Save complete data
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

export const mushafPages: MushafPage[] = ${JSON.stringify(allPages, null, 2)};

export function getPageBySurahAyah(surah: number, ayah: number): number {
  const page = mushafPages.find(p => {
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

export function getAyahsForPage(pageNumber: number): { surah: number; ayah: number }[] {
  const page = mushafPages.find(p => p.pageNumber === pageNumber);
  if (!page) return [];

  const ayahs: { surah: number; ayah: number }[] = [];

  if (page.surahStart === page.surahEnd) {
    // Single surah on this page
    for (let ayah = page.ayahStart; ayah <= page.ayahEnd; ayah++) {
      ayahs.push({ surah: page.surahStart, ayah });
    }
  } else {
    // Multiple surahs on this page - needs more complex logic
    // This would require knowing the total ayahs in each surah
    // For now, return what we have
    ayahs.push({ surah: page.surahStart, ayah: page.ayahStart });
    ayahs.push({ surah: page.surahEnd, ayah: page.ayahEnd });
  }

  return ayahs;
}

export const TOTAL_MUSHAF_PAGES = 604;
`;

  fs.writeFileSync('completeMushafPages.ts', tsContent);
  console.log(`\nSaved ${allPages.length} total pages to completeMushafPages.ts`);
}

fetchMissingPages().catch(console.error);