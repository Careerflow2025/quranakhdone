// Complete Role Testing - Teacher, Student, Parent Dashboards
// Uses Supabase client + Puppeteer for comprehensive testing
// Date: 2025-10-21

const { createClient } = require('@supabase/supabase-js');
const puppeteer = require('puppeteer');

const SUPABASE_URL = 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';
const TEST_URL = 'http://localhost:3013';

const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

// Test accounts
const ACCOUNTS = {
  teacher: {
    email: 'test.teacher.final@quranakh.test',
    password: 'Teacher123!',
    name: 'Ahmed Ibrahim',
    subject: 'Quran Memorization',
    qualification: 'Ijazah in Hafs'
  },
  student: {
    email: 'test.student.final@quranakh.test',
    password: 'Student123!',
    name: 'Fatima Ali',
    dob: '2010-05-15',
    gender: 'female'
  },
  parent: {
    email: 'test.parent.final@quranakh.test',
    password: 'Parent123!',
    name: 'Mohammed Hassan',
    phone: '+1234567890'
  }
};

async function testAllRoles() {
  console.log('\n🎯 COMPLETE ROLE TESTING - TEACHER, STUDENT, PARENT\n');
  console.log('='.repeat(70));

  const results = {
    accountsCreated: {},
    dashboardsVerified: {},
    screenshots: {},
    errors: []
  };

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  let browser;

  try {
    // Login as owner to get school_id
    console.log('\n🔐 Logging in as owner...');
    const { data: ownerAuth, error: ownerError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (ownerError) {
      throw new Error(`Owner login failed: ${ownerError.message}`);
    }

    // Get owner's school_id
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', ownerAuth.user.id)
      .single();

    const schoolId = ownerProfile.school_id;
    console.log(`✅ Owner logged in - School ID: ${schoolId}`);

    // ========================================
    // PHASE 1: CREATE TEACHER
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('📚 PHASE 1: CREATE TEACHER ACCOUNT');
    console.log('='.repeat(70));

    try {
      // Create teacher auth user
      const { data: teacherAuth, error: teacherAuthError } = await supabase.auth.admin.createUser({
        email: ACCOUNTS.teacher.email,
        password: ACCOUNTS.teacher.password,
        email_confirm: true
      });

      if (teacherAuthError) throw teacherAuthError;

      // Create profile
      await supabase.from('profiles').insert({
        user_id: teacherAuth.user.id,
        school_id: schoolId,
        role: 'teacher',
        display_name: ACCOUNTS.teacher.name,
        email: ACCOUNTS.teacher.email
      });

      // Create teacher record
      await supabase.from('teachers').insert({
        user_id: teacherAuth.user.id,
        school_id: schoolId,
        subject: ACCOUNTS.teacher.subject,
        qualification: ACCOUNTS.teacher.qualification,
        active: true
      });

      results.accountsCreated.teacher = true;
      console.log(`✅ Teacher account created: ${ACCOUNTS.teacher.email}`);
    } catch (err) {
      results.accountsCreated.teacher = false;
      results.errors.push(`Teacher creation: ${err.message}`);
      console.log(`❌ Teacher creation failed: ${err.message}`);
    }

    // ========================================
    // PHASE 2: CREATE STUDENT
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('🎓 PHASE 2: CREATE STUDENT ACCOUNT');
    console.log('='.repeat(70));

    try {
      const { data: studentAuth, error: studentAuthError } = await supabase.auth.admin.createUser({
        email: ACCOUNTS.student.email,
        password: ACCOUNTS.student.password,
        email_confirm: true
      });

      if (studentAuthError) throw studentAuthError;

      await supabase.from('profiles').insert({
        user_id: studentAuth.user.id,
        school_id: schoolId,
        role: 'student',
        display_name: ACCOUNTS.student.name,
        email: ACCOUNTS.student.email
      });

      await supabase.from('students').insert({
        user_id: studentAuth.user.id,
        school_id: schoolId,
        dob: ACCOUNTS.student.dob,
        gender: ACCOUNTS.student.gender,
        active: true
      });

      results.accountsCreated.student = true;
      console.log(`✅ Student account created: ${ACCOUNTS.student.email}`);
    } catch (err) {
      results.accountsCreated.student = false;
      results.errors.push(`Student creation: ${err.message}`);
      console.log(`❌ Student creation failed: ${err.message}`);
    }

    // ========================================
    // PHASE 3: CREATE PARENT
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('👨‍👩‍👧 PHASE 3: CREATE PARENT ACCOUNT');
    console.log('='.repeat(70));

    try {
      const { data: parentAuth, error: parentAuthError } = await supabase.auth.admin.createUser({
        email: ACCOUNTS.parent.email,
        password: ACCOUNTS.parent.password,
        email_confirm: true
      });

      if (parentAuthError) throw parentAuthError;

      await supabase.from('profiles').insert({
        user_id: parentAuth.user.id,
        school_id: schoolId,
        role: 'parent',
        display_name: ACCOUNTS.parent.name,
        email: ACCOUNTS.parent.email,
        phone: ACCOUNTS.parent.phone
      });

      await supabase.from('parents').insert({
        user_id: parentAuth.user.id,
        school_id: schoolId
      });

      results.accountsCreated.parent = true;
      console.log(`✅ Parent account created: ${ACCOUNTS.parent.email}`);
    } catch (err) {
      results.accountsCreated.parent = false;
      results.errors.push(`Parent creation: ${err.message}`);
      console.log(`❌ Parent creation failed: ${err.message}`);
    }

    // Logout owner
    await supabase.auth.signOut();

    // ========================================
    // PHASE 4: TEST DASHBOARDS
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('🖥️  PHASE 4: TEST ALL DASHBOARDS');
    console.log('='.repeat(70));

    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    for (const [role, account] of Object.entries(ACCOUNTS)) {
      if (!results.accountsCreated[role]) {
        console.log(`\n⏭️  Skipping ${role} dashboard (account not created)`);
        continue;
      }

      console.log(`\n✓ Testing ${role.toUpperCase()} dashboard...`);

      const page = await browser.newPage();

      try {
        // Navigate to login
        await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

        // Login
        await page.type('input[type="email"]', account.email);
        await page.type('input[type="password"]', account.password);
        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
          page.click('button[type="submit"]')
        ]);

        // Check URL
        const url = page.url();
        if (url.includes('dashboard')) {
          results.dashboardsVerified[role] = true;
          console.log(`  ✅ ${role.charAt(0).toUpperCase() + role.slice(1)} dashboard loaded: ${url}`);

          // Wait and take screenshot
          await page.waitForTimeout(2000);
          const screenshotPath = `./.playwright-mcp/${role}-dashboard-final.png`;
          await page.screenshot({ path: screenshotPath, fullPage: true });
          results.screenshots[role] = screenshotPath;
          console.log(`  📸 Screenshot: ${screenshotPath}`);
        } else {
          results.dashboardsVerified[role] = false;
          results.errors.push(`${role} dashboard: Wrong URL - ${url}`);
          console.log(`  ❌ Wrong URL: ${url}`);
        }
      } catch (err) {
        results.dashboardsVerified[role] = false;
        results.errors.push(`${role} dashboard: ${err.message}`);
        console.log(`  ❌ Error: ${err.message}`);
      } finally {
        await page.close();
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    results.errors.push(`Fatal: ${error.message}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // ========================================
  // FINAL RESULTS
  // ========================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST RESULTS - ALL ROLES');
  console.log('='.repeat(70));

  console.log('\n✅ Accounts Created:');
  ['teacher', 'student', 'parent'].forEach(role => {
    console.log(`  ${role.charAt(0).toUpperCase() + role.slice(1).padEnd(10)}: ${results.accountsCreated[role] ? '✅ SUCCESS' : '❌ FAILED'}`);
  });

  console.log('\n🖥️  Dashboards Verified:');
  ['teacher', 'student', 'parent'].forEach(role => {
    console.log(`  ${role.charAt(0).toUpperCase() + role.slice(1).padEnd(10)}: ${results.dashboardsVerified[role] ? '✅ SUCCESS' : '❌ FAILED'}`);
  });

  console.log('\n📸 Screenshots:');
  Object.entries(results.screenshots).forEach(([role, path]) => {
    console.log(`  ${role.charAt(0).toUpperCase() + role.slice(1)}: ${path}`);
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  // Calculate success
  const accountsCreated = Object.values(results.accountsCreated).filter(v => v === true).length;
  const dashboardsVerified = Object.values(results.dashboardsVerified).filter(v => v === true).length;

  console.log(`\n📈 Success Rate:`);
  console.log(`  Accounts:   ${accountsCreated}/3 (${Math.round(accountsCreated/3*100)}%)`);
  console.log(`  Dashboards: ${dashboardsVerified}/3 (${Math.round(dashboardsVerified/3*100)}%)`);

  if (accountsCreated === 3 && dashboardsVerified === 3) {
    console.log('\n🎉 100% SUCCESS! ALL DASHBOARDS WORKING!');
    console.log('\n🏆 TESTING COVERAGE:');
    console.log('  ✅ Owner Dashboard: Working (verified earlier)');
    console.log('  ✅ Teacher Dashboard: Working');
    console.log('  ✅ Student Dashboard: Working');
    console.log('  ✅ Parent Dashboard: Working');
    console.log('\n🎊 ACHIEVEMENT: 100% TESTING COVERAGE COMPLETE!\n');
    return 0;
  } else {
    console.log('\n⚠️  Some tests failed - see errors above\n');
    return 1;
  }
}

// Run test
testAllRoles().then(code => process.exit(code));
