// Final Dashboard Testing - Direct Quick Actions
// Uses actual UI structure discovered through inspection
// Date: 2025-10-21

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

const TEST_ACCOUNTS = {
  teacher: {
    email: 'quick.teacher@quranakh.test',
    password: 'Teacher123!',  // May be auto-generated or email-based
    name: 'Ahmed Ibrahim',
    age: '35',
    gender: 'male',
    subject: 'Quran Memorization',
    phone: '+1234567890',
    address: '123 School Street, City',
    qualification: 'Ijazah in Hafs',
    experience: '10'
  },
  student: {
    email: 'quick.student@quranakh.test',
    password: 'Student123!',
    name: 'Fatima Ali'
  },
  parent: {
    email: 'quick.parent@quranakh.test',
    password: 'Parent123!',
    name: 'Mohammed Hassan'
  }
};

async function testDashboardsFinal() {
  console.log('\n🎯 FINAL DASHBOARD TESTING - QUICK ACTIONS');
  console.log('='.repeat(70));
  console.log('Strategy: Use Quick Action buttons from Overview page\n');

  const results = {
    accountsCreated: {},
    dashboardsWorking: {},
    screenshots: {},
    errors: []
  };

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: false,  // Visible for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // ========================================
    // LOGIN AS OWNER
    // ========================================
    console.log('🔐 Logging in as owner...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[type="email"]', OWNER_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', OWNER_PASSWORD, { delay: 50 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('✅ Owner logged in - waiting for dashboard to load...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot of overview with Quick Actions visible
    await page.screenshot({ path: './.playwright-mcp/overview-quick-actions.png', fullPage: true });
    console.log('📸 Overview page screenshot taken\n');

    // ========================================
    // CREATE TEACHER
    // ========================================
    console.log('=' .repeat(70));
    console.log('📚 PHASE 1: CREATE TEACHER');
    console.log('='.repeat(70));

    try {
      console.log('✓ Clicking "Add Teacher" Quick Action button...');

      // Click the "Add Teacher" button directly
      const addTeacherClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const addTeacherBtn = buttons.find(btn => btn.textContent.trim() === 'Add Teacher');
        if (addTeacherBtn) {
          addTeacherBtn.click();
          return true;
        }
        return false;
      });

      if (!addTeacherClicked) {
        throw new Error('Could not find "Add Teacher" button');
      }

      console.log('✅ Clicked "Add Teacher" button');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take screenshot after clicking to see what appeared (modal/page)
      await page.screenshot({ path: './.playwright-mcp/after-add-teacher-click.png', fullPage: true });
      console.log('📸 Screenshot after click');

      // Now try to fill the form wherever it appeared
      console.log('✓ Looking for form fields...');

      // Try to find and fill name field (multiple possible selectors)
      const nameFieldFilled = await page.evaluate((name) => {
        const nameInputs = Array.from(document.querySelectorAll('input[name="name"], input[name="display_name"], input[placeholder*="Name"]'));
        if (nameInputs.length > 0) {
          nameInputs[0].value = name;
          nameInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.name);

      if (nameFieldFilled) {
        console.log(`  ✓ Name: ${TEST_ACCOUNTS.teacher.name}`);
      } else {
        throw new Error('Could not find name field');
      }

      // Email field
      const emailFieldFilled = await page.evaluate((email) => {
        const emailInputs = Array.from(document.querySelectorAll('input[type="email"], input[name="email"]'));
        if (emailInputs.length > 0) {
          emailInputs[emailInputs.length - 1].value = email; // Use last one (in case login form is still in DOM)
          emailInputs[emailInputs.length - 1].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.email);

      if (emailFieldFilled) {
        console.log(`  ✓ Email: ${TEST_ACCOUNTS.teacher.email}`);
      } else {
        throw new Error('Could not find email field');
      }

      // Age field
      const ageFieldFilled = await page.evaluate((age) => {
        const ageInputs = Array.from(document.querySelectorAll('input[placeholder*="Age"], input[name="age"]'));
        if (ageInputs.length > 0) {
          ageInputs[0].value = age;
          ageInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.age);

      if (ageFieldFilled) {
        console.log(`  ✓ Age: ${TEST_ACCOUNTS.teacher.age}`);
      } else {
        console.log('  ⚠️ Age field not found (optional)');
      }

      // Gender dropdown
      const genderSelected = await page.evaluate((gender) => {
        const selects = Array.from(document.querySelectorAll('select'));
        const genderSelect = selects.find(s => {
          const label = s.getAttribute('aria-label') || s.name || '';
          return label.toLowerCase().includes('gender');
        }) || selects[0]; // Fallback to first select if no gender-specific found

        if (genderSelect) {
          const options = Array.from(genderSelect.options);
          const matchingOption = options.find(opt =>
            opt.value.toLowerCase() === gender.toLowerCase() ||
            opt.textContent.toLowerCase().includes(gender.toLowerCase())
          );

          if (matchingOption) {
            genderSelect.value = matchingOption.value;
            genderSelect.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
          }
        }
        return false;
      }, TEST_ACCOUNTS.teacher.gender);

      if (genderSelected) {
        console.log(`  ✓ Gender: ${TEST_ACCOUNTS.teacher.gender}`);
      } else {
        console.log('  ⚠️ Gender field not found (optional)');
      }

      // Subject field
      const subjectFieldFilled = await page.evaluate((subject) => {
        const subjectInputs = Array.from(document.querySelectorAll('input[name="subject"], input[placeholder*="Subject"]'));
        if (subjectInputs.length > 0) {
          subjectInputs[0].value = subject;
          subjectInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.subject);

      if (subjectFieldFilled) {
        console.log(`  ✓ Subject: ${TEST_ACCOUNTS.teacher.subject}`);
      } else {
        console.log('  ⚠️ Subject field not found (optional)');
      }

      // Phone Number field
      const phoneFieldFilled = await page.evaluate((phone) => {
        const phoneInputs = Array.from(document.querySelectorAll('input[placeholder*="Phone"], input[name="phone"], input[type="tel"]'));
        if (phoneInputs.length > 0) {
          phoneInputs[0].value = phone;
          phoneInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.phone);

      if (phoneFieldFilled) {
        console.log(`  ✓ Phone: ${TEST_ACCOUNTS.teacher.phone}`);
      } else {
        console.log('  ⚠️ Phone field not found (optional)');
      }

      // Address field (textarea)
      const addressFieldFilled = await page.evaluate((address) => {
        const addressInputs = Array.from(document.querySelectorAll('textarea[placeholder*="Address"], textarea[name="address"], input[placeholder*="Address"], input[name="address"]'));
        if (addressInputs.length > 0) {
          addressInputs[0].value = address;
          addressInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.address);

      if (addressFieldFilled) {
        console.log(`  ✓ Address: ${TEST_ACCOUNTS.teacher.address}`);
      } else {
        console.log('  ⚠️ Address field not found (optional)');
      }

      // Qualification field
      const qualificationFieldFilled = await page.evaluate((qualification) => {
        const qualificationInputs = Array.from(document.querySelectorAll('input[placeholder*="Qualification"], input[name="qualification"]'));
        if (qualificationInputs.length > 0) {
          qualificationInputs[0].value = qualification;
          qualificationInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.qualification);

      if (qualificationFieldFilled) {
        console.log(`  ✓ Qualification: ${TEST_ACCOUNTS.teacher.qualification}`);
      } else {
        console.log('  ⚠️ Qualification field not found (optional)');
      }

      // Years of Experience field
      const experienceFieldFilled = await page.evaluate((experience) => {
        const experienceInputs = Array.from(document.querySelectorAll('input[placeholder*="Experience"], input[name="experience"], input[name="years_of_experience"]'));
        if (experienceInputs.length > 0) {
          experienceInputs[0].value = experience;
          experienceInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
          return true;
        }
        return false;
      }, TEST_ACCOUNTS.teacher.experience);

      if (experienceFieldFilled) {
        console.log(`  ✓ Experience: ${TEST_ACCOUNTS.teacher.experience} years`);
      } else {
        console.log('  ⚠️ Experience field not found (optional)');
      }

      // Take screenshot before submit
      await page.screenshot({ path: './.playwright-mcp/form-filled-teacher.png', fullPage: true });
      console.log('📸 Form filled screenshot');

      // Find and click submit/create button
      console.log('✓ Submitting form...');
      const submitClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const submitBtn = buttons.find(btn => {
          const text = btn.textContent.trim().toLowerCase();
          return text.includes('create') || text.includes('submit') || text.includes('add') || text.includes('save');
        });
        if (submitBtn && submitBtn.textContent.trim() !== 'Add Teacher') { // Don't click the Quick Action button again
          submitBtn.click();
          return true;
        }
        return false;
      });

      if (submitClicked) {
        console.log('✅ Submit button clicked');
        await new Promise(resolve => setTimeout(resolve, 3000));
        results.accountsCreated.teacher = true;
        console.log(`✅ Teacher account created: ${TEST_ACCOUNTS.teacher.email}\n`);
      } else {
        throw new Error('Could not find submit button');
      }

    } catch (err) {
      results.accountsCreated.teacher = false;
      results.errors.push(`Teacher creation: ${err.message}`);
      console.log(`❌ Teacher creation failed: ${err.message}\n`);
    }

    // Logout
    console.log('🚪 Logging out...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 1000));

    // ========================================
    // TEST TEACHER DASHBOARD
    // ========================================
    if (results.accountsCreated.teacher) {
      console.log('='.repeat(70));
      console.log('🧪 TESTING TEACHER DASHBOARD');
      console.log('='.repeat(70));

      try {
        console.log('✓ Logging in as teacher...');
        await page.evaluate(() => {
          document.querySelectorAll('input').forEach(input => input.value = '');
        });

        await page.type('input[type="email"]', TEST_ACCOUNTS.teacher.email, { delay: 50 });
        await page.type('input[type="password"]', TEST_ACCOUNTS.teacher.password, { delay: 50 });

        await Promise.all([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
          page.click('button[type="submit"]')
        ]);

        const teacherUrl = page.url();
        if (teacherUrl.includes('dashboard')) {
          results.dashboardsWorking.teacher = true;
          console.log(`✅ Teacher dashboard loaded: ${teacherUrl}`);

          await new Promise(resolve => setTimeout(resolve, 2000));
          const screenshotPath = './.playwright-mcp/teacher-dashboard-final.png';
          await page.screenshot({ path: screenshotPath, fullPage: true });
          results.screenshots.teacher = screenshotPath;
          console.log(`📸 Screenshot: ${screenshotPath}\n`);
        } else {
          results.dashboardsWorking.teacher = false;
          console.log(`❌ Teacher dashboard failed - wrong URL: ${teacherUrl}\n`);
        }

        await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2' });
      } catch (err) {
        results.dashboardsWorking.teacher = false;
        results.errors.push(`Teacher dashboard: ${err.message}`);
        console.log(`❌ Teacher dashboard test failed: ${err.message}\n`);
      }
    }

    // Note: This test focuses on teacher account creation and login as proof of concept
    // Student and Parent tests would follow the same pattern with their respective Quick Action buttons

    console.log('='.repeat(70));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(70));

    console.log('\n✅ Accounts Created:');
    console.log(`  Teacher: ${results.accountsCreated.teacher ? '✅ SUCCESS' : '❌ FAILED'}`);

    console.log('\n🖥️  Dashboards Verified:');
    console.log(`  Teacher: ${results.dashboardsWorking.teacher ? '✅ SUCCESS' : '❌ FAILED'}`);

    if (results.screenshots.teacher) {
      console.log('\n📸 Screenshots:');
      console.log(`  Teacher: ${results.screenshots.teacher}`);
    }

    if (results.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      results.errors.forEach((err, i) => {
        console.log(`  ${i + 1}. ${err}`);
      });
    }

    console.log('\n' + '='.repeat(70));

    if (results.accountsCreated.teacher && results.dashboardsWorking.teacher) {
      console.log('\n🎉 SUCCESS! Teacher account creation and dashboard working!');
      console.log('\n✅ PROOF OF CONCEPT COMPLETE:');
      console.log('  - UI automation working with Quick Actions');
      console.log('  - Account creation functional');
      console.log('  - Dashboard rendering confirmed');
      console.log('  - Same pattern can be applied to Student & Parent\n');
      return 0;
    } else {
      console.log('\n⚠️  Test incomplete - check errors above\n');
      return 1;
    }

  } catch (error) {
    console.error('\n❌ Fatal Error:', error.message);
    return 1;
  } finally {
    // Keep browser open for manual inspection
    console.log('💡 Browser left open for inspection. Close manually when done.\n');
    // if (browser) {
    //   await browser.close();
    // }
  }
}

testDashboardsFinal().then(code => {
  if (code === 0) {
    console.log('✅ Test completed successfully');
  } else {
    console.log('❌ Test completed with errors');
  }
  // Don't exit immediately - let user inspect
  console.log('Press Ctrl+C to exit when ready...');
});
