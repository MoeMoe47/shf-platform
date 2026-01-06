// src/utils/lordOutcomes/exportOutcomes.js

/**
 * Download an array of outcome rows as JSON.
 * @param {Array<object>} rows
 * @param {string} filenameBase - without extension
 */
export function exportOutcomesToJson(rows, filenameBase = "lord-outcomes") {
    if (!Array.isArray(rows)) {
      console.warn("[LordOutcomes] exportOutcomesToJson expected an array, got:", rows);
      return;
    }
  
    const safeName = filenameBase || "lord-outcomes";
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  
  /**
   * Convert array of objects to CSV string.
   * Assumes a flat object (no nested objects/arrays).
   */
  function toCsv(rows) {
    if (!rows.length) return "";
  
    const headers = Object.keys(rows[0]);
    const esc = (val) => {
      if (val === null || val === undefined) return "";
      const s = String(val);
      // Escape " by doubling them, wrap in quotes if needed
      if (s.includes('"') || s.includes(",") || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
  
    const headerLine = headers.join(",");
    const lines = rows.map((row) => headers.map((h) => esc(row[h])).join(","));
    return [headerLine, ...lines].join("\n");
  }
  
  /**
   * Download an array of outcome rows as CSV.
   * @param {Array<object>} rows
   * @param {string} filenameBase - without extension
   */
  export function exportOutcomesToCsv(rows, filenameBase = "lord-outcomes") {
    if (!Array.isArray(rows)) {
      console.warn("[LordOutcomes] exportOutcomesToCsv expected an array, got:", rows);
      return;
    }
    if (!rows.length) {
      console.warn("[LordOutcomes] exportOutcomesToCsv called with empty array.");
      return;
    }
  
    const safeName = filenameBase || "lord-outcomes";
    const csv = toCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
  
    const a = document.createElement("a");
    a.href = url;
    a.download = `${safeName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
  