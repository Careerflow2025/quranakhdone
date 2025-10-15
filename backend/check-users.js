const Database = require('better-sqlite3');
const path = require('path');

// Open the database
const db = new Database(path.join(__dirname, 'database.sqlite'), { readonly: true });

console.log('\n=== CHECKING EXISTING USERS IN DATABASE ===\n');

// Check profiles table
try {
  const users = db.prepare(`
    SELECT
      p.user_id,
      p.email,
      p.display_name,
      p.role,
      p.school_id,
      p.created_at,
      s.name as school_name
    FROM profiles p
    LEFT JOIN schools s ON s.id = p.school_id
    ORDER BY p.created_at DESC
  `).all();

  if (users.length === 0) {
    console.log('❌ No users found in the database.\n');
  } else {
    console.log(`✅ Found ${users.length} user(s) in the database:\n`);

    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name || 'No Name'}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   School: ${user.school_name || 'No School'}`);
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`);
      console.log(`   User ID: ${user.user_id}`);
      console.log('');
    });
  }

  // Check schools
  const schools = db.prepare('SELECT * FROM schools').all();
  console.log(`\n📚 Found ${schools.length} school(s) in the database:`);
  schools.forEach(school => {
    console.log(`   - ${school.name} (ID: ${school.id})`);
  });

  // Check students, teachers, parents
  const students = db.prepare('SELECT COUNT(*) as count FROM students').get();
  const teachers = db.prepare('SELECT COUNT(*) as count FROM teachers').get();
  const parents = db.prepare('SELECT COUNT(*) as count FROM parents').get();

  console.log('\n📊 User Type Breakdown:');
  console.log(`   Students: ${students.count}`);
  console.log(`   Teachers: ${teachers.count}`);
  console.log(`   Parents: ${parents.count}`);

} catch (error) {
  console.error('Error reading database:', error.message);
}

db.close();
console.log('\n=== END OF DATABASE CHECK ===\n');