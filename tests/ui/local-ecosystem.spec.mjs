import { test, expect } from '@playwright/test';

const origin = process.env.SILICON_HEARTLAND_TEST_ORIGIN || 'http://127.0.0.1:5173';
const applications = [
  ['SHF', '/foundation.html', 'foundation'],
  ['SHS', '/solutions.html#/home', 'solutions'],
  ['SHU', '/curriculum.html#/login', 'curriculum'],
  ['Metaverse', '/metaverse', 'index'],
  ['Career Center', '/career.html#/', 'career'],
  ['Learning Arcade', '/arcade.html#/', 'arcade'],
];

for (const [name, path, app] of applications) {
  test(`${name} loads directly and refreshes on the shared origin`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
    expect(response.status()).toBe(200);
    if (app === 'foundation') await expect(page.locator('#root')).toHaveAttribute('data-app', app);
    else await expect(page.locator('html')).toHaveAttribute('data-app', app);
    await expect(page.locator('h1,h2').first()).toBeVisible({ timeout: 30000 });
    await expect(page.locator('body')).not.toContainText('Unexpected Application Error');
    await expect(page.locator('body')).not.toContainText('Root element #root not found');
    const image = page.locator('img[src]').first();
    if (await image.count()) await expect.poll(() => image.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
    const headings = await page.locator('h1,h2').allTextContents();
    await testInfo.attach('runtime-evidence', { body: JSON.stringify({ path, headings, errors }), contentType: 'application/json' });
    expect(errors).toEqual([]);
    await page.reload({ waitUntil: 'domcontentloaded' });
    if (app === 'foundation') await expect(page.locator('#root')).toHaveAttribute('data-app', app);
    else await expect(page.locator('html')).toHaveAttribute('data-app', app);
    await expect(page.locator('h1,h2').first()).toBeVisible({ timeout: 30000 });
    expect(new URL(page.url()).origin).toBe(origin);
  });
}

test('Metaverse navigation uses real local apps and its protected city route survives refresh', async ({ page }) => {
  await page.goto(`${origin}/metaverse`);
  await page.locator('.met-home__foundationCard[href="/foundation.html"]').click();
  await expect(page.locator('.shf-hero')).toBeVisible();
  await page.goto(`${origin}/metaverse`);
  await page.locator('.met-home__foundationCard[href="/solutions.html#/home"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'solutions');
  await page.goto(`${origin}/metaverse`);
  await page.getByRole('link', { name: 'Sign In', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to Curriculum' })).toBeVisible();
  await page.goto(`${origin}/metaverse/city`);
  await page.reload();
  await expect(page.locator('body')).not.toContainText('Unexpected Application Error');
  expect(new URL(page.url()).pathname).toBe('/metaverse/city');
});

test('Universe Directory and its primary app transitions stay on the shared origin', async ({ page }) => {
  await page.goto(`${origin}/universe/directory`);
  await expect(page.getByRole('heading', { name: 'Your universe of opportunity.' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Your universe of opportunity.' })).toBeVisible();
  for (const name of ['SHF: Silicon Heartland Foundation', 'SHS: Systems', 'Curriculum: Education', 'Career: Workforce']) {
    await expect(page.getByRole('button', { name, exact: true })).toBeVisible();
  }
  await page.getByRole('button', { name: 'Career: Workforce', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'career');
  expect(new URL(page.url()).origin).toBe(origin);
  await page.goto(`${origin}/universe/directory`);
  await page.getByRole('link', { name: /I'm Exploring the Region/ }).click();
  await expect(page.locator('.met-home')).toBeVisible();
  await page.goto(`${origin}/universe/directory`);
  await page.getByRole('link', { name: /View All Destinations/ }).click();
  await page.locator('.ugw-resultCard').filter({ hasText: 'Workforce Arcade' }).getByRole('link').click();
  await expect(page.locator('html')).toHaveAttribute('data-app', 'arcade');
});

test('authorized backend owns API paths and anonymous identity remains denied across apps', async ({ page, request }) => {
  await page.goto(`${origin}/foundation.html`);
  const localBridge = await page.evaluate(async () => (await import('/src/system/routes/crossAppRouteBridge.js')).getShrv1BaseUrl());
  expect(localBridge).toBe(origin);
  const health = await request.get(`${origin}/api/health`);
  expect(health.status()).toBe(200);
  expect(await health.json()).toMatchObject({ ok: true, service: 'shs-api' });
  const ready = await request.get(`${origin}/api/health/ready`);
  expect(ready.status()).toBe(200);
  for (const [, path] of applications) {
    await page.goto(origin + path, { waitUntil: 'domcontentloaded' });
    // APIRequestContext goes to the actual backend, bypassing legacy frontend demo fetch shims.
    const auth = await page.request.get(`${origin}/api/auth/me`, { headers: { 'X-SHS-Organization-Id': 'unrelated-organization' } });
    expect(auth.status()).toBe(401);
  }
  const protectedRoute = await request.post(`${origin}/api/metaverse/entry`, { data: {} });
  expect([401, 403]).toContain(protectedRoute.status());
  const asset = await request.get(`${origin}/assets/brand/shf-official-logo.webp`);
  expect(asset.status()).toBe(200);
  expect(asset.headers()['content-type']).toContain('image/');
  const notApi = await request.get(`${origin}/apiary`);
  expect(notApi.headers()['content-type']).toContain('text/html');
  const notFabric = await request.get(`${origin}/fabric-apiculture`);
  expect(notFabric.headers()['content-type']).toContain('text/html');
});

test('independent Autonomous Registry is reached through the shared prefix and deep links refresh', async ({ page }) => {
  await page.goto(`${origin}/universe/directory`);
  await page.getByRole('button', { name: 'Registry: Identity', exact: true }).click();
  await expect(page).toHaveURL(/\/autonomous-registry\/?$/);
  await expect(page).toHaveTitle('Autonomous Registry');
  await expect(page.locator('h1')).toBeVisible();
  await page.goto(`${origin}/autonomous-registry/agents/AR-2026-0001847`);
  await expect(page.locator('h1')).toBeVisible();
  await page.reload();
  await expect(page.locator('h1')).toBeVisible();
  await expect(page.locator('body')).toContainText('AR-2026-0001847');
  expect(new URL(page.url()).origin).toBe(origin);
  const auth = await page.request.get(`${origin}/api/auth/me`);
  expect(auth.status()).toBe(401);
});

test('Registry Phase 1 normalizes Home and preserves legacy hard reloads without enabling planned pages', async ({ page, request }) => {
  const home = await request.get(`${origin}/autonomous-registry?from=universe`, { maxRedirects: 0 });
  expect(home.status()).toBe(308);
  expect(home.headers().location).toBe('/autonomous-registry/?from=universe');
  const head = await request.head(`${origin}/autonomous-registry`, { maxRedirects: 0 });
  expect(head.status()).toBe(308);
  const mutation = await request.post(`${origin}/autonomous-registry`, { maxRedirects: 0 });
  expect(mutation.status()).toBe(405);

  await page.goto(`${origin}/autonomous-registry?from=universe#records`);
  await expect(page).toHaveURL(`${origin}/autonomous-registry/?from=universe#records`);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1, name: 'Autonomous Registry' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Autonomous Registry home' })).toHaveAttribute('href', '/autonomous-registry/');
  const nav = page.getByRole('navigation', { name: 'Primary navigation' });
  await expect(nav.locator('span')).toHaveText(['Explore', 'Verify', 'Register', 'Standards & Governance', 'Developers']);
  await expect(nav.locator('[aria-disabled="true"]')).toHaveCount(5);
  await expect(nav.getByRole('link')).toHaveCount(0);
  await expect(nav.getByText('Status', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Return to Universe' })).toBeVisible();

  for (const [path, title] of [
    ['/autonomous-registry/agents/AR-2026-0001847', 'Civic Pathways Advisor'],
    ['/autonomous-registry/verify/AR-2026-0001847', 'Record Verified']
  ]) {
    await page.goto(`${origin}${path}`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
    await expect(page).toHaveURL(`${origin}${path}`);
  }
  for (const path of ['/autonomous-registry/future-route', '/autonomous-registry/agent/AR-UNKNOWN', '/autonomous-registry/verify']) {
    await page.goto(`${origin}${path}`);
    await page.reload();
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
  }
});

test('Registry Phase 1 keeps the institutional navigation usable at tablet and mobile widths', async ({ page }) => {
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${origin}/autonomous-registry/`);
    await expect(page.getByRole('heading', { level: 1, name: 'Autonomous Registry' })).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    await expect(page.getByLabel('Standards & Governance — coming in a future phase')).toHaveAttribute('aria-disabled', 'true');
    await expect(page.getByRole('link', { name: 'Return to Universe' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  }
});

test('unauthenticated SHU learning and Metaverse operations preserve existing access gates', async ({ page }) => {
  for (const hash of ['#/', '#/curriculum/learning']) {
    await page.goto(`${origin}/curriculum.html${hash}`);
    await expect(page.getByRole('heading', { name: 'Sign in to Curriculum' })).toBeVisible();
    await expect(page).toHaveURL(/#\/login/);
  }
  await page.goto(`${origin}/metaverse/operations`);
  await expect(page.getByText('Access restricted.', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Operations & Orchestration Command Center' })).toHaveCount(0);
});
