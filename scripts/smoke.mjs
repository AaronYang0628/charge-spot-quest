import { launch } from './browser.mjs'
import { mkdir } from 'node:fs/promises'
const browser = await launch()
try {
  const page = await browser.newPage()
  page.on('pageerror', e => console.log('ERROR', e.message))
  page.on('console', m => { if (['error','warn'].includes(m.type())) console.log(m.type(), m.text()) })
  await page.goto('http://127.0.0.1:5173')
  await new Promise(r => setTimeout(r, 3500))
  await mkdir('screenshots', { recursive: true })
  await page.screenshot({ path: 'screenshots/initial.png' })
  await page.click('button[aria-label="预约车位 649"]')
  await new Promise(r => setTimeout(r, 1500))
  await page.screenshot({ path: 'screenshots/drawer.png' })
  console.log(await page.evaluate(() => document.body.innerText))
} finally { await browser.close() }
