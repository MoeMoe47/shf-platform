import React, { useState } from "react";
import { addEnterpriseCatalogItem } from "@/system/metaverse/metaverseEnterpriseClient.js";

const CATALOG_CATEGORIES = ["PRODUCT", "SERVICE", "SHOWCASE_ITEM", "COMMUNITY_OFFERING"];

export default function EnterpriseCatalog({ enterpriseId, items, canManage, onRefresh }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState(CATALOG_CATEGORIES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await addEnterpriseCatalogItem(enterpriseId, { title, summary, category });
      setTitle("");
      setSummary("");
      await onRefresh?.();
    } catch (err) {
      setError(err?.message || "Catalog item could not be added.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="met-enterprise__catalog" aria-label="Enterprise catalog">
      <h3>Catalog</h3>
      {(items || []).length === 0 ? <p>No catalog items yet.</p> : null}
      <ul>
        {(items || []).map((item) => (
          <li key={item.catalogItemId}>
            <strong>{item.title}</strong> <span className="met-enterprise__pill">{item.category}</span>
            <p>{item.summary}</p>
            <p className="met-enterprise__meta">{item.status}{item.marketListingId ? " · listed on Student Market" : ""}</p>
          </li>
        ))}
      </ul>
      {canManage ? (
        <form onSubmit={submit} aria-label="Add catalog item">
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
          </label>
          <label>
            Summary
            <textarea value={summary} onChange={(event) => setSummary(event.target.value)} maxLength={500} required />
          </label>
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {CATALOG_CATEGORIES.map((value) => <option key={value} value={value}>{value.replace(/_/g, " ").toLowerCase()}</option>)}
            </select>
          </label>
          {error ? <p role="alert">{error}</p> : null}
          <button type="submit" disabled={busy}>{busy ? "Adding…" : "Add catalog item"}</button>
        </form>
      ) : null}
    </section>
  );
}
