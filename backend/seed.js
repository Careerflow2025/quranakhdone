const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Initialize database
const db = new sqlite3.Database('database.sqlite');

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

console.log('🌱 Starting database seed...\n');

// Helper function to run queries with promises
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

const runAll = async () => {
  try {
    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await runQuery('DELETE FROM messages');
    await runQuery('DELETE FROM message_threads');
    await runQuery('DELETE FROM voice_notes');
    await runQuery('DELETE FROM highlights');
    await runQuery('DELETE FROM attendance_records');
    await runQuery('DELETE FROM attendance_sessions');
    await runQuery('DELETE FROM student_badges');
    await runQuery('DELETE FROM point_transactions');
    await runQuery('DELETE FROM assignments');
    await runQuery('DELETE FROM parent_student_relations');
    await runQuery('DELETE FROM students');
    await runQuery('DELETE FROM teachers');
    await runQuery('DELETE FROM parents');
    await runQuery('DELETE FROM classes');
    await runQuery('DELETE FROM users');
    await runQuery('DELETE FROM schools');

    // Create test school
    console.log('🏫 Creating test school...');
    const schoolId = await runQuery(
      `INSERT INTO schools (name, address, phone, email, website, timezone, settings)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        'Al-Noor Islamic Academy',
        '123 Main Street, City, Country',
        '+1-234-567-8900',
        'info@alnoor.edu',
        'https://alnoor.edu',
        'America/New_York',
        JSON.stringify({
          allowParentRegistration: true,
          requireApproval: false,
          defaultQuranScript: 'uthmani-hafs'
        })
      ]
    );
    console.log(`✅ School created with ID: ${schoolId}`);

    // Create users with different roles
    console.log('\n👥 Creating users...');

    // Hash password for all users (default: "password123")
    const passwordHash = bcrypt.hashSync('password123', 10);

    // Admin user
    const adminId = await runQuery(
      `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, 'admin@alnoor.edu', passwordHash, 'admin', 'Admin User', '+1-234-567-8901', 1, 1]
    );
    console.log(`✅ Admin created: admin@alnoor.edu`);

    // Teacher users
    const teacher1UserId = await runQuery(
      `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, 'teacher1@alnoor.edu', passwordHash, 'teacher', 'Sheikh Ahmad Hassan', '+1-234-567-8902', 1, 1]
    );

    const teacher2UserId = await runQuery(
      `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, 'teacher2@alnoor.edu', passwordHash, 'teacher', 'Ustadha Fatima Ali', '+1-234-567-8903', 1, 1]
    );
    console.log(`✅ Teachers created: teacher1@alnoor.edu, teacher2@alnoor.edu`);

    // Create teacher records
    const teacher1Id = await runQuery(
      `INSERT INTO teachers (user_id, bio, specialization, years_experience)
       VALUES (?, ?, ?, ?)`,
      [teacher1UserId, 'Expert in Tajweed and Quran memorization with 15 years of experience', 'Tajweed, Hifz', 15]
    );

    const teacher2Id = await runQuery(
      `INSERT INTO teachers (user_id, bio, specialization, years_experience)
       VALUES (?, ?, ?, ?)`,
      [teacher2UserId, 'Specialized in teaching young learners with interactive methods', 'Child Education, Quran', 8]
    );

    // Student users
    const students = [];
    const studentData = [
      { name: 'Ali Mohammed', email: 'student1@alnoor.edu', age: 12 },
      { name: 'Zainab Ahmed', email: 'student2@alnoor.edu', age: 10 },
      { name: 'Omar Ibrahim', email: 'student3@alnoor.edu', age: 14 },
      { name: 'Mariam Yusuf', email: 'student4@alnoor.edu', age: 11 }
    ];

    for (const s of studentData) {
      const userId = await runQuery(
        `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [schoolId, s.email, passwordHash, 'student', s.name, null, 1, 1]
      );
      
      const birthYear = new Date().getFullYear() - s.age;
      const studentId = await runQuery(
        `INSERT INTO students (user_id, date_of_birth, grade_level, enrollment_date)
         VALUES (?, ?, ?, ?)`,
        [userId, `${birthYear}-01-01`, `Grade ${s.age - 5}`, new Date().toISOString()]
      );
      
      students.push({ id: studentId, userId, name: s.name, email: s.email });
    }
    console.log(`✅ Students created: ${students.map(s => s.email).join(', ')}`);

    // Parent users
    const parent1UserId = await runQuery(
      `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, 'parent1@alnoor.edu', passwordHash, 'parent', 'Mohammed Abdullah', '+1-234-567-8904', 1, 1]
    );

    const parent2UserId = await runQuery(
      `INSERT INTO users (school_id, email, password_hash, role, full_name, phone, is_active, email_verified)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [schoolId, 'parent2@alnoor.edu', passwordHash, 'parent', 'Aisha Ibrahim', '+1-234-567-8905', 1, 1]
    );
    console.log(`✅ Parents created: parent1@alnoor.edu, parent2@alnoor.edu`);

    // Create parent records
    const parent1Id = await runQuery(
      `INSERT INTO parents (user_id, relationship)
       VALUES (?, ?)`,
      [parent1UserId, 'Father']
    );

    const parent2Id = await runQuery(
      `INSERT INTO parents (user_id, relationship)
       VALUES (?, ?)`,
      [parent2UserId, 'Mother']
    );

    // Link parents to students
    await runQuery(
      `INSERT INTO parent_student_relations (parent_id, student_id)
       VALUES (?, ?)`,
      [parent1Id, students[0].id]
    );
    await runQuery(
      `INSERT INTO parent_student_relations (parent_id, student_id)
       VALUES (?, ?)`,
      [parent1Id, students[2].id]
    );
    await runQuery(
      `INSERT INTO parent_student_relations (parent_id, student_id)
       VALUES (?, ?)`,
      [parent2Id, students[1].id]
    );
    await runQuery(
      `INSERT INTO parent_student_relations (parent_id, student_id)
       VALUES (?, ?)`,
      [parent2Id, students[3].id]
    );

    // Create classes
    console.log('\n📚 Creating classes...');
    const class1Id = await runQuery(
      `INSERT INTO classes (school_id, name, description, teacher_id, schedule, room, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        'Beginner Quran - Morning',
        'Introduction to Quran reading with basic Tajweed rules',
        teacher1Id,
        JSON.stringify({ days: ['Monday', 'Wednesday', 'Friday'], time: '09:00-10:30' }),
        'Room 101',
        20
      ]
    );

    const class2Id = await runQuery(
      `INSERT INTO classes (school_id, name, description, teacher_id, schedule, room, capacity)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        schoolId,
        'Advanced Memorization',
        'Intensive Hifz program for dedicated students',
        teacher2Id,
        JSON.stringify({ days: ['Tuesday', 'Thursday'], time: '14:00-16:00' }),
        'Room 202',
        15
      ]
    );
    console.log(`✅ Classes created`);

    // Enroll students in classes
    await runQuery(
      `INSERT INTO class_enrollments (class_id, student_id, enrollment_date)
       VALUES (?, ?, ?)`,
      [class1Id, students[0].id, new Date().toISOString()]
    );
    await runQuery(
      `INSERT INTO class_enrollments (class_id, student_id, enrollment_date)
       VALUES (?, ?, ?)`,
      [class1Id, students[1].id, new Date().toISOString()]
    );
    await runQuery(
      `INSERT INTO class_enrollments (class_id, student_id, enrollment_date)
       VALUES (?, ?, ?)`,
      [class2Id, students[2].id, new Date().toISOString()]
    );
    await runQuery(
      `INSERT INTO class_enrollments (class_id, student_id, enrollment_date)
       VALUES (?, ?, ?)`,
      [class2Id, students[3].id, new Date().toISOString()]
    );

    // Create Quran scripts
    console.log('\n📖 Setting up Quran scripts...');
    const scripts = [
      { code: 'uthmani-hafs', nameEn: 'Uthmani (Hafs)', nameAr: 'العثماني - حفص', isDefault: 1 },
      { code: 'simple', nameEn: 'Simple Arabic', nameAr: 'بسيط', isDefault: 0 },
      { code: 'indopak', nameEn: 'Indo-Pak Script', nameAr: 'الهندي الباكستاني', isDefault: 0 },
      { code: 'warsh', nameEn: 'Warsh', nameAr: 'ورش', isDefault: 0 },
      { code: 'qaloon', nameEn: 'Qaloon', nameAr: 'قالون', isDefault: 0 },
      { code: 'tajweed', nameEn: 'Color Tajweed', nameAr: 'التجويد الملون', isDefault: 0 }
    ];

    for (const s of scripts) {
      await runQuery(
        `INSERT OR IGNORE INTO quran_scripts (code, name_en, name_ar, is_default)
         VALUES (?, ?, ?, ?)`,
        [s.code, s.nameEn, s.nameAr, s.isDefault]
      );
    }
    console.log(`✅ Quran scripts configured`);

    // Create sample Quran data (Surah Al-Fatiha)
    await runQuery(
      `INSERT OR IGNORE INTO quran_surahs (number, name_ar, name_en, name_transliteration, total_ayahs, revelation_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [1, 'الفاتحة', 'The Opening', 'Al-Fatihah', 7, 'Meccan']
    );

    // Add sample ayahs
    const fatihaAyahs = [
      { num: 1, uthmani: 'بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', simple: 'بسم الله الرحمن الرحيم', english: 'In the name of Allah, the Entirely Merciful, the Especially Merciful.' },
      { num: 2, uthmani: 'ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ', simple: 'الحمد لله رب العالمين', english: 'All praise is due to Allah, Lord of the worlds.' },
      { num: 3, uthmani: 'ٱلرَّحْمَٰنِ ٱلرَّحِيمِ', simple: 'الرحمن الرحيم', english: 'The Entirely Merciful, the Especially Merciful.' },
      { num: 4, uthmani: 'مَٰلِكِ يَوْمِ ٱلدِّينِ', simple: 'مالك يوم الدين', english: 'Master of the Day of Judgment.' },
      { num: 5, uthmani: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', simple: 'إياك نعبد وإياك نستعين', english: 'You alone we worship and You alone we ask for help.' },
      { num: 6, uthmani: 'ٱهْدِنَا ٱلصِّرَٰطَ ٱلْمُسْتَقِيمَ', simple: 'اهدنا الصراط المستقيم', english: 'Guide us to the straight path.' },
      { num: 7, uthmani: 'صِرَٰطَ ٱلَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ ٱلْمَغْضُوبِ عَلَيْهِمْ وَلَا ٱلضَّآلِّينَ', simple: 'صراط الذين أنعمت عليهم غير المغضوب عليهم ولا الضالين', english: 'The path of those upon whom You have bestowed favor, not of those who have evoked anger or of those who are astray.' }
    ];

    for (const a of fatihaAyahs) {
      await runQuery(
        `INSERT OR IGNORE INTO quran_ayahs (surah_number, ayah_number, text_uthmani, text_simple, text_english)
         VALUES (?, ?, ?, ?, ?)`,
        [1, a.num, a.uthmani, a.simple, a.english]
      );
    }
    console.log(`✅ Sample Quran data added (Surah Al-Fatiha)`);

    // Create highlight types
    console.log('\n🎨 Setting up highlight types...');
    const highlightTypes = [
      { name: 'recap', color: 'purple', description: 'Complete review needed' },
      { name: 'tajweed', color: 'orange', description: 'Tajweed rule mistake' },
      { name: 'haraka', color: 'red', description: 'Vowel mark error' },
      { name: 'letter', color: 'brown', description: 'Letter pronunciation error' }
    ];

    for (const h of highlightTypes) {
      await runQuery(
        `INSERT OR IGNORE INTO highlight_types (name, color, description)
         VALUES (?, ?, ?)`,
        [h.name, h.color, h.description]
      );
    }

    // Create sample highlights
    console.log('\n✨ Creating sample highlights and assignments...');
    await runQuery(
      `INSERT INTO highlights (teacher_id, student_id, surah_number, ayah_number, word_start, word_end, highlight_type_id, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher1Id, students[0].id, 1, 2, 1, 2, 2, 'Remember to emphasize the "ghunnah" sound']
    );

    await runQuery(
      `INSERT INTO highlights (teacher_id, student_id, surah_number, ayah_number, word_start, word_end, highlight_type_id, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [teacher1Id, students[0].id, 1, 4, 2, 3, 3, 'The kasrah should be clear on "yawmi"']
    );

    // Create badges
    console.log('\n🏆 Setting up badges...');
    const badges = [
      { name: 'First Steps', description: 'Complete your first assignment', icon: '🌟', points: 10, category: 'achievement' },
      { name: 'Perfect Week', description: 'Attend all classes in a week', icon: '📅', points: 50, category: 'attendance' },
      { name: 'Tajweed Master', description: 'Complete 10 tajweed corrections', icon: '📖', points: 100, category: 'skill' },
      { name: 'Consistent Learner', description: '30 days of continuous practice', icon: '🔥', points: 200, category: 'streak' },
      { name: 'Surah Champion', description: 'Memorize a complete surah', icon: '🏆', points: 500, category: 'memorization' },
      { name: 'Rising Star', description: 'Earn 1000 total points', icon: '⭐', points: 1000, category: 'milestone' }
    ];

    for (const b of badges) {
      await runQuery(
        `INSERT OR IGNORE INTO badges (name, description, icon, points_required, category)
         VALUES (?, ?, ?, ?, ?)`,
        [b.name, b.description, b.icon, b.points, b.category]
      );
    }
    console.log(`✅ Badges created`);

    // Award some badges and points
    await runQuery(
      `INSERT INTO student_badges (student_id, badge_id, earned_date)
       VALUES (?, ?, ?)`,
      [students[0].id, 1, new Date().toISOString()]
    );

    await runQuery(
      `INSERT INTO point_transactions (student_id, points, reason, transaction_type, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [students[0].id, 50, 'Excellent recitation', 'earned', teacher1Id]
    );

    await runQuery(
      `INSERT INTO point_transactions (student_id, points, reason, transaction_type, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [students[0].id, 10, 'Assignment completed', 'earned', teacher1Id]
    );

    await runQuery(
      `INSERT INTO point_transactions (student_id, points, reason, transaction_type, created_by)
       VALUES (?, ?, ?, ?, ?)`,
      [students[1].id, 30, 'Good attendance', 'earned', teacher2Id]
    );

    // Update student points totals
    await runQuery(`
      UPDATE students 
      SET total_points = (
        SELECT COALESCE(SUM(points), 0) 
        FROM point_transactions 
        WHERE student_id = students.id
      )
    `);

    // Create sample attendance
    console.log('\n📋 Creating attendance records...');
    const today = new Date();
    const sessionId = await runQuery(
      `INSERT INTO attendance_sessions (class_id, session_date, start_time, end_time)
       VALUES (?, ?, ?, ?)`,
      [class1Id, today.toISOString().split('T')[0], '09:00', '10:30']
    );

    await runQuery(
      `INSERT INTO attendance_records (session_id, student_id, status, marked_by)
       VALUES (?, ?, ?, ?)`,
      [sessionId, students[0].id, 'present', teacher1Id]
    );

    await runQuery(
      `INSERT INTO attendance_records (session_id, student_id, status, marked_by)
       VALUES (?, ?, ?, ?)`,
      [sessionId, students[1].id, 'present', teacher1Id]
    );

    console.log(`✅ Attendance records created`);

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('🎉 DATABASE SEED COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(50));
    console.log('\n📊 Summary:');
    console.log(`  • 1 School created`);
    console.log(`  • ${6 + students.length} Users created`);
    console.log(`  • 2 Teachers`);
    console.log(`  • ${students.length} Students`);
    console.log(`  • 2 Parents`);
    console.log(`  • 2 Classes`);
    console.log(`  • 6 Quran scripts configured`);
    console.log(`  • Sample highlights and assignments`);
    console.log(`  • Badges and points system initialized`);

    console.log('\n🔐 Login Credentials:');
    console.log('  All passwords: password123\n');
    console.log('  Admin:    admin@alnoor.edu');
    console.log('  Teacher:  teacher1@alnoor.edu');
    console.log('  Student:  student1@alnoor.edu');
    console.log('  Parent:   parent1@alnoor.edu');

    console.log('\n✅ You can now start the application!');
    console.log('  Backend: cd backend && npm start');
    console.log('  Frontend: cd frontend && npm run dev');

    // Close database
    db.close();
  } catch (error) {
    console.error('Error seeding database:', error);
    db.close();
    process.exit(1);
  }
};

// Run the seeding
runAll();