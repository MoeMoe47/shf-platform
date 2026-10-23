import React, { useRef, useState } from "react";
import {
  formatDonationAmount,
  parseDonationAmount,
  prepareDonationHandoff,
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
  function submit(event) {
    event.preventDefault();
    const amountMinor = parseDonationAmount(amount);
    if (amountMinor === null) {
      setError(
        "Enter a positive USD amount with no more than two decimal places.",
      );
      input.current?.focus();
      return;
    }
    const handoff = prepareDonationHandoff({
      amountMinor,
      currency: "USD",
      frequency: "one-time",
    });
    // The shared dialog restores its invoking focus, including Enter submissions.
    giveNow.current?.focus();
    onPreview({
      title: "Your next step: secure giving",
      description: `Your selected one-time gift is ${formatDonationAmount(handoff.amountMinor)}. Online giving is not available yet. SHF’s approved secure payment provider must be connected before you can complete a donation. No payment has been taken and your amount has not been saved.`,
    });
  }
  return (
    <form className="shf-gift-selector" onSubmit={submit} noValidate>
      <fieldset>
        <legend className="shf-donation-sr-only">
          Choose a one-time gift amount in USD
        </legend>
        <div className="shf-gift-presets">
          {presets.map(([value, text]) => (
            <button
              type="button"
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
        <button ref={giveNow} className="shf-donation-primary" type="submit">
          Give Now <Icon name="arrow" />
        </button>
      </div>
      {error && (
        <p role="alert" id="shf-gift-error" className="shf-gift-error">
          {error}
        </p>
      )}
      <p className="shf-gift-note" id="shf-gift-context">
        <Icon name="shield" /> One-time giving in USD. Online payments are not
        yet available.
      </p>
    </form>
  );
}
