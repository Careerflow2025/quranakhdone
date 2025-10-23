// Dashboard Sections Navigation Test
// Tests sidebar navigation and content rendering
// Date: 2025-10-21

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

async function testDashboardSections() {
  console.log('\n🎯 Dashboard Sections Navigation Test\n');
  console.log('='.repeat(70));

  let browser;
  const results = {
    sectionsClicked: {},
    contentChanged: {},
    errors: []
  };

  try {
    browser = await puppeteer.launch({
      headless: true,  // Run headless to avoid conflicts
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Login
    console.log('\n✓ Logging in...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 30000 });
    await page.type('input[type="email"]', OWNER_EMAIL);
    await page.type('input[type="password"]', OWNER_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('button[type="submit"]')
    ]);
    console.log('  ✅ Logged in successfully');

    // Wait for dashboard to load
    await page.waitForTimeout(2000);

    // Test sidebar sections
    const sections = [
      { name: 'Overview', text: 'Overview' },
      { name: 'Students', text: 'Students' },
      { name: 'Teachers', text: 'Teachers' },
      { name: 'Parents', text: 'Parents' },
      { name: 'Classes', text: 'Classes' },
      { name: 'Calendar', text: 'Calendar' },
      { name: 'Reports', text: 'Reports' }
    ];

    console.log('\n✓ Testing sidebar navigation...\n');

    for (const section of sections) {
      try {
        // Get current heading
        const headingBefore = await page.$eval('h1, h2', el => el.textContent).catch(() => '');

        // Click sidebar item - try multiple selectors
        const clicked = await page.evaluate((sectionText) => {
          // Look for button or link containing the text
          const elements = Array.from(document.querySelectorAll('button, a, [role="button"]'));
          const element = elements.find(el => {
            const text = el.textContent.trim();
            return text === sectionText || text.includes(sectionText);
          });

          if (element) {
            element.click();
            return true;
          }
          return false;
        }, section.text);

        if (clicked) {
          // Wait for content to update
          await page.waitForTimeout(1500);

          // Check if heading changed
          const headingAfter = await page.$eval('h1, h2', el => el.textContent).catch(() => '');

          results.sectionsClicked[section.name] = true;

          if (headingAfter !== headingBefore || headingAfter.includes(section.name)) {
            results.contentChanged[section.name] = true;
            console.log(`  ✅ ${section.name.padEnd(15)} - Content loaded (heading: "${headingAfter.substring(0, 30)}")`);
          } else {
            results.contentChanged[section.name] = false;
            console.log(`  ⚠️  ${section.name.padEnd(15)} - Clicked but content unclear`);
          }
        } else {
          results.sectionsClicked[section.name] = false;
          console.log(`  ❌ ${section.name.padEnd(15)} - Navigation button not found`);
        }

        // Small delay between clicks
        await page.waitForTimeout(500);

      } catch (err) {
        results.sectionsClicked[section.name] = false;
        results.errors.push(`${section.name}: ${err.message}`);
        console.log(`  ❌ ${section.name.padEnd(15)} - Error: ${err.message}`);
      }
    }

    // Return to Overview and take final screenshot
    console.log('\n✓ Returning to Overview...');
    await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a'));
      const overview = elements.find(el => el.textContent.trim() === 'Overview');
      if (overview) overview.click();
    });
    await page.waitForTimeout(1000);

    console.log('✓ Taking screenshot...');
    await page.screenshot({
      path: './.playwright-mcp/dashboard-sections-test.png',
      fullPage: true
    });
    console.log('  ✅ Screenshot saved');

  } catch (error) {
    console.error('\n❌ Test Error:', error.message);
    results.errors.push(error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }

  // Print results
  console.log('\n' + '='.repeat(70));
  console.log('📊 DASHBOARD SECTIONS TEST RESULTS');
  console.log('='.repeat(70));

  const clickedCount = Object.values(results.sectionsClicked).filter(v => v === true).length;
  const changedCount = Object.values(results.contentChanged).filter(v => v === true).length;
  const totalSections = Object.keys(results.sectionsClicked).length;

  console.log(`\n✓ Sections Navigable:    ${clickedCount}/${totalSections}`);
  console.log(`✓ Content Changing:      ${changedCount}/${totalSections}`);

  if (results.errors.length > 0) {
    console.log('\n⚠️  Errors:');
    results.errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err}`);
    });
  }

  console.log('='.repeat(70));

  if (clickedCount >= 5 && changedCount >= 3) {
    console.log('\n🎉 SUCCESS! Dashboard navigation is working\n');
    return 0;
  } else if (clickedCount >= 3) {
    console.log('\n⚠️  PARTIAL SUCCESS - Some sections working\n');
    return 1;
  } else {
    console.log('\n❌ FAILURE - Navigation issues detected\n');
    return 2;
  }
}

testDashboardSections().then(code => process.exit(code));
