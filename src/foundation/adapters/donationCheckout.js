const publicReference =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function validCheckoutUrl(value) {
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      url.hostname === "checkout.stripe.com" &&
      !url.port &&
      !url.username &&
      !url.password &&
      url.pathname.startsWith("/c/")
    );
  } catch {
    return false;
  }
}
async function apiBase() {
  // Resolve the existing canonical deployment base only in the browser.
  const configuredWindow = /** @type {Window & {__SHS_API_BASE__?: string}} */ (
    window
  );
  return String(
    import.meta.env?.VITE_API_BASE ||
      configuredWindow.__SHS_API_BASE__ ||
      import.meta.env?.VITE_SHS_API_BASE ||
      "/api",
  ).replace(/\/+$/, "");
}
async function request(path, options, dependencies) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  try {
    const base = dependencies.baseUrl ?? (await apiBase());
    const response = await (dependencies.fetch || globalThis.fetch)(
      `${base}/foundation/donations${path}`,
      {
        ...options,
        credentials: "omit",
        cache: "no-store",
        referrerPolicy: "no-referrer",
        signal: controller.signal,
      },
    );
    if (
      !response.ok ||
      !response.headers.get("content-type")?.includes("application/json")
    )
      throw new Error("donation_unavailable");
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/** Only this public adapter initiates checkout. It never confirms a payment. */
export async function startDonationCheckout(gift, key, dependencies = {}) {
  if (
    !Number.isSafeInteger(gift.amountMinor) ||
    gift.amountMinor < 100 ||
    gift.amountMinor > 1_000_000 ||
    gift.currency !== "USD" ||
    !["ONE_TIME", "MONTHLY"].includes(gift.frequency) ||
    !publicReference.test(key)
  ) {
    return { status: "provider-unavailable" };
  }
  try {
    const result = await request(
      "/checkout",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          amountCents: gift.amountMinor,
          currency: "usd",
          frequency: gift.frequency,
        }),
      },
      dependencies,
    );
    if (
      !publicReference.test(result?.donationId) ||
      !validCheckoutUrl(result?.checkoutUrl)
    )
      throw new Error("invalid_checkout");
    return { status: "checkout-created", checkoutUrl: result.checkoutUrl };
  } catch {
    return { status: "provider-unavailable" };
  }
}
export function redirectToDonationCheckout(
  result,
  navigate = (url) => window.location.assign(url),
) {
  if (
    result?.status !== "checkout-created" ||
    !validCheckoutUrl(result.checkoutUrl)
  )
    return false;
  navigate(result.checkoutUrl);
  return true;
}
export async function readDonationStatus(reference, dependencies = {}) {
  if (!publicReference.test(reference))
    throw new Error("donation_status_unavailable");
  const result = await request(
    `/${reference}/status`,
    { headers: { Accept: "application/json" } },
    dependencies,
  );
  if (
    ![
      "CREATED",
      "CHECKOUT_CREATED",
      "PENDING",
      "COMPLETED",
      "FAILED",
      "CANCELED",
    ].includes(result?.status) ||
    !Number.isSafeInteger(result.amountCents) ||
    result.amountCents < 100 ||
    result.amountCents > 1_000_000 ||
    result.currency !== "usd" ||
    !["ONE_TIME", "MONTHLY"].includes(result.frequency)
  )
    throw new Error("donation_status_unavailable");
  return result;
}
