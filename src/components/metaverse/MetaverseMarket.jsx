import React, { useMemo, useState } from "react";
import { purchaseListing, requestMarketRefund } from "@/system/metaverse/metaverseMarketClient.js";

const TYPE_LABEL = {
  DIGITAL_PRODUCT: "Digital product",
  SERVICE: "Service",
  PROJECT_RESOURCE: "Project resource",
  PROGRAM_RESOURCE: "Program resource",
  ARCADE_RESOURCE: "Arcade resource",
  EVENT_ITEM: "Event item",
  COSMETIC_ITEM: "Cosmetic item",
  CITY_COLLECTIBLE: "City collectible",
  EDUCATIONAL_RESOURCE: "Educational resource",
  SIMULATED_GOOD: "Simulated good",
};

function priceLabel(listing) {
  if (listing.priceType === "FREE" || listing.currencyType === "NONE") return "Free";
  return `${listing.priceAmount} SHF Credits`;
}

export default function MetaverseMarket({ open, listings, orders, balance, loading, error, onRefresh, onClose }) {
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [status, setStatus] = useState("");
  const [busyListingId, setBusyListingId] = useState("");
  const [refundOrderId, setRefundOrderId] = useState("");

  const types = useMemo(() => Array.from(new Set(listings.map((item) => item.listingType))), [listings]);
  const filtered = useMemo(
    () => (typeFilter === "ALL" ? listings : listings.filter((item) => item.listingType === typeFilter)),
    [listings, typeFilter],
  );
  const activeListings = listings.filter((item) => item.status === "PUBLISHED").length;
  const serviceCount = listings.filter((item) => item.listingType === "SERVICE").length;
  const fulfillmentCount = orders.filter((item) => ["PAID", "ACCEPTED", "IN_FULFILLMENT"].includes(item.status)).length;
  const latestOrder = orders[0] || null;

  const buy = async (listing) => {
    setStatus("");
    setBusyListingId(listing.listingId);
    try {
      await purchaseListing({ listingId: listing.listingId, quantity: 1, idempotencyKey: `${listing.listingId}:${Date.now()}` });
      setStatus("Purchase submitted. Treasury settlement controls paid status.");
      await onRefresh?.();
    } catch (err) {
      setStatus(err?.code === "INSUFFICIENT_BALANCE" ? "Insufficient SHF Credits. No order was settled." : (err?.message || "Purchase could not be completed."));
    } finally {
      setBusyListingId("");
    }
  };

  const refund = async (order) => {
    setRefundOrderId(order.orderId);
    setStatus("");
    try {
      await requestMarketRefund(order.orderId, "Buyer requested governed market refund review.");
      setStatus("Refund request submitted. Refund is not complete until Treasury confirms settlement.");
      await onRefresh?.();
    } catch (err) {
      setStatus(err?.message || "Refund request could not be submitted.");
    } finally {
      setRefundOrderId("");
    }
  };

  return (
    <section className={`met-market ${open ? "is-open" : ""}`} aria-label="Student Market">
      <div className="met-market__header">
        <div>
          <h2>Student Market</h2>
          <p>Treasury balance: <strong>{balance?.amount ?? 0} SHF Credits</strong></p>
        </div>
        <button type="button" onClick={onClose}>Close</button>
      </div>

      {loading ? <p className="met-market__status" role="status">Loading market…</p> : null}
      {error ? <p className="met-market__status" role="alert">{error}</p> : null}
      {status ? <p className="met-market__status" role="status">{status}</p> : null}

      <ul className="met-market__counts" aria-label="Live market state">
        <li>{activeListings} active listing{activeListings === 1 ? "" : "s"}</li>
        <li>{serviceCount} service{serviceCount === 1 ? "" : "s"}</li>
        <li>{fulfillmentCount} order{fulfillmentCount === 1 ? "" : "s"} awaiting fulfillment</li>
      </ul>

      {types.length > 1 ? (
        <label className="met-market__filter">
          Filter by listing type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="ALL">All listing types</option>
            {types.map((type) => <option key={type} value={type}>{TYPE_LABEL[type] || type}</option>)}
          </select>
        </label>
      ) : null}

      <p className="met-market__boundary">Purchases do not create grades, credentials, verified skills, employment, civic authority, reputation, or career eligibility.</p>

      {!loading && !error && filtered.length === 0 ? (
        <p className="met-market__status">No market listings are available right now.</p>
      ) : null}

      <ul className="met-market__list">
        {filtered.map((listing) => {
          const soldOut = listing.status === "SOLD_OUT" || listing.quantityAvailable === 0;
          return (
            <li key={listing.listingId} className="met-market__card">
              <div>
                <span className="met-market__type">{TYPE_LABEL[listing.listingType] || listing.listingType}</span>
                <h3>{listing.title}</h3>
                <p>{listing.summary}</p>
                <p className="met-market__price">{priceLabel(listing)}</p>
                <p className="met-market__meta">{listing.fulfillmentType.replace(/_/g, " ").toLowerCase()} · {listing.visibility.toLowerCase()}</p>
              </div>
              <button type="button" onClick={() => buy(listing)} disabled={soldOut || Boolean(busyListingId)}>
                {soldOut ? "Sold out" : busyListingId === listing.listingId ? "Purchasing…" : "Purchase"}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="met-market__orders" aria-label="Order status">
        <h3>Order status</h3>
        {latestOrder ? (
          <div>
            <p><strong>{latestOrder.status.replace(/_/g, " ")}</strong> · {latestOrder.totalPriceSnapshot} SHF Credits</p>
            <p>Payment ref: {latestOrder.treasuryTransactionRef || "Treasury pending"}</p>
            <button type="button" onClick={() => refund(latestOrder)} disabled={refundOrderId === latestOrder.orderId || ["REFUND_REQUESTED", "REFUNDED"].includes(latestOrder.status)}>
              {refundOrderId === latestOrder.orderId ? "Requesting…" : "Request refund"}
            </button>
          </div>
        ) : (
          <p>No market orders yet.</p>
        )}
      </div>

      <div className="met-market__seller" aria-label="Seller and review workflow">
        <h3>Seller workflow</h3>
        <p>Create draft listing, submit for review, publish after approval, fulfill paid orders, and request governed refund handling. Marketplace DMs stay disabled; use governed project, team, or support rooms.</p>
      </div>
    </section>
  );
}
