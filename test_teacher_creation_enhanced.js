// Enhanced Teacher Creation Test with Error Detection
// Date: 2025-10-21
// Purpose: Monitor form submission, detect errors, verify success

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const TEACHER_DATA = {
  email: 'enhanced.teacher@quranakh.test',
  name: 'Ahmed Ibrahim',
  age: '35',
  gender: 'male',
  subject: 'Quran Memorization',
  phone: '+1234567890',
  address: '123 School Street, City',
  qualification: 'Ijazah in Hafs',
  experience: '10'
};

async function testTeacherCreation() {
  console.log('\n🎯 ENHANCED TEACHER CREATION TEST');
  console.log('='.repeat(70));
  console.log('Purpose: Monitor submission, detect errors, verify database\n');

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Enable console log monitoring
    const consoleLogs = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes('error') || text.includes('Error') || text.includes('failed')) {
        console.log('🔴 Console Error:', text);
      }
    });

    // Monitor network requests
    const networkLogs = [];
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/') || url.includes('teacher')) {
        const status = response.status();
        networkLogs.push({ url, status });

        if (status >= 400) {
          console.log(`🔴 API Error: ${url} - Status ${status}`);
          try {
            const body = await response.text();
            console.log('   Response:', body.substring(0, 200));
          } catch (e) {}
        } else if (url.includes('teacher')) {
          console.log(`✅ API Success: ${url} - Status ${status}`);
        }
      }
    });

    // LOGIN
    console.log('🔐 Logging in as owner...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[type="email"]', OWNER_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', OWNER_PASSWORD, { delay: 50 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('✅ Logged in\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // CLICK ADD TEACHER
    console.log('🖱️  Clicking "Add Teacher" button...');
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => b.textContent.trim() === 'Add Teacher');
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });

    if (!clicked) {
      throw new Error('Could not find Add Teacher button');
    }

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Modal opened\n');

    // FILL ALL FIELDS
    console.log('📝 Filling form fields...');

    const fields = [
      { selector: 'input[name="name"], input[name="display_name"], input[placeholder*="Name"]', value: TEACHER_DATA.name, name: 'Name' },
      { selector: 'input[type="email"], input[name="email"]', value: TEACHER_DATA.email, name: 'Email', isLast: true },
      { selector: 'input[placeholder*="Age"], input[name="age"]', value: TEACHER_DATA.age, name: 'Age' },
      { selector: 'input[name="subject"], input[placeholder*="Subject"]', value: TEACHER_DATA.subject, name: 'Subject' },
      { selector: 'input[placeholder*="Phone"], input[name="phone"], input[type="tel"]', value: TEACHER_DATA.phone, name: 'Phone' },
      { selector: 'textarea[placeholder*="Address"], textarea[name="address"], input[placeholder*="Address"]', value: TEACHER_DATA.address, name: 'Address' },
      { selector: 'input[placeholder*="Qualification"], input[name="qualification"]', value: TEACHER_DATA.qualification, name: 'Qualification' },
      { selector: 'input[placeholder*="Experience"], input[name="experience"]', value: TEACHER_DATA.experience, name: 'Experience' }
    ];

    for (const field of fields) {
      const filled = await page.evaluate((sel, val, isLast) => {
        const inputs = Array.from(document.querySelectorAll(sel));
        if (inputs.length > 0) {
          const input = isLast ? inputs[inputs.length - 1] : inputs[0];
          input.value = val;
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
        return false;
      }, field.selector, field.value, field.isLast);

      if (filled) {
        console.log(`  ✓ ${field.name}: ${field.value}`);
      } else {
        console.log(`  ⚠️ ${field.name}: field not found (optional)`);
      }
    }

    // Gender dropdown
    const genderSet = await page.evaluate((gender) => {
      const selects = Array.from(document.querySelectorAll('select'));
      if (selects.length > 0) {
        const select = selects[0];
        const options = Array.from(select.options);
        const match = options.find(opt =>
          opt.value.toLowerCase() === gender ||
          opt.textContent.toLowerCase().includes(gender)
        );
        if (match) {
          select.value = match.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          return true;
        }
      }
      return false;
    }, TEACHER_DATA.gender);

    if (genderSet) {
      console.log(`  ✓ Gender: ${TEACHER_DATA.gender}`);
    }

    console.log('\n📸 Taking pre-submission screenshot...');
    await page.screenshot({ path: './.playwright-mcp/teacher-form-pre-submit.png', fullPage: true });

    // SUBMIT AND MONITOR
    console.log('\n🚀 Submitting form...');
    console.log('Monitoring: Network requests, console logs, DOM changes\n');

    const submitResult = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const submitBtn = buttons.find(btn => {
        const text = btn.textContent.trim().toLowerCase();
        return (text.includes('add teacher') || text.includes('submit') || text.includes('create'))
               && !btn.textContent.includes('Quick Action');
      });

      if (submitBtn) {
        submitBtn.click();
        return { clicked: true, buttonText: submitBtn.textContent.trim() };
      }
      return { clicked: false };
    });

    if (!submitResult.clicked) {
      throw new Error('Could not find submit button');
    }

    console.log(`✅ Clicked: "${submitResult.buttonText}"`);

    // Wait and observe
    console.log('\n⏳ Waiting for response (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Check modal state
    console.log('\n🔍 Checking result...');
    const modalState = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"], .modal, [class*="modal"]');
      const errorMessages = Array.from(document.querySelectorAll('[role="alert"], .error, [class*="error"]'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0);
      const successMessages = Array.from(document.querySelectorAll('.success, [class*="success"]'))
        .map(el => el.textContent.trim())
        .filter(text => text.length > 0);

      return {
        modalVisible: modal ? true : false,
        errorMessages,
        successMessages
      };
    });

    console.log('\n📊 SUBMISSION RESULT:');
    console.log(`   Modal still visible: ${modalState.modalVisible ? '❌ YES (may indicate error)' : '✅ NO (success)'}`);

    if (modalState.errorMessages.length > 0) {
      console.log('   🔴 Error Messages:');
      modalState.errorMessages.forEach(msg => console.log(`      - ${msg}`));
    }

    if (modalState.successMessages.length > 0) {
      console.log('   ✅ Success Messages:');
      modalState.successMessages.forEach(msg => console.log(`      - ${msg}`));
    }

    if (networkLogs.length === 0) {
      console.log('   ⚠️ No API requests detected - form may not have submitted');
    }

    // Screenshot after submission
    await page.screenshot({ path: './.playwright-mcp/teacher-form-post-submit.png', fullPage: true });
    console.log('\n📸 Post-submission screenshot saved');

    // Summary
    console.log('\n' + '='.repeat(70));
    console.log('📋 DIAGNOSTIC SUMMARY');
    console.log('='.repeat(70));
    console.log(`API Requests: ${networkLogs.length}`);
    console.log(`Console Logs: ${consoleLogs.length}`);
    console.log(`Errors Detected: ${modalState.errorMessages.length}`);
    console.log(`Success Indicators: ${modalState.successMessages.length}`);
    console.log(`Modal Closed: ${!modalState.modalVisible}`);

    console.log('\n💡 Browser left open for manual inspection');
    console.log('Press Ctrl+C when done\n');

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
  }
}

testTeacherCreation();
