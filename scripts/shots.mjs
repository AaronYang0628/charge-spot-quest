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
await new Promise((r) => setTimeout(r, 700))

await page.screenshot({
  path: '/workspace/charge-spot-quest/screenshots/mobile-main.png',
  fullPage: false,
})
console.log('saved mobile-main.png')

const cBtn = await page.$('button[aria-label="预约车位 C"]')
if (!cBtn) throw new Error('spot C button not found')
await cBtn.click()

await page.waitForFunction(
  () => document.body.innerText.includes('确认预约') && document.body.innerText.includes('早'),
  { timeout: 8000 },
)
await new Promise((r) => setTimeout(r, 500))

await page.screenshot({
  path: '/workspace/charge-spot-quest/screenshots/mobile-drawer.png',
  fullPage: false,
})
console.log('saved mobile-drawer.png')

await page.evaluate(() => {
  const input = document.querySelector('input')
  if (input) {
    const native = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')
    native?.set?.call(input, '沪A88888')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  }
})
await new Promise((r) => setTimeout(r, 150))

const confirm = await page.evaluateHandle(() =>
  [...document.querySelectorAll('button')].find((b) => b.textContent?.includes('确认预约')),
)
await confirm.asElement()?.click()

// drawer 250 + drift 600 + result 180 ≈ 1030ms
await page.waitForFunction(
  () => document.body.innerText.includes('预约结果'),
  { timeout: 12000 },
)
await new Promise((r) => setTimeout(r, 400))

await page.screenshot({
  path: '/workspace/charge-spot-quest/screenshots/mobile-confirm.png',
  fullPage: false,
})
console.log('saved mobile-confirm.png')

await browser.close()
