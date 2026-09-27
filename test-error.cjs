const { chromium } = require('playwright');
const { exec } = require('child_process');

(async () => {
  const server = exec('npm run preview');
  await new Promise(resolve => setTimeout(resolve, 3000));

  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://localhost:4173');
    await page.waitForTimeout(2000);
    console.log('Page loaded');
  } catch (e) {
    console.log('Error loading:', e);
  }

  await browser.close();
  server.kill();
})();
