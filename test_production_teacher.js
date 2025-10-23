// Production Teacher Account Creation Test
// Date: 2025-10-21
// Purpose: Use TeacherManagementV2 component (production form with password)
// Location: Teachers section, NOT Quick Actions

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const TEACHER_DATA = {
  email: 'production.teacher@quranakh.test',
  password: 'Teacher123456!',
  name: 'Hassan Abdullah',
  phone: '+1234567890',
  qualifications: 'Ijazah in Hafs, 10 years experience',
  experience: '10 years',
  subject: 'Quran Memorization'
};

async function testProductionTeacherCreation() {
  console.log('\n🎯 PRODUCTION TEACHER CREATION TEST');
  console.log('='.repeat(70));
  console.log('Using: TeacherManagementV2 component (Teachers section)');
  console.log('Expected: Real database records + auth account creation\n');

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Monitor API calls
    const apiCalls = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        apiCalls.push({ url, status, method: response.request().method() });
        console.log(`📡 API: ${response.request().method()} ${url} - ${status}`);
      }
    });

    // LOGIN AS OWNER
    console.log('🔐 Step 1: Login as school owner...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[type="email"]', OWNER_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', OWNER_PASSWORD, { delay: 50 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('✅ Logged in successfully\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // NAVIGATE TO TEACHERS SECTION
    console.log('🧭 Step 2: Navigate to Teachers section...');

    // Take screenshot of dashboard
    await page.screenshot({ path: './.playwright-mcp/dashboard-overview.png', fullPage: true });
    console.log('📸 Screenshot: dashboard-overview.png');

    // Look for Teachers navigation link
    const navigated = await page.evaluate(() => {
      // Try multiple selector strategies
      const links = Array.from(document.querySelectorAll('a, button, [role="button"]'));
      const teachersLink = links.find(el => {
        const text = el.textContent.trim().toLowerCase();
        return text === 'teachers' ||
               text === 'teacher management' ||
               text.includes('teachers') ||
               el.getAttribute('href')?.includes('/teachers');
      });

      if (teachersLink) {
        teachersLink.click();
        return { found: true, text: teachersLink.textContent.trim() };
      }

      // Alternative: check for navigation menu
      const navItems = Array.from(document.querySelectorAll('nav a, [role="navigation"] a'));
      const navTeachers = navItems.find(a => a.textContent.toLowerCase().includes('teacher'));
      if (navTeachers) {
        navTeachers.click();
        return { found: true, text: navTeachers.textContent.trim() };
      }

      return { found: false };
    });

    if (navigated.found) {
      console.log(`✅ Clicked: "${navigated.text}"`);
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('⚠️ Teachers link not found in navigation');
      console.log('📋 Available navigation items:');
      const navItems = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a, button[class*="nav"], [role="navigation"] a'))
          .map(el => el.textContent.trim())
          .filter(text => text.length > 0)
          .slice(0, 20);
      });
      navItems.forEach(item => console.log(`   - ${item}`));

      // Try direct URL navigation as fallback
      console.log('\n🔄 Attempting direct URL navigation...');
      await page.goto(`${TEST_URL}/school/teachers`, { waitUntil: 'networkidle2', timeout: 30000 }).catch(() => {});
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await page.screenshot({ path: './.playwright-mcp/teachers-page.png', fullPage: true });
    console.log('📸 Screenshot: teachers-page.png\n');

    // FIND ADD TEACHER BUTTON
    console.log('🔍 Step 3: Find "Add Teacher" button in Teachers section...');

    const addButtonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addButton = buttons.find(btn => {
        const text = btn.textContent.trim().toLowerCase();
        return (text.includes('add') && text.includes('teacher')) ||
               text === 'add teacher' ||
               text === 'create teacher' ||
               text === 'new teacher';
      });

      if (addButton) {
        addButton.click();
        return { clicked: true, text: addButton.textContent.trim() };
      }
      return { clicked: false };
    });

    if (!addButtonClicked.clicked) {
      console.log('❌ Could not find Add Teacher button in Teachers section');
      console.log('📋 Available buttons:');
      const buttons = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button'))
          .map(btn => btn.textContent.trim())
          .filter(text => text.length > 0);
      });
      buttons.forEach(btn => console.log(`   - ${btn}`));
      throw new Error('Add Teacher button not found');
    }

    console.log(`✅ Clicked: "${addButtonClicked.text}"`);
    await new Promise(resolve => setTimeout(resolve, 2000));

    await page.screenshot({ path: './.playwright-mcp/teacher-form-modal.png', fullPage: true });
    console.log('📸 Screenshot: teacher-form-modal.png\n');

    // FILL FORM WITH PASSWORD FIELD
    console.log('📝 Step 4: Fill production form (including password)...');

    const formFields = [
      { selector: 'input[name="name"], input[placeholder*="Name"], input[placeholder*="name"]', value: TEACHER_DATA.name, name: 'Name' },
      { selector: 'input[type="email"], input[name="email"]', value: TEACHER_DATA.email, name: 'Email' },
      { selector: 'input[type="password"], input[name="password"]', value: TEACHER_DATA.password, name: 'Password' },
      { selector: 'input[name="phone"], input[placeholder*="Phone"], input[type="tel"]', value: TEACHER_DATA.phone, name: 'Phone' },
      { selector: 'input[name="qualifications"], input[placeholder*="Qualification"], textarea[placeholder*="Qualification"]', value: TEACHER_DATA.qualifications, name: 'Qualifications' },
      { selector: 'input[name="experience"], input[placeholder*="Experience"]', value: TEACHER_DATA.experience, name: 'Experience' }
    ];

    for (const field of formFields) {
      const filled = await page.evaluate((sel, val) => {
        const input = document.querySelector(sel);
        if (input) {
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, field.selector, field.value);

      if (filled) {
        console.log(`  ✓ ${field.name}: ${field.value}`);
      } else {
        console.log(`  ⚠️ ${field.name}: field not found`);
      }
    }

    await page.screenshot({ path: './.playwright-mcp/teacher-form-filled.png', fullPage: true });
    console.log('\n📸 Screenshot: teacher-form-filled.png');

    // SUBMIT FORM
    console.log('\n🚀 Step 5: Submit form...');

    const submitClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(btn => {
        const text = btn.textContent.trim().toLowerCase();
        return (text.includes('create') && text.includes('teacher')) ||
               text === 'submit' ||
               text === 'save' ||
               text === 'add';
      });

      if (submitBtn) {
        submitBtn.click();
        return { clicked: true, text: submitBtn.textContent.trim() };
      }
      return { clicked: false };
    });

    if (!submitClicked.clicked) {
      throw new Error('Submit button not found');
    }

    console.log(`✅ Clicked: "${submitClicked.text}"`);
    console.log('⏳ Waiting for API response...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check for success message or credentials display
    const result = await page.evaluate(() => {
      const successEl = document.querySelector('[class*="success"], [role="alert"]');
      const credentialsEl = document.querySelector('[class*="credential"], [class*="password"]');
      const modalVisible = document.querySelector('[role="dialog"], .modal');

      return {
        successMessage: successEl ? successEl.textContent : null,
        hasCredentials: !!credentialsEl,
        credentialsText: credentialsEl ? credentialsEl.textContent : null,
        modalStillOpen: !!modalVisible
      };
    });

    console.log('📊 Result Analysis:');
    console.log(`   Modal closed: ${!result.modalStillOpen ? '✅' : '❌'}`);
    console.log(`   Success message: ${result.successMessage || 'None'}`);
    console.log(`   Credentials shown: ${result.hasCredentials ? '✅' : '❌'}`);
    if (result.credentialsText) {
      console.log(`   Credentials: ${result.credentialsText}`);
    }

    await page.screenshot({ path: './.playwright-mcp/after-teacher-submit.png', fullPage: true });
    console.log('\n📸 Screenshot: after-teacher-submit.png');

    // API CALL SUMMARY
    console.log('\n📡 API Calls Made:');
    const createTeacherCalls = apiCalls.filter(call =>
      call.url.includes('create-teacher') ||
      (call.method === 'POST' && call.url.includes('teacher'))
    );

    if (createTeacherCalls.length > 0) {
      console.log('✅ Found create-teacher API calls:');
      createTeacherCalls.forEach(call => {
        console.log(`   ${call.method} ${call.url} - Status: ${call.status}`);
      });
    } else {
      console.log('⚠️ No create-teacher API calls detected');
    }

    console.log('\n💡 Browser left open for manual inspection');
    console.log('Next: Run database verification script');
    console.log('Press Ctrl+C when done\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    throw error;
  }
}

testProductionTeacherCreation();
