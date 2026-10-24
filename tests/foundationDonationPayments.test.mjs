import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import Module from "node:module";
import { build } from "esbuild";
import {
  startDonationCheckout,
  redirectToDonationCheckout,
  readDonationStatus,
} from "../src/foundation/adapters/donationCheckout.js";

const apiRequire = createRequire(
  new URL("../apps/shs-api/package.json", import.meta.url),
);
const React = apiRequire("react");
const { act, create } = apiRequire("react-test-renderer");
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const compiled = await build({
  stdin: {
    contents: `export {default as Gift} from './src/foundation/components/FoundationGiftSelector.jsx';
 export {default as Return} from './src/foundation/pages/DonationReturn.jsx';
 export {donationReturnMessage} from './src/foundation/adapters/donationReturnMessage.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: "cjs",
  platform: "node",
  write: false,
  external: ["react"],
  loader: { ".css": "empty" },
  define: { "import.meta.env": "{}" },
});
const mod = new Module(`${process.cwd()}/.donation-payment-render.cjs`);
mod.filename = `${process.cwd()}/.donation-payment-render.cjs`;
mod.paths = apiRequire.resolve.paths("react");
mod._compile(compiled.outputFiles[0].text, mod.filename);
const publicId = randomUUID();
const checkoutUrl = "https://checkout.stripe.com/c/pay/fixture";
const response = (payload, ok = true) => ({
  ok,
  headers: { get: () => "application/json" },
  json: async () => payload,
});
const gift = { amountMinor: 4237, currency: "USD", frequency: "MONTHLY" };

test("frontend posts exact cents, currency and frequency without institutional identity", async () => {
  let captured;
  const result = await startDonationCheckout(gift, randomUUID(), {
    baseUrl: "/api",
    fetch: async (...args) => {
      captured = args;
      return response({ donationId: publicId, checkoutUrl });
    },
  });
  assert.equal(captured[0], "/api/foundation/donations/checkout");
  assert.deepEqual(JSON.parse(captured[1].body), {
    amountCents: 4237,
    currency: "usd",
    frequency: "MONTHLY",
  });
  assert.equal(captured[1].credentials, "omit");
  assert.equal(result.status, "checkout-created");
  let redirected;
  assert.equal(
    redirectToDonationCheckout(result, (url) => {
      redirected = url;
    }),
    true,
  );
  assert.equal(redirected, checkoutUrl);
});
test("malformed payloads, hostile redirect URLs and backend errors never navigate or confirm success", async () => {
  for (const value of [
    null,
    {},
    { donationId: publicId, checkoutUrl: "http://checkout.stripe.com/c/pay/x" },
    {
      donationId: publicId,
      checkoutUrl: "https://checkout.stripe.com.attacker.example/c/pay/x",
    },
    {
      donationId: publicId,
      checkoutUrl: "https://user@checkout.stripe.com/c/pay/x",
    },
    { donationId: publicId, checkoutUrl: "javascript:alert(1)" },
    { donationId: "guessable", checkoutUrl },
    { donationId: publicId, checkoutUrl: "https://checkout.stripe.com/" },
  ]) {
    const result = await startDonationCheckout(gift, randomUUID(), {
      baseUrl: "/api",
      fetch: async () => response(value),
    });
    assert.equal(result.status, "provider-unavailable");
    assert.equal(
      redirectToDonationCheckout(result, () =>
        assert.fail("must not navigate"),
      ),
      false,
    );
  }
  for (const fetcher of [
    async () => response({}, false),
    async () => {
      throw new Error("offline");
    },
  ]) {
    assert.equal(
      (
        await startDonationCheckout(gift, randomUUID(), {
          baseUrl: "/api",
          fetch: fetcher,
        })
      ).status,
      "provider-unavailable",
    );
  }
});
test("frontend bounds and invalid frequency do not make network requests", async () => {
  for (const value of [
    { ...gift, amountMinor: 99 },
    { ...gift, amountMinor: 1_000_001 },
    { ...gift, frequency: "WEEKLY" },
  ]) {
    assert.equal(
      (
        await startDonationCheckout(value, randomUUID(), {
          fetch: () => assert.fail("invalid request"),
        })
      ).status,
      "provider-unavailable",
    );
  }
});
test("public status reader rejects fabricated, malformed and unrecognized backend states", async () => {
  for (const value of [
    { status: "COMPLETED" },
    {
      status: "SUCCESS",
      amountCents: 2500,
      currency: "usd",
      frequency: "ONE_TIME",
    },
  ]) {
    await assert.rejects(
      readDonationStatus(publicId, {
        baseUrl: "/api",
        fetch: async () => response(value),
      }),
    );
  }
});

test("Give Now uses selected preset/monthly and custom cents; duplicate submit reuses a single request", async () => {
  const previous = { window: globalThis.window, fetch: globalThis.fetch };
  const requests = [];
  const redirects = [];
  let renderer;
  globalThis.window = {
    __SHS_API_BASE__: "/api",
    location: { assign: (url) => redirects.push(url) },
  };
  globalThis.fetch = async (_url, options) => {
    requests.push(options);
    return response({ donationId: publicId, checkoutUrl });
  };
  try {
    await act(async () => {
      renderer = create(
        React.createElement(mod.exports.Gift, {
          onPreview: () => assert.fail("valid checkout"),
        }),
      );
    });
    const root = renderer.root;
    await act(async () => {
      root.findAllByType("button")[0].props.onClick();
    });
    assert.equal(
      root.findAllByType("input").find((input) => input.props.type === "text")
        .props.value,
      "25",
    );
    await act(async () => {
      root
        .findAllByType("input")
        .find((input) => input.props.value === "MONTHLY")
        .props.onChange();
    });
    assert.equal(
      root
        .findAllByType("input")
        .find((input) => input.props.value === "MONTHLY").props.checked,
      true,
    );
    await act(async () => {
      const submit = root.findByType("form").props.onSubmit;
      await Promise.all([
        submit({ preventDefault() {} }),
        submit({ preventDefault() {} }),
      ]);
    });
    assert.equal(requests.length, 1);
    assert.deepEqual(JSON.parse(requests[0].body), {
      amountCents: 2500,
      currency: "usd",
      frequency: "MONTHLY",
    });
    await act(async () => {
      root
        .findAllByType("input")
        .find((input) => input.props.type === "text")
        .props.onChange({ target: { value: "42.37" } });
    });
    assert.equal(
      root
        .findAllByType("button")
        .filter((button) => button.props["aria-pressed"]).length,
      0,
    );
    await act(async () => {
      root
        .findAllByType("input")
        .find((input) => input.props.value === "ONE_TIME")
        .props.onChange();
    });
    await act(async () => {
      await root.findByType("form").props.onSubmit({ preventDefault() {} });
    });
    assert.deepEqual(JSON.parse(requests[1].body), {
      amountCents: 4237,
      currency: "usd",
      frequency: "ONE_TIME",
    });
    assert.deepEqual(redirects, [checkoutUrl, checkoutUrl]);
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    Object.assign(globalThis, previous);
  }
});
test("Give Now fallback is truthful; identical retry retains its idempotency key", async () => {
  const previous = { window: globalThis.window, fetch: globalThis.fetch };
  const keys = [];
  const previews = [];
  let renderer;
  globalThis.window = {
    __SHS_API_BASE__: "/api",
    location: { assign: () => assert.fail("no redirect") },
  };
  globalThis.fetch = async (_url, options) => {
    keys.push(options.headers["Idempotency-Key"]);
    return response({ malformed: true });
  };
  try {
    await act(async () => {
      renderer = create(
        React.createElement(mod.exports.Gift, {
          onPreview: (value) => previews.push(value),
        }),
      );
    });
    await act(async () => {
      renderer.root.findAllByType("button")[0].props.onClick();
    });
    for (let i = 0; i < 2; i++)
      await act(async () => {
        await renderer.root
          .findByType("form")
          .props.onSubmit({ preventDefault() {} });
      });
    assert.equal(keys[0], keys[1]);
    assert.equal(previews.length, 2);
    assert.match(previews[0].description, /could not open secure giving/);
    assert.doesNotMatch(
      previews[0].description,
      /donation is confirmed|payment successful/,
    );
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    Object.assign(globalThis, previous);
  }
});
test("success and cancel messages never fabricate completion; monthly confirmation describes first gift only", () => {
  assert.match(
    mod.exports.donationReturnMessage(null, false),
    /We are confirming/,
  );
  assert.match(
    mod.exports.donationReturnMessage(null, true),
    /No completed donation is confirmed/,
  );
  assert.doesNotMatch(
    mod.exports.donationReturnMessage({ status: "PENDING" }, false),
    /Your donation is confirmed/,
  );
  assert.match(
    mod.exports.donationReturnMessage(
      { status: "COMPLETED", frequency: "MONTHLY" },
      false,
    ),
    /first monthly gift/,
  );
  assert.match(
    mod.exports.donationReturnMessage({ status: "FAILED" }, false),
    /not confirmed/,
  );
});
test("return component renders pending until the verified backend status arrives", async () => {
  const previous = { window: globalThis.window, fetch: globalThis.fetch };
  let complete;
  let renderer;
  const waiting = new Promise((resolve) => {
    complete = resolve;
  });
  globalThis.window = {
    __SHS_API_BASE__: "/api",
    location: { hash: `#/get-involved/success?donation=${publicId}` },
  };
  globalThis.fetch = () => waiting;
  try {
    await act(async () => {
      renderer = create(React.createElement(mod.exports.Return));
    });
    assert.match(JSON.stringify(renderer.toJSON()), /We are confirming/);
    assert.doesNotMatch(
      JSON.stringify(renderer.toJSON()),
      /Your donation is confirmed/,
    );
    await act(async () => {
      complete(
        response({
          status: "COMPLETED",
          amountCents: 2500,
          currency: "usd",
          frequency: "ONE_TIME",
        }),
      );
    });
    assert.match(
      JSON.stringify(renderer.toJSON()),
      /Your donation is confirmed/,
    );
  } finally {
    if (renderer) await act(async () => renderer.unmount());
    Object.assign(globalThis, previous);
  }
});
