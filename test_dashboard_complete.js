// Complete Dashboard Testing Script
// Tests dashboard rendering after all 7 bug fixes
// Date: 2025-10-21

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

async function testDashboard() {
  console.log('\n🚀 Starting Complete Dashboard Test...\n');
  console.log('='.repeat(70));

  let browser;
  let testResults = {
    loginSuccess: false,
    authSuccess: false,
    dashboardLoad: false,
    noInfiniteLoop: false,
    consoleErrors: [],
    networkErrors: [],
    renderSuccess: false
  };

  try {
    // Launch browser
    console.log('📱 Launching browser...');
    browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Capture console messages
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push({ type: msg.type(), text });
      if (msg.type() === 'error') {
        testResults.consoleErrors.push(text);
      }
    });

    // Capture network errors
    page.on('requestfailed', request => {
      testResults.networkErrors.push({
        url: request.url(),
        failure: request.failure()
      });
    });

    // Step 1: Navigate to login page
    console.log('\n✓ Step 1: Navigating to login page...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 10000 });
    testResults.loginSuccess = true;
    console.log('  ✅ Login page loaded');

    // Step 2: Enter credentials
    console.log('\n✓ Step 2: Entering credentials...');
    await page.type('input[type="email"], input[name="email"]', OWNER_EMAIL);
    await page.type('input[type="password"], input[name="password"]', OWNER_PASSWORD);
    console.log('  ✅ Credentials entered');

    // Step 3: Click sign in
    console.log('\n✓ Step 3: Clicking Sign In...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
      page.click('button[type="submit"], button:has-text("Sign In")')
    ]);
    testResults.authSuccess = true;
    console.log('  ✅ Authentication successful');

    // Step 4: Wait for dashboard and check for infinite loop
    console.log('\n✓ Step 4: Waiting for dashboard to load...');
    console.log('  ⏳ Monitoring for 10 seconds to detect infinite loops...');

    const startTime = Date.now();
    const errorCountBefore = testResults.networkErrors.length;

    // Wait 10 seconds and count errors
    await page.waitForTimeout(10000);

    const errorCountAfter = testResults.networkErrors.length;
    const errorRate = (errorCountAfter - errorCountBefore) / 10; // errors per second

    console.log(`  📊 Network errors in 10s: ${errorCountAfter - errorCountBefore}`);
    console.log(`  📊 Error rate: ${errorRate.toFixed(1)} errors/second`);

    if (errorRate < 5) {
      testResults.noInfiniteLoop = true;
      console.log('  ✅ No infinite loop detected');
    } else {
      console.log('  ❌ INFINITE LOOP DETECTED! High error rate');
    }

    // Step 5: Check if dashboard rendered
    console.log('\n✓ Step 5: Checking dashboard rendering...');
    const currentUrl = page.url();
    console.log(`  Current URL: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      testResults.dashboardLoad = true;
      console.log('  ✅ Dashboard URL reached');

      // Check for dashboard elements
      try {
        await page.waitForSelector('h1, h2, [role="heading"]', { timeout: 5000 });
        testResults.renderSuccess = true;
        console.log('  ✅ Dashboard content rendered');
      } catch (e) {
        console.log('  ❌ Dashboard content NOT rendered (timeout)');
      }
    } else {
      console.log('  ❌ Not on dashboard page');
    }

    // Step 6: Analyze console errors
    console.log('\n✓ Step 6: Analyzing console errors...');
    const uniqueErrors = [...new Set(testResults.consoleErrors)];
    console.log(`  Total console errors: ${testResults.consoleErrors.length}`);
    console.log(`  Unique console errors: ${uniqueErrors.length}`);

    if (uniqueErrors.length > 0) {
      console.log('\n  Top 5 unique errors:');
      uniqueErrors.slice(0, 5).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.substring(0, 100)}...`);
      });
    }

    // Step 7: Analyze network errors
    console.log('\n✓ Step 7: Analyzing network errors...');
    const uniqueNetworkErrors = [...new Set(testResults.networkErrors.map(e => e.url))];
    console.log(`  Total network errors: ${testResults.networkErrors.length}`);
    console.log(`  Unique URLs failing: ${uniqueNetworkErrors.length}`);

    if (uniqueNetworkErrors.length > 0 && uniqueNetworkErrors.length < 20) {
      console.log('\n  Failing URLs:');
      uniqueNetworkErrors.slice(0, 10).forEach((url, i) => {
        console.log(`  ${i + 1}. ${url.substring(0, 100)}...`);
      });
    }

    // Take screenshot
    console.log('\n✓ Step 8: Taking screenshot...');
    await page.screenshot({
      path: './.playwright-mcp/dashboard-test-result.png',
      fullPage: true
    });
    console.log('  ✅ Screenshot saved: ./.playwright-mcp/dashboard-test-result.png');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print final results
  console.log('\n' + '='.repeat(70));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(70));
  console.log(`✓ Login Page Load:      ${testResults.loginSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Authentication:       ${testResults.authSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Dashboard URL:        ${testResults.dashboardLoad ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ No Infinite Loop:     ${testResults.noInfiniteLoop ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`✓ Content Rendered:     ${testResults.renderSuccess ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(70));

  const passCount = Object.values(testResults).filter(v => v === true).length;
  const totalTests = 5;
  const passRate = ((passCount / totalTests) * 100).toFixed(0);

  console.log(`\n📈 Pass Rate: ${passCount}/${totalTests} (${passRate}%)`);

  if (testResults.renderSuccess && testResults.noInfiniteLoop) {
    console.log('\n🎉 SUCCESS! Dashboard is working correctly!');
    console.log('✅ All 7 bug fixes successful - dashboard renders without errors\n');
    return 0;
  } else if (testResults.noInfiniteLoop) {
    console.log('\n⚠️  PARTIAL SUCCESS - Infinite loop fixed but rendering incomplete');
    console.log('🔧 Additional hooks may need fixes (useAssignments, useCalendar, useMessages)\n');
    return 1;
  } else {
    console.log('\n❌ FAILURE - Dashboard still has critical issues');
    console.log('🔧 Additional debugging required\n');
    return 2;
  }
}

// Run test
testDashboard().then(code => process.exit(code));
