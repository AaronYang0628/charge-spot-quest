import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
export async function launch() {
  const executablePath = process.env.CHROME_PATH || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome-stable', '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].find(existsSync)
  if (!executablePath) throw new Error('Set CHROME_PATH to a Chromium browser executable')
  return puppeteer.launch({ executablePath, headless: true, args: ['--no-sandbox', '--enable-webgl', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'],
    defaultViewport: { width: 390, height: 844, deviceScaleFactor: 1 } })
}
