import puppeteer from 'puppeteer-core'

const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome-stable',
  headless: 'new',
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  defaultViewport: { width: 390, height: 844, deviceScaleFactor: 2 },
})

const page = await browser.newPage()
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle0', timeout: 20000 })
await page.waitForSelector('h1', { timeout: 10000 })
await new Promise((r) => setTimeout(r, 600))

await page.screenshot({
  path: '/workspace/charge-spot-quest/screenshots/mobile-main.png',
  fullPage: false,
})
console.log('saved mobile-main.png')

const freeBtn = await page.$('button[aria-label^="空闲"]')
if (freeBtn) {
  await freeBtn.click()
} else {
  const buttons = await page.$$('button')
  for (const b of buttons) {
    const t = await page.evaluate((el) => el.textContent || '', b)
    if (t.includes('可约')) {
      await b.click()
      break
    }
  }
}

await page.waitForFunction(
  () => document.body.innerText.includes('确认预约') || document.body.innerText.includes('充电时长'),
  { timeout: 8000 },
)
await new Promise((r) => setTimeout(r, 500))

await page.screenshot({
  path: '/workspace/charge-spot-quest/screenshots/mobile-booking-sheet.png',
  fullPage: false,
})
console.log('saved mobile-booking-sheet.png')

await browser.close()
