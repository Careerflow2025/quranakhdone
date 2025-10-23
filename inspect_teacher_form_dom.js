// DOM Inspector for Teacher Form
// Purpose: Examine what form actually opened and find all elements

const puppeteer = require('puppeteer');

const TEST_URL = 'http://localhost:3013';
const OWNER_EMAIL = 'wic@gmail.com';
const OWNER_PASSWORD = 'Test123456!';

async function inspectForm() {
  console.log('\n🔍 TEACHER FORM DOM INSPECTOR');
  console.log('='.repeat(70) + '\n');

  const browser = await puppeteer.launch({
    headless: false,
    args: ['--no-sandbox'],
    defaultViewport: { width: 1920, height: 1080 }
  });

  const page = await browser.newPage();

  try {
    // LOGIN
    console.log('🔐 Logging in...');
    await page.goto(`${TEST_URL}/login`, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.type('input[type="email"]', OWNER_EMAIL);
    await page.type('input[type="password"]', OWNER_PASSWORD);
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      page.click('button[type="submit"]')
    ]);
    console.log('✅ Logged in\n');

    await new Promise(resolve => setTimeout(resolve, 3000));

    // NAVIGATE TO TEACHERS
    console.log('🧭 Navigating to Teachers section...');
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a, button'));
      const teachersLink = links.find(el => el.textContent.toLowerCase().includes('teachers'));
      if (teachersLink) teachersLink.click();
    });

    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ On Teachers page\n');

    // CLICK ADD TEACHER
    console.log('🖱️  Clicking Add Teacher...');
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const addBtn = buttons.find(btn => {
        const text = btn.textContent.trim().toLowerCase();
        return text.includes('add') && text.includes('teacher');
      });
      if (addBtn) addBtn.click();
    });

    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✅ Form opened\n');

    // INSPECT MODAL
    const modalInfo = await page.evaluate(() => {
      // Modal title
      const title = document.querySelector('h3')?.textContent || 'No title found';

      // All input fields
      const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
        type: input.type,
        name: input.name || 'no-name',
        placeholder: input.placeholder || 'no-placeholder',
        value: input.value,
        disabled: input.disabled
      }));

      // All buttons in modal
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        disabled: btn.disabled,
        className: btn.className
      }));

      // Check for specific password-related elements
      const hasPasswordLabel = Array.from(document.querySelectorAll('label')).some(label =>
        label.textContent.toLowerCase().includes('password')
      );

      const hasGenerateButton = buttons.some(btn => btn.text.toLowerCase().includes('generate'));

      return {
        title,
        inputs,
        buttons,
        hasPasswordLabel,
        hasGenerateButton,
        totalInputs: inputs.length,
        totalButtons: buttons.length
      };
    });

    // DISPLAY RESULTS
    console.log('📋 FORM ANALYSIS');
    console.log('='.repeat(70));
    console.log(`Title: "${modalInfo.title}"`);
    console.log(`\nPassword Field Indicators:`);
    console.log(`   Password label present: ${modalInfo.hasPasswordLabel ? '✅ YES' : '❌ NO'}`);
    console.log(`   Generate button present: ${modalInfo.hasGenerateButton ? '✅ YES' : '❌ NO'}`);

    console.log(`\nForm Fields (${modalInfo.totalInputs} total):`);
    modalInfo.inputs.forEach((input, i) => {
      console.log(`   ${i+1}. Type: ${input.type.padEnd(12)} | Placeholder: "${input.placeholder}"`);
    });

    console.log(`\nButtons (${modalInfo.totalButtons} total):`);
    modalInfo.buttons.slice(0, 10).forEach((btn, i) => {
      console.log(`   ${i+1}. "${btn.text}" ${btn.disabled ? '(disabled)' : ''}`);
    });

    // COMPONENT IDENTIFICATION
    console.log('\n🎯 COMPONENT IDENTIFICATION:');
    if (modalInfo.title.includes('Create Teacher Account') && modalInfo.hasPasswordLabel && modalInfo.hasGenerateButton) {
      console.log('✅ This is TeacherManagementV2 (Production Form)');
    } else if (modalInfo.title.includes('Add New Teacher') && !modalInfo.hasPasswordLabel) {
      console.log('⚠️  This is SchoolModals AddTeacherModal (UI-Only Prototype)');
    } else {
      console.log('❓ Unknown form component');
    }

    console.log('\n💡 Browser left open for manual inspection');
    console.log('Press Ctrl+C when done\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

inspectForm();
