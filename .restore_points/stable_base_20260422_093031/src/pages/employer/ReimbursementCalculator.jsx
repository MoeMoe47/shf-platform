import React from "react";
import { pushNote } from "@/shared/inbox/inbox.js";
import { salesLeadSync } from "@/shared/employer/salesBridge.js";

// Optional helpers if present; guarded so we don't hard-crash if missing.
let matchPrograms, estimateReimbursement;
try { ({ matchPrograms, estimateReimbursement } = require("@/shared/employer/eligibility.js")); } catch {}

function dlCSV(filename, rows) {
  const esc = (v) => `"${String(v ?? "").replace(/"/g,'""')}"`;
  const header = Object.keys(rows[0] || {}).map(esc).join(",");
  const body = rows.map(r => Object.keys(rows[0] || {}).map(k => esc(r[k])).join(",")).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href), 1500);
}

function dollars(n){ return `$${(Number(n)||0).toLocaleString()}`; }

export default function ReimbursementCalculator(){
  // Basic employer inputs
  const [company, setCompany] = React.useState("Sample Employer LLC");
  const [contact, setContact] = React.useState("ops@sample.com");
  const [headcount, setHeadcount] = React.useState(5);
  const [hourly, setHourly] = React.useState(22);
  const [hoursPerWeek, setHoursPerWeek] = React.useState(30);
  const [weeks, setWeeks] = React.useState(12);
  const [trainingCost, setTrainingCost] = React.useState(1500);

  // Program toggles (user may pick multiple)
  const [useOJT, setUseOJT] = React.useState(true);
  const [useIncumbent, setUseIncumbent] = React.useState(false);
  const [useTax, setUseTax] = React.useState(false);

  // Simple default % if no eligibility.js present
  const OJT_PCT = 0.5;         // 50% wage reimbursement
  const INCUMBENT_PCT = 0.33;  // 33% training reimbursement
  const TAX_BONUS_PER_HIRE = 500; // Flat estimate per new hire

  const wageTotal = headcount * hourly * hoursPerWeek * weeks;
  const trainingTotal = headcount * trainingCost;

  // Compute benefits (fallback math if estimateReimbursement not present)
  const ojtAmt = useOJT ? Math.round((estimateReimbursement?.("OJT", { headcount, hourly, hoursPerWeek, weeks }) ?? (wageTotal * OJT_PCT))) : 0;
  const incAmt = useIncumbent ? Math.round((estimateReimbursement?.("Incumbent", { headcount, trainingCost }) ?? (trainingTotal * INCUMBENT_PCT))) : 0;
  const taxAmt = useTax ? Math.round((estimateReimbursement?.("TaxCredit", { headcount }) ?? (headcount * TAX_BONUS_PER_HIRE))) : 0;

  const totalBenefit = ojtAmt + incAmt + taxAmt;
  const netOutlay = Math.max(0, wageTotal + trainingTotal - totalBenefit);

  const rows = [
    { item: "Headcount", value: headcount },
    { item: "Hourly wage", value: `$${hourly}` },
    { item: "Hours/week", value: hoursPerWeek },
    { item: "Weeks", value: weeks },
    { item: "Training per hire", value: dollars(trainingCost) },
    { item: "—", value: "—" },
    { item: "Gross wages (period)", value: dollars(wageTotal) },
    { item: "Gross training (period)", value: dollars(trainingTotal) },
    { item: "OJT reimbursement", value: useOJT ? dollars(ojtAmt) : "$0" },
    { item: "Incumbent Worker reimbursement", value: useIncumbent ? dollars(incAmt) : "$0" },
    { item: "Estimated tax credits", value: useTax ? dollars(taxAmt) : "$0" },
    { item: "TOTAL BENEFIT", value: dollars(totalBenefit) },
    { item: "NET OUTLAY (after benefits)", value: dollars(netOutlay) },
  ];

  const onExportCSV = () => {
    const csvRows = rows.map(r => ({ Item: r.item, Value: r.value }));
    dlCSV("employer-reimbursement-estimate.csv", csvRows);
    try { pushNote({ kind:"success", text:"Exported reimbursement estimate CSV." }); } catch {}
  };

  const onSendToSales = () => {
    const payload = {
      source: "employer:reimbursement-calculator",
      company, contact,
      headcount, hourly, hoursPerWeek, weeks, trainingCost,
      picks: { OJT: useOJT, Incumbent: useIncumbent, TaxCredit: useTax },
      calc: { wageTotal, trainingTotal, ojtAmt, incAmt, taxAmt, totalBenefit, netOutlay },
      ts: Date.now()
    };
    try {
      salesLeadSync(payload);
      pushNote?.({ kind:"success", text:"Sent line-item estimate to Sales." });
    } catch (e) {
      console.error("salesLeadSync failed", e);
      pushNote?.({ kind:"error", text:"Could not send to Sales (see console)." });
    }
  };

  const suggested = (matchPrograms ? matchPrograms({ headcount, hourly, trainingCost }) : [])
    .map(p => p.name).join(", ") || "OJT (50%), Incumbent (33%), Tax credit";

  return (
    <div className="page pad" data-page="employer-reimbursement">
      <header className="card card--pad">
        <h1 style={{margin:0}}>Reimbursement Calculator</h1>
        <div className="muted">Estimate OJT wage reimbursement, Incumbent Worker training support, and tax credits.</div>
      </header>

      <section className="card card--pad">
        <div className="grid" style={{gap:12, gridTemplateColumns:"repeat(3, minmax(0,1fr))"}}>
          <label>Company
            <input className="input" value={company} onChange={e=>setCompany(e.target.value)} />
          </label>
          <label>Contact (email)
            <input className="input" value={contact} onChange={e=>setContact(e.target.value)} />
          </label>
          <label>Headcount
            <input className="input" type="number" value={headcount} onChange={e=>setHeadcount(+e.target.value||0)} />
          </label>
          <label>Hourly wage $
            <input className="input" type="number" value={hourly} onChange={e=>setHourly(+e.target.value||0)} />
          </label>
          <label>Hours per week
            <input className="input" type="number" value={hoursPerWeek} onChange={e=>setHoursPerWeek(+e.target.value||0)} />
          </label>
          <label>Weeks (program period)
            <input className="input" type="number" value={weeks} onChange={e=>setWeeks(+e.target.value||0)} />
          </label>
          <label>Training per hire $
            <input className="input" type="number" value={trainingCost} onChange={e=>setTrainingCost(+e.target.value||0)} />
          </label>
          <div className="soft" style={{display:"flex", alignItems:"center", gap:16}}>
            <label><input type="checkbox" checked={useOJT} onChange={e=>setUseOJT(e.target.checked)} /> OJT reimbursement</label>
            <label><input type="checkbox" checked={useIncumbent} onChange={e=>setUseIncumbent(e.target.checked)} /> Incumbent Worker</label>
            <label><input type="checkbox" checked={useTax} onChange={e=>setUseTax(e.target.checked)} /> Tax credit</label>
          </div>
          <div className="muted" style={{gridColumn:"1 / -1"}}>
            <strong>Suggested programs:</strong> {suggested}
          </div>
        </div>
      </section>

      <section className="card card--pad">
        <h3 style={{marginTop:0}}>Line-Item Summary</h3>
        <table className="table" style={{width:"100%", borderCollapse:"collapse"}}>
          <thead>
            <tr className="muted" style={{textAlign:"left"}}>
              <th>Item</th><th>Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r,i)=>(
              <tr key={i}>
                <td>{r.item}</td>
                <td><strong>{r.value}</strong></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{display:"flex", gap:8, marginTop:12}}>
          <button className="btn" onClick={onExportCSV}>Export CSV</button>
          <button className="btn" onClick={onSendToSales}>Send to Sales</button>
        </div>
      </section>
    </div>
  );
}
