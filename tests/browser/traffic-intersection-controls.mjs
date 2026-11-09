import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import { chromium } from 'playwright';

// A separate fixture server and optimizer cache; no app route or production
// control gate is installed. No private artwork is used by this scenario.
const dir=path.resolve('private-assets/metaverse/avalon-village/phase3i-b-controls/browser');
await fs.mkdir(dir,{recursive:true});
const server=await createServer({configFile:false,root:process.cwd(),cacheDir:'/private/tmp/avalon-phase3i-b-vite-cache',optimizeDeps:{entries:['tests/fixtures/traffic-controls-review.html']},server:{host:'127.0.0.1',port:5191,strictPort:true},logLevel:'error'});
await server.listen();
let browser;
const results={url:'http://127.0.0.1:5191/tests/fixtures/traffic-controls-review.html',status:'RUNNING',pageErrors:[],consoleErrors:[],snapshots:[]};
try {
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  page.on('pageerror',e=>results.pageErrors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')results.consoleErrors.push(m.text());});
  await page.goto(results.url);
  await page.waitForFunction(()=>window.trafficReview?.snapshot().scenarios.length===2);
  const advance=async(seconds,name)=>{
    const snapshot=await page.evaluate(t=>window.trafficReview.advance(t),seconds);
    results.snapshots.push({name,...snapshot});
    await page.locator('#time').filter({hasText:snapshot.time.toFixed(2)}).waitFor();
    await page.screenshot({path:path.join(dir,name+'.png')});return snapshot;
  };
  await advance(3,'approach');
  const stopped=await advance(3.5,'stopped-and-queued');
  assert.ok(stopped.scenarios[0].vehicles.some(v=>v.trafficControl.status==='STOPPED'&&v.trafficControl.speed===0));
  await advance(4,'release');
  const final=await advance(35,'cleared-and-reentered');
  for(const scenario of final.scenarios) {
    assert.ok(scenario.events.filter(e=>e.type==='GRANTED').length>=4);
    assert.ok(scenario.events.some(e=>e.type==='CLEARED'));
  }
  const faces=await page.locator('[data-traffic-stop-sign]').evaluateAll(nodes=>nodes.map(n=>({side:n.dataset.trafficStopSign,text:n.textContent,points:n.querySelector('polygon').getAttribute('points').split(' ').length})));
  assert.ok(faces.some(f=>f.side==='FRONT'&&f.text==='STOP')&&faces.some(f=>f.side==='BACK'&&!f.text));
  assert.ok(faces.every(f=>f.points===8));
  // Actual animation runs through the same engine, then freezes on Pause.
  await page.getByRole('button',{name:'Play',exact:true}).click();
  await page.waitForTimeout(2500);
  await page.getByRole('button',{name:'Pause',exact:true}).click();
  const paused=await page.evaluate(()=>window.trafficReview.snapshot().time);
  await page.waitForTimeout(250);
  assert.equal(await page.evaluate(()=>window.trafficReview.snapshot().time),paused);
  assert.ok(paused>final.time);
  assert.deepEqual(results.pageErrors,[]);assert.deepEqual(results.consoleErrors,[]);
  results.status='PASS';
}catch(error){results.status='FAIL';results.failure=error.stack;throw error;}
finally {await fs.writeFile(path.join(dir,'results.json'),JSON.stringify(results,null,2));await browser?.close();await server.close();}
