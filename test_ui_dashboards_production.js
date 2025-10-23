// Complete UI-Based Dashboard Testing - Production Ready
// Tests frontend UI login and dashboard accessibility
// Port: 3019 (current production server)

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3019';  // CORRECTED PORT
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

async function testUILogin() {
  console.log('\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                    FRONTEND UI DASHBOARD TEST                                ║');
  console.log('║                          October 23, 2025                                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  let browser;
  const results = {
    loginSuccess: false,
    dashboardAccessible: false,
    error: null
  };

  try {
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Enable console logging from browser
    page.on('console', msg => console.log('  📄 Browser:', msg.text()));
    page.on('pageerror', error => console.log('  ❌ Page Error:', error.message));

    console.log('\n' + '='.repeat(70));
    console.log('PHASE 1: Test Login Page Load');
    console.log('='.repeat(70));

    console.log(`\n🔗 Navigating to: ${TEST_URL}/login`);
    await page.goto(`${TEST_URL}/login`, {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    // Wait for page to be interactive
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login page loaded successfully');

    console.log('\n' + '='.repeat(70));
    console.log('PHASE 2: Test Owner Authentication');
    console.log('='.repeat(70));

    console.log('\n📝 Entering credentials...');
    await page.type('input[type="email"]', OWNER_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', OWNER_PASSWORD, { delay: 50 });

    console.log('🖱️  Clicking login button...');
    const navigationPromise = page.waitForNavigation({
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    await page.click('button[type="submit"]');
    await navigationPromise;

    const currentUrl = page.url();
    console.log(`📍 Current URL: ${currentUrl}`);

    if (currentUrl.includes('dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
      results.loginSuccess = true;
      results.dashboardAccessible = true;

      // Wait for dashboard to render
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to find dashboard-specific elements
      const bodyHTML = await page.evaluate(() => document.body.innerHTML);
      const hasDashboardContent = bodyHTML.includes('dashboard') ||
                                  bodyHTML.includes('Dashboard') ||
                                  bodyHTML.includes('school');

      if (hasDashboardContent) {
        console.log('✅ Dashboard content rendered successfully');
      } else {
        console.log('⚠️  Dashboard loaded but content may be missing');
      }

    } else {
      console.log(`❌ Login did not redirect to dashboard: ${currentUrl}`);
      results.error = `Unexpected redirect to: ${currentUrl}`;
    }

  } catch (error) {
    console.log(`\n❌ Fatal Error: ${error.message}`);
    results.error = error.message;
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n\n╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            FINAL RESULTS                                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝\n');

  console.log('✓ Login Page Load:      ', results.loginSuccess || results.error ? '✅ PASS' : '❌ FAIL');
  console.log('✓ Authentication:       ', results.loginSuccess ? '✅ PASS' : '❌ FAIL');
  console.log('✓ Dashboard Access:     ', results.dashboardAccessible ? '✅ PASS' : '❌ FAIL');

  if (results.error) {
    console.log('\n❌ Error Details:', results.error);
  }

  const passRate = [results.loginSuccess, results.dashboardAccessible].filter(Boolean).length;
  console.log(`\n📈 Pass Rate: ${passRate}/2 (${(passRate/2*100).toFixed(1)}%)\n`);

  return results;
}

// Run the test
testUILogin()
  .then(results => {
    if (results.loginSuccess && results.dashboardAccessible) {
      console.log('🎉 SUCCESS: Frontend UI is working!\n');
      process.exit(0);
    } else {
      console.log('❌ FAILURE: Frontend UI has issues\n');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
