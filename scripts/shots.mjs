import { launch } from './browser.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import assert from 'node:assert/strict'
const browser = await launch()
const out = 'screenshots'
const checks = []
const errors = []
const check = (name, condition) => { assert.ok(condition, name); checks.push(name) }
const wait = ms => new Promise(r => setTimeout(r,ms))
async function click(page, text) {
  const found = await page.evaluate(text => {
    const el = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text && !b.disabled)
    el?.click(); return !!el
  }, text)
  assert.ok(found, `button ${text}`)
}
async function ready(page) {
  await page.waitForFunction(() => window.__lot?.scene.children.length > 10)
  await wait(350)
}
try {
  await mkdir(out, {recursive:true})
  const page = await browser.newPage()
  page.on('pageerror',e => errors.push(e.message))
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'no-preference'}])
  await page.goto(process.env.APP_URL || 'http://127.0.0.1:5173')
  await ready(page)
  await page.screenshot({path:`${out}/mobile-main.png`})
  check('initial C empty', await page.evaluate(() => !document.body.innerText.includes('已占用时长')))
  const cameraBefore = await page.evaluate(()=>window.__lot.camera.position.toArray())
  await page.mouse.move(150,300); await page.mouse.down(); await page.mouse.move(210,320,{steps:8}); await page.mouse.up(); await wait(400)
  check('drag rotates without opening drawer', await page.evaluate(() => !document.querySelector('[role="dialog"]')))
  const cameraAfter = await page.evaluate(()=>window.__lot.camera.position.toArray())
  check('camera changed', JSON.stringify(cameraBefore)!==JSON.stringify(cameraAfter))
  await click(page,'复位'); await wait(300)
  await page.click('button[aria-label="预约车位 649"]')
  await page.waitForSelector('[role="dialog"]'); await wait(600)
  const swatches = ['蓝色','黄色','橙色','白色','红色','绿色']
  for (const type of ['敞篷车','皮卡']) {
    await click(page,type); await wait(350)
    for (let i=0;i<swatches.length;i++) {
      await click(page,swatches[i]); await wait(120)
      await page.$eval('.vehicle-preview', (el) => el.scrollIntoView({block:'center'}))
      await (await page.$('.vehicle-preview')).screenshot({path:`${out}/${type==='皮卡'?'pickup':'convertible'}-${i}.png`})
    }
  }
  await click(page,'蓝色')
  await page.screenshot({path:`${out}/mobile-drawer.png`})
  await click(page,'确认预约')
  await wait(750)
  await page.screenshot({path:`${out}/parking.png`})
  await page.waitForFunction(()=>document.body.innerText.includes('预约成功，请按预约时段到场'),{timeout:10000})
  await page.screenshot({path:`${out}/result.png`})
  await click(page,'知道了'); await wait(300)
  await page.screenshot({path:`${out}/parked.png`})
  check('reservation not physical occupancy', await page.evaluate(()=>!document.body.innerText.includes('已占用时长')))
  const model = await page.evaluate(()=> {
    const root=window.__lot.scene.getObjectByName('pickup'); let box=null, wheels=0, paint=[]
    root.traverse(o=>{ if(o.name.includes('Wheel_'))wheels++; if(o.isMesh){o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);box=box?box.union(b):b;if(o.material.name==='CarPaint')paint.push(o.material.color.getHexString())} })
    return {min:box.min.toArray(),max:box.max.toArray(),wheels,paint}
  })
  check('four independent wheels',model.wheels===4)
  check('paint is blue',model.paint.includes('0088d0'))
  check('car is inside C bay',model.min[0]>1.6 && model.max[0]<4.8 && model.min[2]>-2.8 && model.max[2]<2.8)
  check('tires on ground',Math.abs(model.min[1])<.025)
  const session = await page.evaluate(()=>JSON.parse(localStorage.getItem('charge-spot-quest-v3')).sessionId)
  await page.reload(); await ready(page)
  check('reload restores car without replay',await page.evaluate(()=>!!window.__lot.scene.getObjectByName('pickup') && !document.body.innerText.includes('预约效果演示')))
  check('session retained',session===await page.evaluate(()=>JSON.parse(localStorage.getItem('charge-spot-quest-v3')).sessionId))
  await page.click('button[aria-label="预约车位 649"]'); await wait(400)
  check('reserved period disabled',await page.evaluate(()=>[...document.querySelectorAll('[role="dialog"] button')].some(b=>b.disabled&&b.textContent.includes('已预约'))))
  // Inject a rejected async request and verify the form recovers.
  await page.evaluate(async()=>{const {api}=await import('/src/api/client.ts');window.__originalBooking=api.createBooking;api.createBooking=async()=>{throw Error('test network failure')}})
  await click(page,'确认预约'); await page.waitForFunction(()=>document.body.innerText.includes('提交失败'))
  await click(page,'知道了')
  check('failed request re-enables confirmation',await page.evaluate(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='确认预约'&&!b.disabled)))
  await page.evaluate(async()=>{const {api}=await import('/src/api/client.ts');api.createBooking=window.__originalBooking})
  await page.emulateMediaFeatures([{name:'prefers-reduced-motion',value:'reduce'}])
  await click(page,'确认预约'); await page.waitForFunction(()=>document.body.innerText.includes('预约成功，请按预约时段到场'))
  await click(page,'知道了')
  check('second period saved independently',await page.evaluate(()=>JSON.parse(localStorage.getItem('charge-spot-quest-mock-v1')).length===2))
  // Context loss falls back without removing the successful reservation.
  await page.evaluate(()=>window.__lot.gl.getContext().getExtension('WEBGL_lose_context').loseContext())
  await page.waitForFunction(()=>document.body.innerText.includes('场景暂不可用'))
  await page.click('button[aria-label="预约车位 649"]'); await wait(600); await click(page,'确认预约')
  await page.waitForFunction(()=>document.body.innerText.includes('预约成功，请按预约时段到场'))
  check('fallback can book third period',await page.evaluate(()=>JSON.parse(localStorage.getItem('charge-spot-quest-mock-v1')).length===3))
  await click(page,'知道了')
  await page.screenshot({path:`${out}/fallback.png`})
  await click(page,'清除本地数据')
  check('reset clears reservations',await page.evaluate(()=>JSON.parse(localStorage.getItem('charge-spot-quest-mock-v1')).length===0))
  await page.reload(); await ready(page)
  for (const [width,height] of [[320,740],[844,390],[1280,900]]) {
    await page.setViewport({width,height,deviceScaleFactor:1}); await wait(400)
    check(`no horizontal overflow ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth))
    await page.screenshot({path:`${out}/viewport-${width}.png`,fullPage:true})
  }
  // Missing GLB is handled at the scene boundary, with DOM booking still usable.
  const failure = await browser.newPage()
  await failure.setRequestInterception(true)
  failure.on('request',r=>r.url().endsWith('tree.glb')?r.abort():r.continue())
  await failure.goto('http://127.0.0.1:5173')
  await failure.waitForFunction(()=>document.body.innerText.includes('场景暂不可用'))
  await failure.click('button[aria-label="预约车位 649"]')
  await failure.waitForSelector('[role="dialog"]')
  checks.push('missing asset preserves booking UI')
  check('no unexpected page errors',errors.length===0)
  await writeFile(`${out}/qa.json`,JSON.stringify({checks,model,errors},null,2))
  console.log(JSON.stringify({checks,model,errors},null,2))
} finally { await browser.close() }
