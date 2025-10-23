// Dashboard UI Inspection Script
// Takes screenshot and captures all button/link text to understand UI structure
// Date: 2025-10-21

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

async function inspectDashboardUI() {
  console.log('\n🔍 DASHBOARD UI INSPECTION\n');
  console.log('='.repeat(70));

  let browser;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();

    // Login
    console.log('\n✓ Logging in as owner...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[type="email"]', OWNER_EMAIL, { delay: 50 });
    await page.type('input[type="password"]', OWNER_PASSWORD, { delay: 50 });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);

    console.log('✓ Owner logged in successfully');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Take screenshot
    console.log('\n✓ Taking full dashboard screenshot...');
    await page.screenshot({
      path: './.playwright-mcp/dashboard-ui-inspection.png',
      fullPage: true
    });
    console.log('  📸 Screenshot: ./.playwright-mcp/dashboard-ui-inspection.png');

    // Capture all button and link text
    console.log('\n✓ Extracting all buttons and links from UI...');
    const uiElements = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const links = Array.from(document.querySelectorAll('a'));
      const divButtons = Array.from(document.querySelectorAll('[role="button"]'));

      const extractInfo = (element) => {
        const text = element.textContent?.trim() || '';
        const classes = element.className || '';
        const id = element.id || '';
        const type = element.tagName;
        const ariaLabel = element.getAttribute('aria-label') || '';
        return { text, classes, id, type, ariaLabel };
      };

      return {
        buttons: buttons.map(extractInfo),
        links: links.map(extractInfo),
        divButtons: divButtons.map(extractInfo)
      };
    });

    console.log('\n📋 BUTTONS FOUND:');
    uiElements.buttons.slice(0, 30).forEach((btn, i) => {
      if (btn.text || btn.ariaLabel) {
        console.log(`  ${i + 1}. Text: "${btn.text.substring(0, 50)}" | AriaLabel: "${btn.ariaLabel}" | Classes: "${btn.classes.substring(0, 40)}"`);
      }
    });

    console.log('\n🔗 LINKS FOUND:');
    uiElements.links.slice(0, 30).forEach((link, i) => {
      if (link.text || link.ariaLabel) {
        console.log(`  ${i + 1}. Text: "${link.text.substring(0, 50)}" | AriaLabel: "${link.ariaLabel}"`);
      }
    });

    console.log('\n🎛️  DIV BUTTONS FOUND:');
    uiElements.divButtons.slice(0, 20).forEach((btn, i) => {
      if (btn.text || btn.ariaLabel) {
        console.log(`  ${i + 1}. Text: "${btn.text.substring(0, 50)}" | AriaLabel: "${btn.ariaLabel}"`);
      }
    });

    // Try navigating to Students section
    console.log('\n✓ Testing navigation to Students section...');
    const navResult = await page.evaluate(() => {
      const elements = Array.from(document.querySelectorAll('button, a, [role="button"]'));
      const studentsNav = elements.find(el => {
        const text = el.textContent.trim();
        return text === 'Students' || text.includes('Students');
      });

      if (studentsNav) {
        studentsNav.click();
        return { found: true, text: studentsNav.textContent.trim() };
      }
      return { found: false };
    });

    if (navResult.found) {
      console.log(`  ✅ Clicked navigation: "${navResult.text}"`);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Take another screenshot after navigation
      await page.screenshot({
        path: './.playwright-mcp/dashboard-students-section.png',
        fullPage: true
      });
      console.log('  📸 Screenshot: ./.playwright-mcp/dashboard-students-section.png');

      // Check for buttons again
      const buttonsAfterNav = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('button')).map(btn => ({
          text: btn.textContent?.trim() || '',
          classes: btn.className || ''
        }));
      });

      console.log('\n📋 BUTTONS IN STUDENTS SECTION:');
      buttonsAfterNav.slice(0, 20).forEach((btn, i) => {
        if (btn.text) {
          console.log(`  ${i + 1}. "${btn.text.substring(0, 50)}" | Classes: "${btn.classes.substring(0, 40)}"`);
        }
      });
    } else {
      console.log('  ❌ Could not find Students navigation element');
    }

    console.log('\n' + '='.repeat(70));
    console.log('✅ Inspection complete! Check screenshots and button lists above.');
    console.log('='.repeat(70) + '\n');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

inspectDashboardUI().then(() => process.exit(0));
