import { launch } from './browser.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const url = process.env.APP_URL || 'http://127.0.0.1:5173/charge-spot-quest/'
const types = ['ambulance','police','taxi','sedan','compact','citycar','muscle','van','convertible','pickup']
const browser = await launch()
const errors = []
const results = []
let page
try {
  page = await browser.newPage()
  page.on('pageerror', e => errors.push(e.message))
  await mkdir('screenshots/vehicles', {recursive:true})
  await page.goto(`${url}?showroom=1`)
  await page.waitForSelector('.vehicle-preview[data-phase="idle"]', {timeout:30000})
  for (const type of types) {
    await page.click(`[data-vehicle="${type}"]`)
    await page.waitForSelector(`.vehicle-preview[data-model="${type}"][data-phase="idle"]`, {timeout:15000})
    await page.screenshot({path:`screenshots/vehicles/${type}.png`,fullPage:true})
    const info = await page.evaluate(type => {
      const {scene} = window.__vehiclePreview
      const root = scene.getObjectByName(type)
      let wheels = 0, box
      root.traverse(o => {
        if (/Wheel_(fl|fr|rl|rr)$/.test(o.name)) wheels++
        if (o.isMesh) {
          o.geometry.computeBoundingBox()
          const bounds = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)
          box = box ? box.union(bounds) : bounds
        }
      })
      return {wheels, min:box.min.toArray(), max:box.max.toArray()}
    },type)
    assert.equal(info.wheels,4,`${type}: four wheels`)
    assert.ok(Math.abs(info.min[1]) < .04,`${type}: grounded`)
    assert.ok(info.max[0]-info.min[0] < 2.5,`${type}: bay width`)
    results.push({type,...info})
  }
  await page.click('.preview-replay')
  await page.waitForSelector('.vehicle-preview[data-phase="entering"]')
  const z1 = await page.evaluate(()=>window.__vehiclePreview.scene.getObjectByName('vehicle-preview-motion').position.z)
  await new Promise(r=>setTimeout(r,250))
  const z2 = await page.evaluate(()=>window.__vehiclePreview.scene.getObjectByName('vehicle-preview-motion').position.z)
  assert.ok(z2 > z1,'replay advances the actual model')
  await page.waitForSelector('.vehicle-preview[data-phase="idle"]')
  await page.click('[data-vehicle="ambulance"]')
  await page.click('[data-vehicle="police"]')
  await page.click('[data-vehicle="taxi"]')
  await page.waitForSelector('.vehicle-preview[data-model="taxi"][data-phase="idle"]')
  assert.ok(await page.evaluate(()=>!!window.__vehiclePreview.scene.getObjectByName('taxi')), 'rapid selection ends on last car')
  await page.setViewport({width:1280,height:1000,deviceScaleFactor:1})
  await page.click('[data-vehicle="ambulance"]')
  await page.waitForSelector('.vehicle-preview[data-phase="idle"]')
  await page.screenshot({path:'screenshots/vehicles/showroom-desktop.png',fullPage:true})
  assert.deepEqual(errors,[])
  await writeFile('screenshots/vehicles/qa.json',JSON.stringify({results,replay:[z1,z2],errors},null,2))
  console.log(JSON.stringify({results,replay:[z1,z2],errors},null,2))
} catch(error) {
  await page?.screenshot({path:'screenshots/vehicles/failure.png',fullPage:true})
  console.error('PAGE', await page?.evaluate(()=>document.body.innerText), errors)
  throw error
} finally { await browser.close() }
