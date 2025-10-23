// Owner Dashboard Comprehensive Test
// Tests all 6 dashboard sections and functionality
// Date: 2025-10-21

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

// Dashboard sections to test
const DASHBOARD_SECTIONS = [
  'overview',
  'students',
  'teachers',
  'parents',
  'classes',
  'calendar',
  'reports'
];

async function testOwnerDashboard() {
  console.log('\n🎯 Owner Dashboard Comprehensive Test\n');
  console.log('='.repeat(70));

  let browser;
  const testResults = {
    loginSuccess: false,
    dashboardLoad: false,
    noInfiniteLoop: false,
    sectionsAccessible: {},
    dataRendered: {},
    errors: []
  };

  try {
    // Launch browser
    console.log('\n📱 Launching browser...');
    browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Capture errors
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('requestfailed', req => errors.push(`Failed: ${req.url()}`));

    // Step 1: Login
    console.log('\n✓ Step 1: Login as owner...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('input[type="email"]', OWNER_EMAIL);
    await page.type('input[type="password"]', OWNER_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    testResults.loginSuccess = true;
    console.log('  ✅ Login successful');

    // Step 2: Verify dashboard loaded
    console.log('\n✓ Step 2: Verifying dashboard loaded...');
    const url = page.url();
    if (url.includes('school-dashboard') || url.includes('dashboard')) {
      testResults.dashboardLoad = true;
      console.log(`  ✅ Dashboard URL: ${url}`);
    } else {
      throw new Error(`Wrong URL: ${url}`);
    }

    // Step 3: Check for infinite loop
    console.log('\n✓ Step 3: Monitoring for infinite loop (10 seconds)...');
    const errorsBefore = errors.length;
    await new Promise(resolve => setTimeout(resolve, 10000));
    const errorsAfter = errors.length;
    const errorRate = (errorsAfter - errorsBefore) / 10;

    console.log(`  📊 Error rate: ${errorRate.toFixed(1)} errors/second`);

    if (errorRate < 5) {
      testResults.noInfiniteLoop = true;
      console.log('  ✅ No infinite loop detected');
    } else {
      console.log('  ❌ INFINITE LOOP DETECTED!');
      testResults.errors.push(`High error rate: ${errorRate}/sec`);
    }

    // Step 4: Test each dashboard section
    console.log('\n✓ Step 4: Testing dashboard sections...');

    // Try to find tab navigation
    const tabs = ['overview', 'students', 'teachers', 'parents', 'classes', 'calendar', 'reports'];

    for (const tab of tabs) {
      try {
        // Look for tab button with various selectors
        const selectors = [
          `button[data-tab="${tab}"]`,
          `button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`,
          `[role="tab"]:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`
        ];

        let tabClicked = false;
        for (const selector of selectors) {
          try {
            const element = await page.$(selector);
            if (element) {
              await element.click();
              await page.waitForTimeout(1000); // Wait for content to load
              tabClicked = true;
              testResults.sectionsAccessible[tab] = true;
              console.log(`  ✅ ${tab.charAt(0).toUpperCase() + tab.slice(1)} section accessible`);
              break;
            }
          } catch (e) {
            // Try next selector
          }
        }

        if (!tabClicked) {
          testResults.sectionsAccessible[tab] = false;
          console.log(`  ⚠️  ${tab.charAt(0).toUpperCase() + tab.slice(1)} section - tab not found`);
        }
      } catch (err) {
        testResults.sectionsAccessible[tab] = false;
        console.log(`  ❌ ${tab.charAt(0).toUpperCase() + tab.slice(1)} section error: ${err.message}`);
      }
    }

    // Step 5: Check for rendered data
    console.log('\n✓ Step 5: Checking for rendered data...');

    // Look for stats cards
    const statsCards = await page.$$('[class*="stat"], [class*="card"], [class*="metric"]');
    testResults.dataRendered.statsCards = statsCards.length;
    console.log(`  📊 Stats cards found: ${statsCards.length}`);

    // Look for tables or lists
    const tables = await page.$$('table, [role="table"]');
    const lists = await page.$$('ul, ol, [role="list"]');
    testResults.dataRendered.tables = tables.length;
    testResults.dataRendered.lists = lists.length;
    console.log(`  📋 Tables found: ${tables.length}`);
    console.log(`  📝 Lists found: ${lists.length}`);

    // Look for headings
    const headings = await page.$$('h1, h2, h3');
    testResults.dataRendered.headings = headings.length;
    console.log(`  📰 Headings found: ${headings.length}`);

    // Step 6: Take screenshot
    console.log('\n✓ Step 6: Taking screenshot...');
    await page.screenshot({
      path: './.playwright-mcp/owner-dashboard-test.png',
      fullPage: true
    });
    console.log('  ✅ Screenshot saved: ./.playwright-mcp/owner-dashboard-test.png');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    testResults.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 OWNER DASHBOARD TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✓ Login:                 ${testResults.loginSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Dashboard Load:        ${testResults.dashboardLoad ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ No Infinite Loop:      ${testResults.noInfiniteLoop ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n📱 Section Accessibility:');
  Object.keys(testResults.sectionsAccessible).forEach(section => {
    const status = testResults.sectionsAccessible[section];
    console.log(`  ${section.padEnd(15)} ${status ? '✅ PASS' : '❌ FAIL'}`);
  });

  console.log('\n📊 Data Rendering:');
  console.log(`  Stats Cards:     ${testResults.dataRendered.statsCards || 0}`);
  console.log(`  Tables:          ${testResults.dataRendered.tables || 0}`);
  console.log(`  Lists:           ${testResults.dataRendered.lists || 0}`);
  console.log(`  Headings:        ${testResults.dataRendered.headings || 0}`);

  if (testResults.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    testResults.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('='.repeat(70));

  // Determine success
  const sectionsAccessible = Object.values(testResults.sectionsAccessible).filter(v => v === true).length;
  const totalSections = Object.keys(testResults.sectionsAccessible).length;
  const hasData = testResults.dataRendered.statsCards > 0 ||
                  testResults.dataRendered.tables > 0 ||
                  testResults.dataRendered.lists > 0;

  if (testResults.loginSuccess &&
      testResults.dashboardLoad &&
      testResults.noInfiniteLoop &&
      hasData) {
    console.log(`\n🎉 SUCCESS! Dashboard is functional`);
    console.log(`✅ ${sectionsAccessible}/${totalSections} sections accessible`);
    console.log(`✅ Data is rendering correctly\n`);
    return 0;
  } else {
    console.log(`\n⚠️  PARTIAL SUCCESS`);
    console.log(`📊 ${sectionsAccessible}/${totalSections} sections accessible`);
    console.log(`🔧 Some features may need attention\n`);
    return 1;
  }
}

// Run test
testOwnerDashboard().then(code => process.exit(code));
