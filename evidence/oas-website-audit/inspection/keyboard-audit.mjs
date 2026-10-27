import {chromium} from '/Users/mikeslate/Projects/shrv1/node_modules/playwright/index.mjs';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});const results=[];
for(const route of ['/oas.html','/oas-1.html','/oas-control-domains.html','/oas-purpose-boundaries.html','/oas-risk-classification.html']){
 const page=await browser.newPage({viewport:{width:375,height:812},reducedMotion:'reduce'});await page.goto('http://127.0.0.1:5173'+route,{waitUntil:'networkidle'});
 await page.keyboard.press('Tab');const skip=await page.evaluate(()=>({text:document.activeElement.textContent.trim(),focusVisible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outline,boxShadow:getComputedStyle(document.activeElement).boxShadow}));
 await page.keyboard.press('Enter');const afterSkip=await page.evaluate(()=>({active:document.activeElement.tagName,id:document.activeElement.id,hash:location.hash}));
 const stops=[];let matrixScroll=null;
 for(let i=0;i<35;i++){
  await page.keyboard.press('Tab');const stop=await page.evaluate(()=>({tag:document.activeElement.tagName,text:document.activeElement.textContent.trim().slice(0,80),className:document.activeElement.className,focusVisible:document.activeElement.matches(':focus-visible'),outline:getComputedStyle(document.activeElement).outline}));stops.push(stop);
  if(String(stop.className).includes('oasrc-matrix__scroll')){const before=await page.locator('.oasrc-matrix__scroll').evaluate(e=>e.scrollLeft);await page.keyboard.press('ArrowRight');await page.waitForTimeout(100);matrixScroll={before,after:await page.locator('.oasrc-matrix__scroll').evaluate(e=>e.scrollLeft)};}
 }
 await page.setViewportSize({width:320,height:812});const narrow=await page.evaluate(()=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
 results.push({route,skip,afterSkip,stops,matrixScroll,narrow});await page.close();
}
const motion=[];
for(const reducedMotion of ['reduce','no-preference']){
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion});await page.goto('http://127.0.0.1:5173/oas-control-domains.html',{waitUntil:'networkidle'});
 const before=await page.locator('.oascd-node[aria-current="true"]').allTextContents();await page.waitForTimeout(2200);const after=await page.locator('.oascd-node[aria-current="true"]').allTextContents();motion.push({reducedMotion,before,after});await page.close();
}
await fs.writeFile('/private/tmp/oas-website-audit-bn1nv8t9/keyboard-results.json',JSON.stringify({pages:results,motion},null,2)+'\n');
console.log(JSON.stringify(results.map(r=>({route:r.route,skip:r.skip,afterSkip:r.afterSkip,matrixScroll:r.matrixScroll,narrow:r.narrow})),null,2));await browser.close();
