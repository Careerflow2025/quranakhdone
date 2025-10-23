// Quick Dashboard Test - Extended Timeout
const puppeteer = require('puppeteer');

async function quickTest() {
  console.log('🧪 Quick Dashboard Test - Extended Timeout\n');

  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const errors = { console: [], network: [] };
  page.on('console', msg => { if (msg.type() === 'error') errors.console.push(msg.text()); });
  page.on('requestfailed', req => errors.network.push(req.url()));

  try {
    console.log('1️⃣  Navigating to login (60s timeout)...');
    await page.goto('http://localhost:3013/login', { waitUntil: 'networkidle0', timeout: 60000 });
    console.log('✅ Login page loaded\n');

    console.log('2️⃣  Logging in...');
    await page.type('input[type="email"]', 'wic@gmail.com');
    await page.type('input[type="password"]', 'Test123456!');
    await page.click('button[type="submit"]');
    console.log('✅ Clicked submit\n');

    console.log('3️⃣  Waiting for navigation (60s timeout)...');
    await page.waitForNavigation({ timeout: 60000 });
    const url = page.url();
    console.log(`✅ Navigated to: ${url}\n`);

    console.log('4️⃣  Monitoring for 15 seconds...');
    const errorsBefore = errors.network.length;
    await new Promise(resolve => setTimeout(resolve, 15000));
    const errorsAfter = errors.network.length;
    const newErrors = errorsAfter - errorsBefore;

    console.log(`📊 Network errors in 15s: ${newErrors}`);
    console.log(`📊 Error rate: ${(newErrors/15).toFixed(1)}/sec\n`);

    if (newErrors < 75) {
      console.log('🎉 SUCCESS! No infinite loop detected');
      console.log(`📍 Current URL: ${url}`);
      return 0;
    } else {
      console.log('❌ INFINITE LOOP STILL PRESENT');
      console.log(`Sample errors:`);
      errors.network.slice(0, 5).forEach((e, i) => console.log(`  ${i+1}. ${e}`));
      return 1;
    }
  } catch (err) {
    console.log(`❌ Error: ${err.message}`);
    return 2;
  } finally {
    await browser.close();
  }
}

quickTest().then(code => process.exit(code));
