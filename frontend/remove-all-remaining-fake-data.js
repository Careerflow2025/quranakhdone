const fs = require('fs');
const path = require('path');

// Read the SchoolDashboard file
const filePath = path.join(__dirname, 'components/dashboard/SchoolDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

console.log('🔧 Removing ALL remaining fake data...\n');

// 1. Fix Targets Dashboard Stats (lines 2707, 2716)
console.log('1. Removing Targets stats (245 students, 3 due)...');
content = content.replace(
  /<p className="text-2xl font-bold text-gray-800">245<\/p>/g,
  '<p className="text-2xl font-bold text-gray-800">0</p>'
);
content = content.replace(
  /<p className="text-2xl font-bold text-gray-800">3<\/p>/g,
  '<p className="text-2xl font-bold text-gray-800">0</p>'
);

// 2. Remove Calendar Events (Juma Prayer at line ~3020, Special Event at line ~3030)
console.log('2. Removing calendar events (Juma Prayer, Competition)...');
// Remove Juma Prayer block
content = content.replace(
  /{\s*dayIndex === 5 && time === '1:00 PM'[^}]*?<\/div>\s*\)}/g,
  '{false}'
);
// Remove Special Event block
content = content.replace(
  /{\s*dayIndex === 2 && time === '3:00 PM'[^}]*?<\/div>\s*\)}/g,
  '{false}'
);

// 3. Fix Calendar Stats Cards (lines ~3060, ~3069, ~3078, ~3087)
console.log('3. Removing calendar stats (32 classes, 128 hours, 245 enrolled, 3 events)...');
content = content.replace(
  /<span className="text-2xl font-bold text-gray-900">32<\/span>/g,
  '<span className="text-2xl font-bold text-gray-900">0</span>'
);
content = content.replace(
  /<span className="text-2xl font-bold text-gray-900">128<\/span>/g,
  '<span className="text-2xl font-bold text-gray-900">0</span>'
);
content = content.replace(
  /<span className="text-2xl font-bold text-gray-900">245<\/span>/g,
  '<span className="text-2xl font-bold text-gray-900">0</span>'
);
content = content.replace(
  /<span className="text-2xl font-bold text-gray-900">3<\/span>/g,
  '<span className="text-2xl font-bold text-gray-900">0</span>'
);

// 4. Remove Inbox notification badge (line ~3149)
console.log('4. Removing inbox notification badge...');
content = content.replace(
  /{tab === 'inbox' && \(\s*<span className="ml-2 px-2 py-0\.5 bg-red-500 text-white text-xs rounded-full">3<\/span>\s*\)}/g,
  '{false}'
);

// 5. Fix Message Stats (lines ~3283, ~3291, ~3300)
console.log('5. Removing message stats (156 sent, 89% open, 24 pending)...');
content = content.replace(
  /<p className="text-2xl font-bold text-gray-900">156<\/p>/g,
  '<p className="text-2xl font-bold text-gray-900">0</p>'
);
content = content.replace(
  /<p className="text-2xl font-bold text-gray-900">89%<\/p>/g,
  '<p className="text-2xl font-bold text-gray-900">0%</p>'
);
content = content.replace(
  /<p className="text-2xl font-bold text-gray-900">24<\/p>/g,
  '<p className="text-2xl font-bold text-gray-900">0</p>'
);

// 6. Fix Reports Section
console.log('6. Removing all reports fake data...');

// Remove "+5 this month" text (line ~3389)
content = content.replace(
  /<p className="text-xs text-blue-200 mt-1">\+5 this month<\/p>/g,
  '<p className="text-xs text-blue-200 mt-1">No changes</p>'
);

// Fix attendance rate 94.2% (lines ~3413, ~3426)
content = content.replace(
  /<span className="text-2xl font-bold">94\.2%<\/span>/g,
  '<span className="text-2xl font-bold">0%</span>'
);
content = content.replace(
  /reportDateRange === '30days' \? '94\.2%'/g,
  "reportDateRange === '30days' ? '0%'"
);
content = content.replace(
  /reportDateRange === '3months' \? '92\.8%'/g,
  "reportDateRange === '3months' ? '0%'"
);
content = content.replace(
  /reportDateRange === '6months' \? '91\.5%'/g,
  "reportDateRange === '6months' ? '0%'"
);
content = content.replace(
  /reportDateRange === 'year' \? '90\.2%'/g,
  "reportDateRange === 'year' ? '0%'"
);

// Fix "+2.3% from last month" (line ~3416)
content = content.replace(
  /<p className="text-xs text-orange-200 mt-1">\+2\.3% from last month<\/p>/g,
  '<p className="text-xs text-orange-200 mt-1">No change</p>'
);

// Fix KPI data
console.log('7. Removing KPI indicators...');
// Average Attendance
content = content.replace(
  /reportDateRange === '30days' \? '88%' : reportDateRange === '3months' \? '86%' : reportDateRange === '6months' \? '84%' : '82%'/g,
  "'0%'"
);
// Completion Rate
content = content.replace(
  /reportDateRange === '30days' \? '82\.5%' : reportDateRange === '3months' \? '80\.2%' : reportDateRange === '6months' \? '78\.5%' : '76\.8%'/g,
  "'0%'"
);
// Average Performance
content = content.replace(
  /reportDateRange === '30days' \? '3\.8' : reportDateRange === '3months' \? '3\.7' : reportDateRange === '6months' \? '3\.6' : '3\.5'/g,
  "'0'"
);
// Total Hours
content = content.replace(
  /reportDateRange === '30days' \? '156' : reportDateRange === '3months' \? '468' : reportDateRange === '6months' \? '936' : '1872'/g,
  "'0'"
);

// Fix attendance trends data
console.log('8. Removing attendance trends chart data...');
content = content.replace(
  /data: \[92, 88, 90, 94, 91, 93, 95\]/g,
  'data: [0, 0, 0, 0, 0, 0, 0]'
);
content = content.replace(
  /data: \[3, 5, 4, 2, 4, 3, 2\]/g,
  'data: [0, 0, 0, 0, 0, 0, 0]'
);

// Fix student performance overview
console.log('9. Removing student performance data...');
content = content.replace(
  /Math\.floor\(Math\.random\(\) \* 40\) \+ 60/g,
  '0'
);

// Fix subject performance
console.log('10. Removing subject performance data...');
content = content.replace(
  /progress: Math\.floor\(Math\.random\(\) \* 30\) \+ 70/g,
  'progress: 0'
);

// Fix recent assessment results
console.log('11. Removing assessment results...');
content = content.replace(
  /score: `\${Math\.floor\(Math\.random\(\) \* 30\) \+ 70}%`/g,
  "score: '0%'"
);

// Fix the report export data
console.log('12. Fixing report export data...');
content = content.replace(
  /Avg Attendance: .*?%/g,
  'Avg Attendance: 0%'
);
content = content.replace(
  /Completion Rate: .*?%/g,
  'Completion Rate: 0%'
);
content = content.replace(
  /Avg Performance: \d+\.\d+/g,
  'Avg Performance: 0'
);
content = content.replace(
  /Total Hours: \d+/g,
  'Total Hours: 0'
);

// Save the file
fs.writeFileSync(filePath, content);

console.log('\n✅ Successfully removed ALL remaining fake data!');
console.log('📝 Fixed:');
console.log('   - Targets dashboard stats (students & due count)');
console.log('   - Calendar events (Juma Prayer & Competition)');
console.log('   - Calendar stats cards');
console.log('   - Inbox notification badge');
console.log('   - Message statistics');
console.log('   - Reports: attendance rate, KPIs, trends');
console.log('   - Student performance data');
console.log('   - Subject performance data');
console.log('   - Assessment results');
console.log('\n🎉 Dashboard is now completely clean for new schools!');