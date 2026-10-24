import React, { useRef, useState } from "react";
import {
  formatDonationAmount,
  parseDonationAmount,
  prepareDonationHandoff,
  startDonationCheckout,
  redirectToDonationCheckout,
} from "../adapters/donationHandoff.js";
import Icon from "./FoundationDonationIcon.jsx";

const presets = [
  [25, "Supports learning resources"],
  [50, "Expands access to program opportunities"],
  [100, "Invests in workforce and career pathways"],
  [250, "Helps grow community and regional initiatives"],
];

export default function FoundationGiftSelector({ onPreview }) {
  const [amount, setAmount] = useState("");
  const [preset, setPreset] = useState(null);
  const [error, setError] = useState("");
  const input = useRef(null);
  const giveNow = useRef(null);
  const [frequency, setFrequency] = useState("ONE_TIME");
  const [busy, setBusy] = useState(false);
  const retry = useRef(null);
  const submitting = useRef(false);
  async function submit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const amountMinor = parseDonationAmount(amount);
    if (amountMinor === null) {
      setError(
        "Enter a positive USD amount with no more than two decimal places.",
      );
      input.current?.focus();
      return;
    }
    if (amountMinor < 100 || amountMinor > 1_000_000) {
      setError("Choose a USD gift between $1.00 and $10,000.00.");
      input.current?.focus();
      return;
    }
    const handoff = prepareDonationHandoff({
      amountMinor,
      currency: "USD",
      frequency: "one-time",
    });
    const intent = `${amountMinor}:${frequency}`;
    submitting.current = true;
    setBusy(true);
    try {
      if (retry.current?.intent !== intent)
        retry.current = { intent, key: crypto.randomUUID() };
      const result = await startDonationCheckout(
        { ...handoff, frequency },
        retry.current.key,
      );
      if (redirectToDonationCheckout(result)) return;
    } catch {
      // A blocked navigation or unavailable browser capability remains unconfirmed.
    } finally {
      submitting.current = false;
      setBusy(false);
    }
    // The shared dialog restores its invoking focus, including Enter submissions.
    giveNow.current?.focus();
    onPreview({
      title: "Your next step: secure giving",
      description: `Your selected ${frequency === "MONTHLY" ? "monthly" : "one-time"} gift is ${formatDonationAmount(handoff.amountMinor)}. We could not open secure giving. If giving is not configured, SHF’s approved secure payment provider must be connected. No payment has been taken by this page. Your checkout request may have been saved; retrying this selection reuses it.`,
    });
  }
  return (
    <form className="shf-gift-selector" onSubmit={submit} noValidate>
      <fieldset className="shf-gift-frequency" disabled={busy}>
        <legend>Gift frequency</legend>
        {[
          ["ONE_TIME", "One-time"],
          ["MONTHLY", "Monthly"],
        ].map(([value, label]) => (
          <label key={value}>
            <input
              type="radio"
              name="gift-frequency"
              value={value}
              checked={frequency === value}
              onChange={() => {
                setFrequency(value);
                setError("");
              }}
            />{" "}
            {label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="shf-donation-sr-only">
          Choose a {frequency === "MONTHLY" ? "monthly" : "one-time"} gift
          amount in USD
        </legend>
        <div className="shf-gift-presets">
          {presets.map(([value, text]) => (
            <button
              type="button"
              disabled={busy}
              key={value}
              aria-pressed={preset === value}
              onClick={() => {
                setPreset(value);
                setAmount(String(value));
                setError("");
              }}
            >
              <strong>${value}</strong>
              <span>{text}</span>
            </button>
          ))}
        </div>
      </fieldset>
      <div className="shf-gift-submit">
        <div>
          <label htmlFor="shf-custom-amount">
            Custom Amount <span>(USD)</span>
          </label>
          <div className="shf-gift-input">
            <span aria-hidden="true">$</span>
            <input
              ref={input}
              id="shf-custom-amount"
              type="text"
              disabled={busy}
              inputMode="decimal"
              autoComplete="off"
              placeholder="Enter amount"
              value={amount}
              aria-invalid={!!error}
              aria-describedby={
                error ? "shf-gift-context shf-gift-error" : "shf-gift-context"
              }
              onChange={(event) => {
                setAmount(event.target.value);
                setPreset(null);
                setError("");
              }}
            />
          </div>
        </div>
        <button
          ref={giveNow}
          className="shf-donation-primary"
          aria-disabled={busy}
          type="submit"
        >
          Give Now <Icon name="arrow" />
        </button>
      </div>
      {busy && <p role="status">Opening secure giving…</p>}
      {error && (
        <p role="alert" id="shf-gift-error" className="shf-gift-error">
          {error}
        </p>
      )}
      <p className="shf-gift-note" id="shf-gift-context">
        <Icon name="shield" /> One-time or monthly gifts of $1–$10,000 USD.
        Payment details are entered securely on Stripe. Monthly gifts continue
        until canceled through SHF.
      </p>
    </form>
  );
}
