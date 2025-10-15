const fs = require('fs');
const path = require('path');

// Read the SchoolDashboard file
const filePath = path.join(__dirname, 'components/dashboard/SchoolDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔥 REMOVING ALL FINAL REPORTS DATA...\n');

// 1. Fix Attendance Trends - remove the calculation
console.log('1. Removing attendance trends calculations...');
content = content.replace(
  /const rate = 95 - \(index \* 2\) \+ Math\.random\(\) \* 5;/g,
  'const rate = 0;'
);
content = content.replace(
  /\{rate\.toFixed\(1\)\}%/g,
  '0%'
);

// 2. Fix Class Attendance Comparison
console.log('2. Removing class attendance percentages...');
content = content.replace(
  /const attendance = 85 \+ Math\.random\(\) \* 15;/g,
  'const attendance = 0;'
);
content = content.replace(
  /\{attendance\.toFixed\(1\)\}%/g,
  '0%'
);

// 3. Fix Subject Performance scores
console.log('3. Removing subject performance scores...');
content = content.replace(
  /{ subject: 'Quran Memorization', score: 88, progress: 0 }/g,
  "{ subject: 'Quran Memorization', score: 0, progress: 0 }"
);
content = content.replace(
  /{ subject: 'Tajweed', score: 85, progress: 0 }/g,
  "{ subject: 'Tajweed', score: 0, progress: 0 }"
);
content = content.replace(
  /{ subject: 'Islamic Studies', score: 92, progress: 0 }/g,
  "{ subject: 'Islamic Studies', score: 0, progress: 0 }"
);
content = content.replace(
  /{ subject: 'Arabic Language', score: 78, progress: 0 }/g,
  "{ subject: 'Arabic Language', score: 0, progress: 0 }"
);
content = content.replace(
  /{ subject: 'Hadith', score: 83, progress: 0 }/g,
  "{ subject: 'Hadith', score: 0, progress: 0 }"
);

// 4. Fix Subject Performance display
console.log('4. Removing subject performance display percentages...');
content = content.replace(
  /<p className="text-sm font-semibold">\{item\.score\}%<\/p>/g,
  '<p className="text-sm font-semibold">0%</p>'
);

// 5. Fix Recent Assessment Results - remove participants counts
console.log('5. Removing assessment participants...');
content = content.replace(
  /<td className="px-4 py-3 text-sm">45\/48<\/td>/g,
  '<td className="px-4 py-3 text-sm">0/0</td>'
);
content = content.replace(
  /<td className="px-4 py-3 text-sm">52\/52<\/td>/g,
  '<td className="px-4 py-3 text-sm">0/0</td>'
);

// 6. Remove "Completed" status badges
console.log('6. Removing completed status badges...');
content = content.replace(
  /<span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed<\/span>/g,
  '<span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-500">Not Started</span>'
);

// 7. Remove ALL assessment table rows completely
console.log('7. Removing entire assessment table rows...');
// Replace the tbody content with empty
content = content.replace(
  /<tbody className="divide-y">[\s\S]*?<tr>[\s\S]*?Surah Al-Mulk Test[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?Tajweed Practical[\s\S]*?<\/tr>[\s\S]*?<tr>[\s\S]*?Islamic Studies Quiz[\s\S]*?<\/tr>[\s\S]*?<\/tbody>/g,
  '<tbody className="divide-y"><tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No assessments yet</td></tr></tbody>'
);

// 8. Remove student performance chart data
console.log('8. Removing student performance chart data...');
// Look for chart configurations with data arrays and zero them
content = content.replace(
  /data: \[[^\]]+\]/g,
  (match) => {
    if (match.includes(',')) {
      const count = (match.match(/,/g) || []).length + 1;
      return `data: [${Array(count).fill(0).join(', ')}]`;
    }
    return 'data: [0]';
  }
);

// 9. Remove any remaining percentage displays
console.log('9. Final cleanup of percentage displays...');
content = content.replace(
  />(\d{2,3})%</g,
  '>0%<'
);

// 10. Remove test scores and grades
console.log('10. Removing test scores and grades...');
content = content.replace(
  /Score: \d+%/g,
  'Score: 0%'
);
content = content.replace(
  /Grade: [A-F][+\-]?/g,
  'Grade: -'
);

// 11. Remove accuracy percentages
console.log('11. Removing accuracy percentages...');
content = content.replace(
  /\d+% accuracy/g,
  '0% accuracy'
);

// 12. Clean up any remaining numeric displays
console.log('12. Final numeric cleanup...');
// Remove days completed (like 6/30)
content = content.replace(
  /\d+\/30 days completed/g,
  '0/30 days completed'
);

// Save the file
fs.writeFileSync(filePath, content);

console.log('\n✅ ALL REPORTS DATA REMOVED!');
console.log('📝 Cleaned:');
console.log('   ✓ Attendance trends - all zeroed');
console.log('   ✓ Class attendance comparisons - all zeroed');
console.log('   ✓ Subject performance scores - all zeroed');
console.log('   ✓ Assessment participants - all zeroed');
console.log('   ✓ Completed status badges - changed to "Not Started"');
console.log('   ✓ Assessment table - completely empty');
console.log('   ✓ Student performance charts - all zeroed');
console.log('   ✓ All percentages - set to 0%');
console.log('\n🎉 Dashboard is now COMPLETELY CLEAN!');