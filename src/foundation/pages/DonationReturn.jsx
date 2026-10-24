import React, { useEffect, useState } from "react";
import { readDonationStatus } from "../adapters/donationCheckout.js";
import { formatDonationAmount } from "../adapters/donationHandoff.js";
import { donationReturnMessage } from "../adapters/donationReturnMessage.js";
import "../styles/foundation-donation.css";

export default function DonationReturn({ canceled = false }) {
  const [record, setRecord] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const reference = new URLSearchParams(
    typeof window === "undefined"
      ? ""
      : window.location.hash.split("?")[1] || "",
  ).get("donation");
  async function refresh() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      setRecord(await readDonationStatus(reference));
    } catch {
      setError(
        "Payment status is unavailable. Please refresh later or contact SHF before making another gift.",
      );
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    let active = true;
    if (reference)
      readDonationStatus(reference)
        .then((value) => {
          if (active) setRecord(value);
        })
        .catch(() => {
          if (active)
            setError(
              "Payment status is unavailable. Please refresh later or contact SHF before making another gift.",
            );
        });
    return () => {
      active = false;
    };
  }, [reference]);
  return (
    <section
      className="shf-donation-page shf-donation-shell shf-donation-return"
      aria-labelledby="donation-return-title"
    >
      <h1 id="donation-return-title">
        {canceled ? "Checkout canceled" : "Thank you"}
      </h1>
      <p role="status">{donationReturnMessage(record, canceled)}</p>
      {record && (
        <p>
          {formatDonationAmount(record.amountCents)}{" "}
          {record.frequency === "MONTHLY" ? "monthly" : "one-time"} gift.
          {record.frequency === "MONTHLY" &&
          record.recurringStatus === "CANCELED"
            ? " The recurring schedule is canceled."
            : ""}
        </p>
      )}
      {error && <p role="alert">{error}</p>}
      {reference && (
        <button
          className="shf-donation-primary"
          type="button"
          disabled={busy}
          onClick={refresh}
        >
          {busy ? "Checking…" : "Refresh payment status"}
        </button>
      )}
      <p>
        <a href="#/get-involved">Return to giving</a>
      </p>
    </section>
  );
}
