/**
 * Student Login Debug Test
 * Captures browser console logs to diagnose redirect failure
 */

const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const TEST_URL = 'http://localhost:3017';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rlfvubgyogkkqbjjmjwd.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJsZnZ1Ymd5b2dra3FiamptandkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1Njk5NjksImV4cCI6MjA3NjE0NTk2OX0.c1GSJjuYtJL5aARQAaW_LGfDjzH80YXLnVROJ-nvj4Q';

async function debugStudentLogin() {
  console.log('\n🔍 STUDENT LOGIN DEBUG TEST\n');
  console.log('='.repeat(70));

  let browser;
  const consoleLogs = [];
  const consoleErrors = [];

  try {
    // 1. Authenticate as owner and create student
    console.log('\n📋 STEP 1: Create test student account');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    const { data: ownerAuth, error: ownerError } = await supabase.auth.signInWithPassword({
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD
    });

    if (ownerError) {
      throw new Error(`Owner login failed: ${ownerError.message}`);
    }

    console.log(`✅ Owner authenticated`);
    const ownerToken = ownerAuth.session.access_token;

    // Create student via API
    const studentEmail = `debug.student.${Date.now()}@quranakh.test`;
    const studentResponse = await fetch(`${TEST_URL}/api/school/create-student`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ownerToken}`
      },
      body: JSON.stringify({
        name: 'Debug Student',
        email: studentEmail,
        dob: '2010-01-01',
        gender: 'male'
      })
    });

    const studentData = await studentResponse.json();

    if (!studentData.success) {
      throw new Error(`Student creation failed: ${studentData.error}`);
    }

    const studentCredentials = {
      email: studentData.data.email,
      password: studentData.data.password
    };

    console.log(`✅ Student created`);
    console.log(`   Email: ${studentCredentials.email}`);
    console.log(`   Password: ${studentCredentials.password}`);

    // 2. Launch browser with console logging
    console.log('\n📋 STEP 2: Test login with browser console capture');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Capture console messages
    page.on('console', msg => {
      const text = msg.text();
      console.log(`   [BROWSER LOG] ${text}`);
      consoleLogs.push(text);
    });

    page.on('pageerror', error => {
      console.error(`   [BROWSER ERROR] ${error.message}`);
      consoleErrors.push(error.message);
    });

    // Navigate to login
    console.log('\n   ▶ Navigating to login page...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log(`   ✓ Current URL: ${page.url()}`);

    // Fill in credentials
    console.log('\n   ▶ Entering credentials...');
    await page.type('input[type="email"]', studentCredentials.email);
    await page.type('input[type="password"]', studentCredentials.password);

    // Click login and wait
    console.log('\n   ▶ Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for navigation or 5 seconds
    await Promise.race([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {}),
      new Promise(resolve => setTimeout(resolve, 5000))
    ]);

    const finalUrl = page.url();
    console.log(`\n   📍 Final URL: ${finalUrl}`);

    // Check for errors or success
    if (finalUrl.includes('dashboard')) {
      console.log('\n✅ SUCCESS: Redirect to dashboard worked!');
    } else {
      console.log('\n❌ FAILURE: Redirect did not happen');
    }

    // 4. Analyze results
    console.log('\n' + '='.repeat(70));
    console.log('📊 ANALYSIS');
    console.log('='.repeat(70));

    console.log(`\nBrowser Console Logs (${consoleLogs.length}):`);
    if (consoleLogs.length === 0) {
      console.log('  (none)');
    } else {
      consoleLogs.forEach((log, i) => {
        console.log(`  ${i + 1}. ${log}`);
      });
    }

    console.log(`\nBrowser Errors (${consoleErrors.length}):`);
    if (consoleErrors.length === 0) {
      console.log('  (none)');
    } else {
      consoleErrors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

debugStudentLogin().then(() => process.exit(0));
