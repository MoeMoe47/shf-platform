import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer } from 'vite';
import react from '@vitejs/plugin-react';
import { chromium } from '@playwright/test';
import { metaversePrivatePreview } from '../../scripts/metaverse/privatePreview.mjs';
const directory='private-assets/metaverse/avalon-village/checkpoint-g';
// Optional isolated scene run keeps diagnostic captures separate from the full run.
const requestedScene=process.argv.find(arg=>arg.startsWith('--scene='))?.slice(8);
if(requestedScene&&!['AUTUMN','WINTER'].some(s=>['DAY','DUSK','NIGHT'].some(p=>requestedScene===s+'/'+p)))throw Error('Invalid --scene');
await fs.mkdir(directory,{recursive:true});
const server=await createServer({configFile:false,root:process.cwd(),logLevel:'warn',cacheDir:'/private/tmp/avalon-g-browser-cache',
  resolve:{alias:{'@':path.resolve('src')}},plugins:[react(),metaversePrivatePreview()],
  optimizeDeps:{entries:['tests/fixtures/world-time-checkpoint-c.html','tests/fixtures/traffic-controls-review.html'],
    include:['react','react-dom','react-dom/client','astronomy-engine','framer-motion','react-router-dom'],noDiscovery:true},
  server:{host:'127.0.0.1',port:5196,strictPort:true,hmr:false,watch:null}});
const evidence={authorization:'SYNTHETIC_TEST_FIXTURE_ONLY',seasonalBehavior:'BLOCKED_UNVERIFIED_STOP_GEOMETRY',scenes:[],errors:[]};
let browser;
try {
  await server.listen();browser=await chromium.launch({headless:true});
  for(const season of ['AUTUMN','WINTER'])for(const period of ['DAY','DUSK','NIGHT']) {
    const key=season+'/'+period,name=key.toLowerCase().replace('/','-');
    if(requestedScene&&key!==requestedScene)continue;
    const context=await browser.newContext({viewport:{width:1600,height:1003},timezoneId:'Asia/Tokyo'});
    await context.route('**/api/**',r=>r.fulfill({json:{ok:true,data:new URL(r.request().url()).pathname.endsWith('/metaverse/entry')?{can_enter:true,decision:{decision:'AVAILABLE'}}:[]}}));
    const page=await context.newPage();page.setDefaultTimeout(60000);page.on('pageerror',e=>evidence.errors.push(e.message));
    await page.clock.install({time:new Date('2026-11-08T17:00:00Z')});
    await page.goto(`http://127.0.0.1:5196/tests/fixtures/world-time-checkpoint-c.html?district=community-district&destination=avalon-village&metaverseDev=1&avalonDayV2=1&avalonTraffic3l=1&avalonTraffic3m=1&avalonTraffic3p=1&worldTimePreview=1&worldInstant=2026-11-08T17:00:00Z&worldSeason=${season}&worldPeriod=${period}&avalonSeasonalTraffic=${name}`);
    const layer=page.locator('[data-seasonal-traffic-scene]');
    await layer.waitFor();assert.equal(await layer.getAttribute('data-intersection-controls'),'OFF');
    assert.equal(await layer.getAttribute('data-traffic-behavior'),'BLOCKED_UNVERIFIED_STOP_GEOMETRY');
    for(const label of ['Collapse City Map','Collapse sidebar'])if(await page.getByRole('button',{name:label,exact:true}).count())await page.getByRole('button',{name:label,exact:true}).click();
    const sample=()=>layer.locator('[data-traffic-png]').evaluateAll(ns=>ns.map(n=>{
      const r=n.querySelector('image').getBoundingClientRect();
      return {id:n.dataset.trafficId,model:n.dataset.modelId,progress:Number(n.dataset.progress),opacity:Number(n.getAttribute('opacity')),
        x:n.dataset.worldX,y:n.dataset.worldY,scale:n.dataset.imageScale,
        visible:r.right>60&&r.left<1600&&r.bottom>0&&r.top<1003,
        fullyVisible:r.left>60&&r.right<1600&&r.top>0&&r.bottom<1003};
    }));
    const initial=await sample();assert.equal(initial.length,season==='AUTUMN'?2:1);
    if(season==='AUTUMN')assert.equal(new Set(initial.map(v=>v.model)).size,2);
    else assert.ok(initial.every(v=>v.id.includes('front-garden')));
    const result={key,initial,visibleModels:[],screenshots:[],checks:[]};evidence.scenes.push(result);
    let previous=initial;
    for(let second=0;second<165;second++) {
      await page.clock.runFor(1000);const cars=await sample();
      for(const car of cars) {
        if(car.visible) {assert.equal(car.opacity,1);if(!result.visibleModels.includes(car.model))result.visibleModels.push(car.model);}
        const old=previous.find(v=>v.id===car.id);
        if(old&&car.model!==old.model)assert.ok(car.progress<old.progress||(!car.visible&&!old.visible),'Models change only at off-screen recycle');
        if(old&&car.progress<old.progress)assert.ok(!car.visible&&!old.visible,'No visible teleport on recycle');
      }
      if(second===27) {
        const file=name+'-first-mix.png';await page.screenshot({path:path.join(directory,file)});result.screenshots.push(file);
        if(season==='AUTUMN')assert.equal(new Set(cars.filter(v=>v.visible).map(v=>v.model)).size,2,'Two visibly different vehicles');
      }
      if(cars.some(v=>v.fullyVisible&&v.model==='pickup-red')&&!result.screenshots.some(f=>f.includes('pickup'))) {
        const file=name+'-pickup.png';await page.screenshot({path:path.join(directory,file)});result.screenshots.push(file);
      }
      previous=cars;
    }
    assert.deepEqual(new Set(result.visibleModels),new Set(season==='AUTUMN'?['sedan-blue','suv-white','pickup-red']:['sedan-blue','suv-white']));
    await page.getByRole('button',{name:'Expand sidebar',exact:true}).click();
    await page.getByRole('button',{name:'Pause All',exact:true}).click();await page.clock.runFor(100);
    const paused=await sample();await page.clock.runFor(300);assert.deepEqual(await sample(),paused);
    await page.locator('[data-world-time-preview] summary').click();
    await page.getByLabel('Simulation date and time (UTC)',{exact:true}).fill('2026-11-08T17:10');await page.clock.runFor(100);
    assert.deepEqual(await sample(),paused);
    await page.getByRole('button',{name:'Restart All',exact:true}).click();await page.clock.runFor(300);
    const resumed=await sample();assert.deepEqual(resumed.map(v=>v.id),paused.map(v=>v.id));
    assert.ok(resumed.every((v,i)=>v.progress>paused[i].progress));
    await page.getByRole('button',{name:'Pause All',exact:true}).click();await page.clock.runFor(100);
    await page.getByLabel('Artwork period',{exact:true}).selectOption(period==='NIGHT'?'DAY':'NIGHT');
    await page.locator('[data-world-time-preview][data-seasonal-ready="true"]').waitFor();
    assert.equal(await layer.count(),0,'Different geometry cannot use current route gate');
    await page.getByLabel('Artwork period',{exact:true}).selectOption('DAY');
    await page.getByLabel('Season preview',{exact:true}).selectOption('SUMMER');
    await page.locator('[data-world-time-preview][data-traffic="SUMMER_ONLY"]').waitFor();await page.clock.runFor(100);
    const summer=()=>page.locator('[data-seasonal-traffic-retained] [data-traffic-png]').evaluateAll(ns=>ns.map(n=>({id:n.dataset.trafficId,progress:n.dataset.progress,model:n.dataset.modelId})));
    const retained=await summer();assert.ok(retained.length>0);
    await page.getByLabel('Season preview',{exact:true}).selectOption(season);
    await page.getByLabel('Artwork period',{exact:true}).selectOption(period);
    await page.locator('[data-world-time-preview][data-seasonal-ready="true"]').waitFor();await page.clock.runFor(100);
    assert.deepEqual(await summer(),retained);
    // Restore the same DAY summer geometry whose state was captured above.
    // DUSK/NIGHT summer mappings intentionally invalidate DAY route signatures.
    await page.getByLabel('Artwork period',{exact:true}).selectOption('DAY');
    await page.getByLabel('Season preview',{exact:true}).selectOption('SUMMER');
    await page.locator('[data-world-time-preview][data-traffic="SUMMER_ONLY"]').waitFor();await page.clock.runFor(100);
    assert.deepEqual(await summer(),retained);
    await page.getByRole('button',{name:'Play All',exact:true}).click();await page.clock.runFor(300);
    assert.ok((await summer()).some((v,i)=>Number(v.progress)>Number(retained[i].progress)));
    result.checks.push('Diverse eligible models visible; no in-journey model change or visible recycle; pause/restart/time edit, mismatched gate and summer restoration pass');
    result.passed=true;await context.close();
  }
  // Reuse the existing controller fixture. Its roads are synthetic, never Avalon.
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  await page.goto('http://127.0.0.1:5196/tests/fixtures/traffic-controls-review.html?holdSeconds=2');
  await page.waitForFunction(()=>Boolean(window.trafficReview));
  evidence.synthetic={holdSeconds:2,snapshots:[]};
  for(const [seconds,name] of [[3,'approach'],[3.5,'stopped'],[4,'departing'],[35,'cleared']]) {
    const snapshot=await page.evaluate(t=>window.trafficReview.advance(t),seconds);
    await page.locator('#time').filter({hasText:snapshot.time.toFixed(2)}).waitFor();
    const file='SYNTHETIC-two-second-'+name+'.png';await page.screenshot({path:path.join(directory,file)});
    evidence.synthetic.snapshots.push({file,...snapshot});
  }
  const last=evidence.synthetic.snapshots.at(-1);
  for(const scenario of last.scenarios)for(const grant of scenario.events.filter(e=>e.type==='GRANTED')) {
    const stop=scenario.events.filter(e=>e.type==='STOPPED'&&e.key===grant.key&&e.time<=grant.time).at(-1);
    if(stop)assert.ok(grant.time-stop.time>=2-1e-9);
  }
  assert.ok(evidence.synthetic.snapshots[1].scenarios[0].vehicles.some(v=>v.trafficControl.status==='STOPPED'&&v.trafficControl.speed===0));
  assert.equal(evidence.errors.length,0);evidence.result='PASS';
}catch(error){evidence.result='FAIL';evidence.failure=error.stack;process.exitCode=1;}
finally {if(browser)await browser.close();await server.close();const filename=requestedScene?'browser-'+requestedScene.toLowerCase().replace('/','-')+'.json':'browser-evidence.json';await fs.writeFile(path.join(directory,filename),JSON.stringify(evidence,null,2));console.log(JSON.stringify({result:evidence.result,scenes:evidence.scenes.map(s=>({key:s.key,passed:s.passed,visibleModels:s.visibleModels})),errors:evidence.errors,failure:evidence.failure,evidence:path.join(directory,filename)}));}
