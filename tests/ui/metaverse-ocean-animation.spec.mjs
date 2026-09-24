import { test, expect } from "@playwright/test";
import { inflateSync } from "node:zlib";

const base = String(process.env.SHS_TEST_FRONTEND_URL || "http://127.0.0.1:5173").replace(/\/$/, "");
const url = `${base}/metaverse/oil-rig?metaverseDev=1&metSceneTime=DAY`;

function decodePng(buffer) {
  let offset = 8;
  let width = 0;
  let height = 0;
  let channels = 4;
  const idat = [];
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString("ascii", offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      expect(data[8]).toBe(8);
      channels = data[9] === 6 ? 4 : data[9] === 2 ? 3 : 0;
      expect(channels).toBeGreaterThan(0);
    } else if (type === "IDAT") idat.push(data);
    offset += 12 + length;
  }
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const pixels = Buffer.alloc(height * stride);
  let sourceOffset = 0;
  for (let y = 0; y < height; y += 1) {
    const filter = raw[sourceOffset++];
    const rowOffset = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[sourceOffset++];
      const left = x >= channels ? pixels[rowOffset + x - channels] : 0;
      const above = y > 0 ? pixels[rowOffset - stride + x] : 0;
      const upperLeft = y > 0 && x >= channels ? pixels[rowOffset - stride + x - channels] : 0;
      pixels[rowOffset + x] = filter === 0
        ? value
        : filter === 1
          ? (value + left) & 255
          : filter === 2
            ? (value + above) & 255
            : filter === 3
              ? (value + Math.floor((left + above) / 2)) & 255
              : (value + (Math.abs(above - upperLeft) <= Math.abs(left - upperLeft) && Math.abs(above - upperLeft) <= Math.abs(left - above) ? left : Math.abs(left - upperLeft) <= Math.abs(left - above) ? above : upperLeft)) & 255;
    }
  }
  return { width, height, pixels };
}

function meanPixelDifference(first, second) {
  let total = 0;
  for (let index = 0; index < first.pixels.length; index += 1) total += Math.abs(first.pixels[index] - second.pixels[index]);
  return total / first.pixels.length;
}

async function readRuntime(page) {
  return page.locator("[data-ocean-runtime]").evaluate((element) => JSON.parse(element.dataset.oceanRuntime));
}

test("Oil Rig ocean continuously renders and responds correctly to playback controls", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Procedural Debug", exact: true }).click();
  await page.getByRole("button", { name: "Exaggerated", exact: true }).click();
  await page.waitForTimeout(700);

  const waterClip = { x: 340, y: 300, width: 300, height: 400 };
  const t0 = decodePng(await page.screenshot({ clip: waterClip }));
  const runtime0 = await readRuntime(page);
  await page.waitForTimeout(2000);
  const t2 = decodePng(await page.screenshot({ clip: waterClip }));
  await page.waitForTimeout(2000);
  const t4 = decodePng(await page.screenshot({ clip: waterClip }));
  const runtimeRunning = await readRuntime(page);

  expect(runtimeRunning.rafCount).toBeGreaterThan(runtime0.rafCount);
  expect(runtimeRunning.renderCount).toBeGreaterThan(runtime0.renderCount);
  expect(runtimeRunning.simulationTime).toBeGreaterThan(runtime0.simulationTime);
  expect(runtimeRunning.shaderTime).toBeGreaterThan(runtime0.shaderTime);
  expect(meanPixelDifference(t0, t2)).toBeGreaterThan(0.5);
  expect(meanPixelDifference(t2, t4)).toBeGreaterThan(0.5);

  const controls = page.getByLabel("Ocean playback controls");
  await controls.getByRole("button", { name: "Pause", exact: true }).click();
  const pausedAt = await readRuntime(page);
  await page.waitForTimeout(900);
  const pausedAfter = await readRuntime(page);
  expect(Math.abs(pausedAfter.simulationTime - pausedAt.simulationTime)).toBeLessThan(0.1);

  await controls.getByRole("button", { name: "Play", exact: true }).click();
  await page.waitForTimeout(700);
  const resumed = await readRuntime(page);
  expect(resumed.simulationTime).toBeGreaterThan(pausedAfter.simulationTime);

  await page.getByText("Freeze", { exact: true }).click();
  const frozenAt = await readRuntime(page);
  await page.waitForTimeout(900);
  const frozenAfter = await readRuntime(page);
  expect(Math.abs(frozenAfter.simulationTime - frozenAt.simulationTime)).toBeLessThan(0.1);

  await page.getByText("Freeze", { exact: true }).click();
  await page.waitForTimeout(700);
  const unfrozen = await readRuntime(page);
  expect(unfrozen.simulationTime).toBeGreaterThan(frozenAfter.simulationTime);

  await controls.getByRole("button", { name: "Restart", exact: true }).click();
  await page.waitForTimeout(300);
  const restarted = await readRuntime(page);
  expect(restarted.simulationTime).toBeLessThan(0.5);

  await page.getByRole("button", { name: "Natural", exact: true }).click();
  await page.waitForTimeout(700);
  const natural0 = decodePng(await page.screenshot({ clip: waterClip }));
  await page.waitForTimeout(2000);
  const natural2 = decodePng(await page.screenshot({ clip: waterClip }));
  const natural = await readRuntime(page);
  expect(natural.renderCount).toBeGreaterThan(restarted.renderCount);
  expect(meanPixelDifference(natural0, natural2)).toBeGreaterThan(0.1);
  expect(errors).toEqual([]);
});
