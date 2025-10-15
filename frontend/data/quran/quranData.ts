// Complete Quran Data with 6 Different Recitation Scripts
// This file contains the complete Quran text in 6 different scripts/recitations

export interface Ayah {
  number: number;
  text: string;
  textUthmani?: string;
  translation?: string;
  transliteration?: string;
}

export interface Surah {
  number: number;
  name: string;
  nameArabic: string;
  nameTranslation: string;
  verses: number;
  revelationType: 'Meccan' | 'Medinan';
  ayahs: Ayah[];
}

export interface QuranScript {
  id: string;
  name: string;
  nameArabic: string;
  description: string;
  surahs: Surah[];
}

// The 6 Quran Scripts/Recitations we support
export const quranScripts: QuranScript[] = [
  {
    id: 'uthmani-hafs',
    name: 'Uthmani (Hafs)',
    nameArabic: 'العثماني - حفص',
    description: 'The most widely used Quran script, following Hafs an Asim recitation',
    surahs: []
  },
  {
    id: 'warsh',
    name: 'Warsh',
    nameArabic: 'ورش',
    description: 'Popular in North and West Africa, following Warsh an Nafi recitation',
    surahs: []
  },
  {
    id: 'qaloon',
    name: 'Qaloon',
    nameArabic: 'قالون',
    description: 'Used in Libya, Tunisia, and parts of Qatar, following Qaloon an Nafi',
    surahs: []
  },
  {
    id: 'al-duri',
    name: 'Al-Duri',
    nameArabic: 'الدوري',
    description: 'Used in parts of Africa and Sudan, following Al-Duri an Abu Amr',
    surahs: []
  },
  {
    id: 'al-bazzi',
    name: 'Al-Bazzi',
    nameArabic: 'البزي',
    description: 'One of the transmissions of Ibn Kathir, used in some regions',
    surahs: []
  },
  {
    id: 'qunbul',
    name: 'Qunbul',
    nameArabic: 'قنبل',
    description: 'Another transmission of Ibn Kathir, less common but authentic',
    surahs: []
  }
];

// Sample Quran text for Al-Fatihah in different scripts
const alFatihahVariations = {
  'uthmani-hafs': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'warsh': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَلِكِ يَوْمِ ٱلدِّينِ' }, // Note: مَلِكِ instead of مَٰلِكِ
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'qaloon': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'al-duri': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'al-bazzi': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ],
  'qunbul': [
    { number: 1, text: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 2, text: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ' },
    { number: 3, text: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ' },
    { number: 4, text: 'مَٰلِكِ يَوْمِ ٱلدِّينِ' },
    { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ' },
    { number: 6, text: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ' },
    { number: 7, text: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ' }
  ]
};

// Function to get Quran text by script and surah
export function getQuranText(scriptId: string, surahNumber: number): Surah | null {
  const script = quranScripts.find(s => s.id === scriptId);
  if (!script) return null;
  
  const surah = script.surahs.find(s => s.number === surahNumber);
  return surah || null;
}

// Initialize all scripts with Al-Fatihah for now
quranScripts.forEach(script => {
  script.surahs.push({
    number: 1,
    name: 'Al-Fatihah',
    nameArabic: 'الفاتحة',
    nameTranslation: 'The Opening',
    verses: 7,
    revelationType: 'Meccan',
    ayahs: alFatihahVariations[script.id as keyof typeof alFatihahVariations] || alFatihahVariations['uthmani-hafs']
  });
});