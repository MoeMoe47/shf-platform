import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("public Career shell is shared and heart-branded", async () => {
  const layout = await read("src/components/career/CareerPublicLayout.jsx");
  const header = await read("src/components/career/CareerPublicHeader.jsx");
  const footer = await read("src/components/career/CareerPublicFooter.jsx");
  const css = await read("src/styles/career-public.css");
  assert.match(layout, /CareerPublicHeader/);
  assert.match(layout, /CareerPublicFooter/);
  assert.match(header, /CareerHeartMark/);
  assert.match(footer, /CareerHeartMark/);
  assert.match(header, /career-public__nav/);
  assert.match(css, /--cp-orange:#ff4f00/);
  assert.match(css, /Georgia/);
  assert.match(css, /prefers-reduced-motion/);
});

test("public design primitives expose reusable hero, section, search, filter, card, and CTA patterns", async () => {
  const primitives = await read("src/components/career/CareerPublicPrimitives.jsx");
  const css = await read("src/styles/career-public-components.css");
  for (const name of ["CareerPublicHero", "CareerSectionHeader", "CareerSearchBar", "CareerFilterBar", "CareerPublicCTA", "CareerCard"]) assert.match(primitives, new RegExp(`export function ${name}`));
  for (const selector of ["career-public__hero", "career-public__sectionHeader", "career-public__search", "career-public__filter", "career-public__cta", "career-public__card"]) assert.match(css + primitives, new RegExp(selector.replaceAll("__", "__")));
});

test("public visual system does not introduce unsupported data claims", async () => {
  const sources = await Promise.all(["src/components/career/CareerPublicPrimitives.jsx", "src/components/career/CareerPublicHeader.jsx", "src/components/career/CareerPublicFooter.jsx", "src/styles/career-public.css"].map(read));
  assert.doesNotMatch(sources.join("\n"), /salary|demand score|placement rate|applicant count|match score|hiring claim/i);
});
