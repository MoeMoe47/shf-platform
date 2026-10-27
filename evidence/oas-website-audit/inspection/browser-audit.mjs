import {chromium} from '/Users/mikeslate/Projects/shrv1/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const out='/private/tmp/oas-website-audit-bn1nv8t9';
const origin='http://127.0.0.1:5173';
const routes=['/oas.html','/oas-1.html','/oas-control-domains.html','/oas-purpose-boundaries.html','/oas-risk-classification.html'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({reducedMotion:'reduce'});
const results=[];
let axe;
try {axe=await fs.readFile('/Users/mikeslate/Desktop/autonomous-registry/node_modules/axe-core/axe.min.js','utf8');}catch{}
for(const route of routes){
 const page=await context.newPage();const errors=[],badResponses=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('response',response=>{if(response.status()>=400)badResponses.push({url:response.url(),status:response.status()});});
 await page.setViewportSize({width:1440,height:1000});
 const response=await page.goto(origin+route,{waitUntil:'networkidle'});
 const state=await page.evaluate(()=>({title:document.title,h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()),text:document.body.innerText,
  sections:[...document.querySelectorAll('main section')].map(s=>({id:s.id,heading:s.querySelector('h1,h2,h3')?.textContent.trim()??'',text:s.innerText})),
  links:[...document.querySelectorAll('a')].map(a=>({text:a.innerText.trim()||a.getAttribute('aria-label'),href:a.getAttribute('href'),absolute:a.href,area:a.closest('header')?'header':a.closest('footer')?'footer':'content'})),
  placeholders:[...document.querySelectorAll('[aria-disabled="true"]')].map(a=>({text:a.innerText.trim(),title:a.title,tag:a.tagName})),
  images:[...document.images].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt'),loaded:i.complete&&i.naturalWidth>0})),
  duplicateIds:[...document.querySelectorAll('[id]')].map(x=>x.id).filter((id,i,ids)=>ids.indexOf(id)!==i),
  canvas:document.querySelectorAll('canvas').length,
  overflow:{viewport:innerWidth,scroll:document.documentElement.scrollWidth},
  anchors:[...document.querySelectorAll('a[href^="#"]')].map(a=>({href:a.getAttribute('href'),exists:!!document.getElementById(decodeURIComponent(a.hash.slice(1)))}))}));
 await page.screenshot({path:out+'/'+route.slice(1).replace('.html','')+'-desktop.png',fullPage:true});
 let accessibility=null;
 if(axe){await page.addScriptTag({content:axe});accessibility=await page.evaluate(async()=>{const a=await axe.run(document,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa']}});return {violations:a.violations.map(v=>({id:v.id,impact:v.impact,help:v.help,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),incomplete:a.incomplete.map(v=>({id:v.id,nodes:v.nodes.length})),passes:a.passes.length};});}
 await page.keyboard.press('Tab');const keyboard=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.trim(),href:document.activeElement.getAttribute('href'),outline:getComputedStyle(document.activeElement).outline}));
 const responsive=[];
 for(const width of [768,375]){
  await page.setViewportSize({width,height:900});await page.waitForTimeout(50);
  const snapshot=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,
    horizontalScrollRegions:[...document.querySelectorAll('*')].filter(e=>e.scrollWidth>e.clientWidth+4&&getComputedStyle(e).overflowX==='auto').map(e=>({tag:e.tagName,className:e.className,tabIndex:e.tabIndex})),
    toggle:[...document.querySelectorAll('button')].map(b=>({name:b.getAttribute('aria-label')||b.innerText,expanded:b.getAttribute('aria-expanded'),visible:!!(b.offsetWidth||b.offsetHeight)}))}));
  if(width===375){
   const toggles=page.locator('button[aria-expanded]');
   if(await toggles.count()){await toggles.first().click();snapshot.opened=await toggles.first().getAttribute('aria-expanded');await page.keyboard.press('Escape');snapshot.afterEscape=await toggles.first().getAttribute('aria-expanded');await toggles.first().click();}
   await page.screenshot({path:out+'/'+route.slice(1).replace('.html','')+'-mobile.png',fullPage:true});
  }
  responsive.push(snapshot);
 }
 results.push({route,status:response.status(),...state,accessibility,keyboard,responsive,errors,badResponses});
 await page.close();
}
// Check every actual destination/anchor and distinguish Vite's SPA fallback from a real file/page.
const destinations=[...new Set(results.flatMap(r=>r.links.map(l=>l.absolute)))];const linkResults=[];
for(const destination of destinations){
 const url=new URL(destination);const response=await context.request.get(url.origin+url.pathname+url.search);
 let anchorExists=null,pageIdentity=null;
 if(url.hash){const page=await context.newPage();await page.goto(destination,{waitUntil:'networkidle'});anchorExists=await page.evaluate(hash=>!!document.getElementById(decodeURIComponent(hash.slice(1))),url.hash);pageIdentity=await page.locator('h1').allTextContents();await page.close();}
 linkResults.push({destination,status:response.status(),contentType:response.headers()['content-type'],anchorExists,pageIdentity});
}
const absent=['/oas/catalogs/OAS-1@1.0.0.json','/oas/OAS-1@1.0.0.md','/oas/currentness.json','/schemas/oas/declaration.schema.json','/oas-governance.html','/oas-developers.html','/oas-requirements.html'];
const missing=[];
for(const path of absent){const response=await context.request.get(origin+path);const body=await response.text();missing.push({path,status:response.status(),contentType:response.headers()['content-type'],looksLikeHtml:/<!doctype html>/i.test(body),bodyPrefix:body.slice(0,100)});}
// Confirm animations/canvases differ under normal motion, without changing user settings globally.
const normal=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'no-preference'});const motion=[];
for(const route of routes){const page=await normal.newPage();await page.goto(origin+route,{waitUntil:'networkidle'});motion.push({route,canvases:await page.locator('canvas').count(),animations:await page.evaluate(()=>document.getAnimations().map(a=>({state:a.playState,iterations:a.effect?.getTiming().iterations,duration:a.effect?.getTiming().duration})))});await page.close();}
await fs.writeFile(out+'/browser-results.json',JSON.stringify({origin,axe:!!axe,routes:results,links:linkResults,missing,motion},null,2)+'\n');
console.log(JSON.stringify({pages:results.map(r=>({route:r.route,status:r.status,links:r.links.length,placeholders:r.placeholders.length,errors:r.errors,brokenAnchors:r.anchors.filter(a=>!a.exists),a11y:r.accessibility?.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.length})),responsive:r.responsive.map(v=>({width:v.width,overflow:v.overflow,menuOpened:v.opened,afterEscape:v.afterEscape}))})),linkFailures:linkResults.filter(l=>l.status>=400||l.anchorExists===false),missing,motion},null,2));
await browser.close();
