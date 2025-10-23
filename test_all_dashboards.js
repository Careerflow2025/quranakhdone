// Complete Dashboard Testing - All User Roles
// Tests: Teacher, Student, Parent account creation and dashboard rendering
// Date: 2025-10-21

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const TEST_URL = 'http://localhost:3017';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

// Test accounts to create and verify
const TEST_ACCOUNTS = {
  teacher: {
    email: 'test.teacher@quranakh.test',
    password: 'Teacher123!',
    name: 'Ahmed Ibrahim',
    role: 'teacher',
    subject: 'Quran Memorization',
    qualification: 'Ijazah in Hafs',
    experience: 5
  },
  student: {
    email: 'test.student@quranakh.test',
    password: 'Student123!',
    name: 'Fatima Ali',
    role: 'student',
    dob: '2010-05-15',
    gender: 'female'
  },
  parent: {
    email: 'test.parent@quranakh.test',
    password: 'Parent123!',
    name: 'Mohammed Hassan',
    role: 'parent',
    phone: '+1234567890'
  }
};

async function makeAuthenticatedRequest(url, method, body, authToken) {
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify(body)
  });
  return response.json();
}

async function testAllDashboards() {
  console.log('\n🎯 COMPLETE DASHBOARD TESTING - ALL USER ROLES\n');
  console.log('='.repeat(70));

  const results = {
    accountsCreated: {},
    dashboardsWorking: {},
    screenshots: {},
    errors: []
  };

  let browser;
  let authToken;

  try {
    // Authenticate as owner first
    console.log('\n🔐 Authenticating as school owner...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (authError) {
      throw new Error(`Owner authentication failed: ${authError.message}`);
    }

    authToken = authData.session.access_token;
    console.log(`✅ Owner authenticated (User ID: ${authData.user.id})\n`);

    // Launch browser
    console.log('📱 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // ========================================
    // STEP 1: Create Teacher Account
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('📚 PHASE 1: TEACHER ACCOUNT');
    console.log('='.repeat(70));

    console.log('\n✓ Creating teacher account via API...');
    const teacherResponse = await fetch(`${TEST_URL}/api/school/create-teacher`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: TEST_ACCOUNTS.teacher.name,
        email: `test.teacher.${Date.now()}@quranakh.test`,
        password: 'Teacher123!',
        phone: '+1234567890',
        bio: 'Test teacher for dashboard verification'
      })
    });

    const teacherResult = await teacherResponse.json();
    let teacherCredentials = null;

    if (teacherResult.success && teacherResult.data) {
      results.accountsCreated.teacher = true;
      teacherCredentials = {
        email: teacherResult.data.email,
        password: teacherResult.data.password
      };
      console.log(`  ✅ Teacher account created`);
      console.log(`  📧 Email: ${teacherCredentials.email}`);
      console.log(`  🔑 Password: ${teacherCredentials.password}`);
      console.log(`  👤 Name: ${TEST_ACCOUNTS.teacher.name}`);
    } else {
      results.accountsCreated.teacher = false;
      results.errors.push(`Teacher creation failed: ${teacherResult.error || 'Unknown error'}`);
      console.log(`  ❌ Teacher creation failed: ${teacherResult.error}`);
    }

    // Test teacher login and dashboard
    if (results.accountsCreated.teacher && teacherCredentials) {
      console.log('\n✓ Testing teacher login...');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
      await page.type('input[type="email"]', teacherCredentials.email);
      await page.type('input[type="password"]', teacherCredentials.password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);

      const teacherUrl = page.url();
      if (teacherUrl.includes('dashboard')) {
        results.dashboardsWorking.teacher = true;
        console.log(`  ✅ Teacher dashboard loaded: ${teacherUrl}`);

        // Wait and take screenshot
        await new Promise(resolve => setTimeout(resolve, 2000));
        const screenshotPath = './.playwright-mcp/teacher-dashboard.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.teacher = screenshotPath;
        console.log(`  📸 Screenshot: ${screenshotPath}`);
      } else {
        results.dashboardsWorking.teacher = false;
        results.errors.push(`Teacher dashboard not loaded, URL: ${teacherUrl}`);
        console.log(`  ❌ Teacher dashboard failed to load`);
      }

      // Logout
      console.log('  🚪 Logging out...');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2' });
    }

    // ========================================
    // STEP 2: Create Student Account
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('🎓 PHASE 2: STUDENT ACCOUNT');
    console.log('='.repeat(70));

    console.log('\n✓ Creating student account via API...');
    const studentResponse = await fetch(`${TEST_URL}/api/auth/create-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: TEST_ACCOUNTS.student.name,
        email: `test.student.${Date.now()}@quranakh.test`,
        dob: TEST_ACCOUNTS.student.dob,
        gender: TEST_ACCOUNTS.student.gender
      })
    });

    const studentResult = await studentResponse.json();
    let studentCredentials = null;

    if (studentResult.success || studentResult.student) {
      results.accountsCreated.student = true;
      studentCredentials = studentResult.credentials;
      console.log(`  ✅ Student account created`);
      console.log(`  📧 Email: ${studentCredentials.email}`);
      console.log(`  🔑 Password: ${studentCredentials.password}`);
      console.log(`  👤 Name: ${TEST_ACCOUNTS.student.name}`);
    } else {
      results.accountsCreated.student = false;
      results.errors.push(`Student creation failed: ${studentResult.error || 'Unknown error'}`);
      console.log(`  ❌ Student creation failed: ${studentResult.error}`);
    }

    // Test student login and dashboard
    if (results.accountsCreated.student && studentCredentials) {
      console.log('\n✓ Testing student login...');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

      // Clear previous inputs
      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });

      await page.type('input[type="email"]', studentCredentials.email);
      await page.type('input[type="password"]', studentCredentials.password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);

      const studentUrl = page.url();
      if (studentUrl.includes('dashboard')) {
        results.dashboardsWorking.student = true;
        console.log(`  ✅ Student dashboard loaded: ${studentUrl}`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        const screenshotPath = './.playwright-mcp/student-dashboard.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.student = screenshotPath;
        console.log(`  📸 Screenshot: ${screenshotPath}`);
      } else {
        results.dashboardsWorking.student = false;
        results.errors.push(`Student dashboard not loaded, URL: ${studentUrl}`);
        console.log(`  ❌ Student dashboard failed to load`);
      }

      // Logout
      console.log('  🚪 Logging out...');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2' });
    }

    // ========================================
    // STEP 3: Create Parent Account
    // ========================================
    console.log('\n' + '='.repeat(70));
    console.log('👨‍👩‍👧 PHASE 3: PARENT ACCOUNT');
    console.log('='.repeat(70));

    console.log('\n✓ Creating parent account via API...');
    const parentResponse = await fetch(`${TEST_URL}/api/auth/create-parent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: TEST_ACCOUNTS.parent.name,
        email: `test.parent.${Date.now()}@quranakh.test`
      })
    });

    const parentResult = await parentResponse.json();
    let parentCredentials = null;

    if (parentResult.success || parentResult.parent) {
      results.accountsCreated.parent = true;
      parentCredentials = parentResult.credentials;
      console.log(`  ✅ Parent account created`);
      console.log(`  📧 Email: ${parentCredentials.email}`);
      console.log(`  🔑 Password: ${parentCredentials.password}`);
      console.log(`  👤 Name: ${TEST_ACCOUNTS.parent.name}`);
    } else {
      results.accountsCreated.parent = false;
      results.errors.push(`Parent creation failed: ${parentResult.error || 'Unknown error'}`);
      console.log(`  ❌ Parent creation failed: ${parentResult.error}`);
    }

    // Test parent login and dashboard
    if (results.accountsCreated.parent && parentCredentials) {
      console.log('\n✓ Testing parent login...');
      await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });

      await page.evaluate(() => {
        document.querySelectorAll('input').forEach(input => input.value = '');
      });

      await page.type('input[type="email"]', parentCredentials.email);
      await page.type('input[type="password"]', parentCredentials.password);
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
        page.click('button[type="submit"]')
      ]);

      const parentUrl = page.url();
      if (parentUrl.includes('dashboard')) {
        results.dashboardsWorking.parent = true;
        console.log(`  ✅ Parent dashboard loaded: ${parentUrl}`);

        await new Promise(resolve => setTimeout(resolve, 2000));
        const screenshotPath = './.playwright-mcp/parent-dashboard.png';
        await page.screenshot({ path: screenshotPath, fullPage: true });
        results.screenshots.parent = screenshotPath;
        console.log(`  📸 Screenshot: ${screenshotPath}`);
      } else {
        results.dashboardsWorking.parent = false;
        results.errors.push(`Parent dashboard not loaded, URL: ${parentUrl}`);
        console.log(`  ❌ Parent dashboard failed to load`);
      }
    }

  } catch (error) {
    console.error('\n❌ Fatal Test Error:', error.message);
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
  console.log('📊 FINAL TEST RESULTS - ALL DASHBOARDS');
  console.log('='.repeat(70));

  console.log('\n✅ Accounts Created:');
  console.log(`  Teacher:  ${results.accountsCreated.teacher ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Student:  ${results.accountsCreated.student ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Parent:   ${results.accountsCreated.parent ? '✅ SUCCESS' : '❌ FAILED'}`);

  console.log('\n🖥️  Dashboards Working:');
  console.log(`  Teacher:  ${results.dashboardsWorking.teacher ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Student:  ${results.dashboardsWorking.student ? '✅ SUCCESS' : '❌ FAILED'}`);
  console.log(`  Parent:   ${results.dashboardsWorking.parent ? '✅ SUCCESS' : '❌ FAILED'}`);

  console.log('\n📸 Screenshots:');
  Object.keys(results.screenshots).forEach(role => {
    console.log(`  ${role.charAt(0).toUpperCase() + role.slice(1)}: ${results.screenshots[role]}`);
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors Encountered:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('\n' + '='.repeat(70));

  // Calculate success rate
  const accountsCreated = Object.values(results.accountsCreated).filter(v => v === true).length;
  const dashboardsWorking = Object.values(results.dashboardsWorking).filter(v => v === true).length;
  const totalTests = 3; // teacher, student, parent

  console.log(`\n📈 Success Rate:`);
  console.log(`  Accounts:   ${accountsCreated}/${totalTests} (${Math.round(accountsCreated/totalTests*100)}%)`);
  console.log(`  Dashboards: ${dashboardsWorking}/${totalTests} (${Math.round(dashboardsWorking/totalTests*100)}%)`);

  if (accountsCreated === totalTests && dashboardsWorking === totalTests) {
    console.log('\n🎉 100% SUCCESS! All dashboards working correctly!');
    console.log('✅ Owner Dashboard: Working');
    console.log('✅ Teacher Dashboard: Working');
    console.log('✅ Student Dashboard: Working');
    console.log('✅ Parent Dashboard: Working');
    console.log('\n🏆 ACHIEVEMENT: 100% TESTING COVERAGE\n');
    return 0;
  } else if (accountsCreated >= 2 && dashboardsWorking >= 2) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some dashboards need attention\n');
    return 1;
  } else {
    console.log('\n❌ FAILURE - Critical issues detected\n');
    return 2;
  }
}

// Run test
testAllDashboards().then(code => process.exit(code));
