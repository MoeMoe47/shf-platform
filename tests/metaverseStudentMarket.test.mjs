import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pageSource = readFileSync(new URL("../src/pages/metaverse/MetaverseCityPage.jsx", import.meta.url), "utf8");
const clientSource = readFileSync(new URL("../src/system/metaverse/metaverseMarketClient.js", import.meta.url), "utf8");
const marketSource = readFileSync(new URL("../src/components/metaverse/MetaverseMarket.jsx", import.meta.url), "utf8");
const controlsSource = readFileSync(new URL("../src/components/metaverse/MetaverseCameraControls.jsx", import.meta.url), "utf8");
const hotspotSource = readFileSync(new URL("../src/components/metaverse/MetaverseHotspot.jsx", import.meta.url), "utf8");
const cssSource = readFileSync(new URL("../src/pages/metaverse/metaverse-city.css", import.meta.url), "utf8");

test("MET-9 market client uses protected APIs and never sends balance, price, currency, buyer, seller, credential, or employment truth", () => {
  assert.match(clientSource, /\/metaverse\/market\/balance/);
  assert.match(clientSource, /\/metaverse\/market\/listings/);
  assert.match(clientSource, /\/metaverse\/market\/orders/);
  assert.match(clientSource, /credentials: "include"/);
  assert.match(clientSource, /balanceAuthority:\s*"TREASURY"/);
  assert.match(clientSource, /clientEditableBalance:\s*false/);
  assert.doesNotMatch(clientSource, /balance\s*:/);
  assert.doesNotMatch(clientSource, /priceAmount\s*:/);
  assert.doesNotMatch(clientSource, /currencyType\s*:/);
  assert.doesNotMatch(clientSource, /buyerUserId\s*:/);
  assert.doesNotMatch(clientSource, /sellerRef\s*:/);
  assert.doesNotMatch(clientSource, /credential\s+earned|employment\s+status|you\s+are\s+hired/i);
});

test("MET-9 city page loads only real runtime market listings, orders and Treasury balance", () => {
  assert.match(pageSource, /getMarketBalance\(\)/);
  assert.match(pageSource, /listMarketListings\(\)/);
  assert.match(pageSource, /listMarketOrders\(\)/);
  assert.match(pageSource, /const \[marketListings, setMarketListings\] = useState\(\[\]\)/);
  assert.doesNotMatch(pageSource, /marketListings\s*=\s*\[/);
  assert.doesNotMatch(pageSource, /title:\s*["'].*Market/);
});

test("MET-9 market counts are derived from fetched listings only and exposed through hotspots and controls", () => {
  assert.match(pageSource, /marketCountsByDistrict/);
  assert.match(pageSource, /for \(const listing of marketListings\)/);
  assert.match(pageSource, /marketCount:\s*marketCountsByDistrict\[district\.id\]\s*\|\|\s*0/);
  assert.match(controlsSource, /onToggleMarket/);
  assert.match(controlsSource, /marketCount/);
  assert.match(hotspotSource, /item\.marketCount/);
  assert.match(hotspotSource, /market listing/);
  assert.doesNotMatch(pageSource, /marketCount:\s*\d+/);
});

test("MET-9 market UI clearly labels SHF Credits, order status, refund request state, and canonical balance", () => {
  assert.match(marketSource, /Treasury balance/);
  assert.match(marketSource, /SHF Credits/);
  assert.match(marketSource, /Order status/);
  assert.match(marketSource, /Treasury pending/);
  assert.match(marketSource, /Request refund/);
  assert.match(marketSource, /Refund request submitted/);
  assert.doesNotMatch(marketSource, /<input[^>]+balance/i);
});

test("MET-9 market UI blocks prohibited outcome claims and no employment/credential/skill claim appears from purchase", () => {
  assert.match(marketSource, /Purchases do not create grades, credentials, verified skills, employment, civic authority, reputation, or career eligibility/);
  assert.doesNotMatch(marketSource, /you\s+are\s+hired/i);
  assert.doesNotMatch(marketSource, /credential\s+earned/i);
  assert.doesNotMatch(marketSource, /verified\s+skill:\s*true/i);
  assert.doesNotMatch(marketSource, /course\s+completed/i);
});

test("MET-9 market UI is keyboard/screen-reader operable and mobile responsive", () => {
  assert.match(marketSource, /aria-label="Student Market"/);
  assert.match(marketSource, /aria-label="Live market state"/);
  assert.match(marketSource, /aria-label="Order status"/);
  assert.doesNotMatch(marketSource, /<div[^>]*onClick=/);
  assert.match(cssSource, /\.met-market\s*\{/);
  assert.match(cssSource, /\.met-navigator,\s*\n\s*\.met-missions,\s*\n\s*\.met-opportunities,\s*\n\s*\.met-market\s*\{/);
});

test("MET-9 market UI exposes mission and Opportunity payment context without duplicating MET-6 chat", () => {
  assert.match(pageSource, /<MetaverseMarket/);
  assert.match(marketSource, /Marketplace DMs stay disabled/);
  assert.match(clientSource, /createsMarketplaceDm:\s*false/);
  for (const source of [clientSource, marketSource]) {
    assert.doesNotMatch(source, /createRoom|DIRECT_MESSAGE|marketplace_dm/i);
  }
});
