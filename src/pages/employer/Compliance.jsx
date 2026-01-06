import React from "react";
import { usePersistedState } from "@/shared/usePersistedState.js";

export default function Compliance() {
  const [data, setData] = usePersistedState("employer:compliance", {
    employerName:"", fein:"", contact:"", email:"",
    internName:"", w2:true, pathway:"tech",
    wage:16, hours:180, start:"", end:""
  });

  function handlePrint() { window.print(); }

  return (
    <div className="page pad">
      <h1>Compliance Wizard</h1>
      <div className="grid">
        <label>Employer <input value={data.employerName} onChange={e=>setData(d=>({...d, employerName:e.target.value}))} /></label>
        <label>FEIN <input value={data.fein} onChange={e=>setData(d=>({...d, fein:e.target.value}))} /></label>
        <label>Contact <input value={data.contact} onChange={e=>setData(d=>({...d, contact:e.target.value}))} /></label>
        <label>Email <input value={data.email} onChange={e=>setData(d=>({...d, email:e.target.value}))} /></label>
        <label>Intern <input value={data.internName} onChange={e=>setData(d=>({...d, internName:e.target.value}))} /></label>
        <label>W-2? <input type="checkbox" checked={data.w2} onChange={e=>setData(d=>({...d, w2:e.target.checked}))} /></label>
        <label>Pathway
          <select value={data.pathway} onChange={e=>setData(d=>({...d, pathway:e.target.value}))}>
            <option value="tech">Tech</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="health">Health</option>
          </select>
        </label>
        <label>Wage <input type="number" value={data.wage} onChange={e=>setData(d=>({...d, wage:+e.target.value||0}))} /></label>
        <label>Hours <input type="number" value={data.hours} onChange={e=>setData(d=>({...d, hours:+e.target.value||0}))} /></label>
        <label>Start <input type="date" value={data.start} onChange={e=>setData(d=>({...d, start:e.target.value}))} /></label>
        <label>End <input type="date" value={data.end} onChange={e=>setData(d=>({...d, end:e.target.value}))} /></label>
      </div>

      <section className="print-pack card card--pad">
        <h2>Internship Reimbursement Intake Packet</h2>
        <p><strong>Employer:</strong> {data.employerName} &nbsp; <strong>FEIN:</strong> {data.fein}</p>
        <p><strong>Intern:</strong> {data.internName} &nbsp; <strong>Pathway:</strong> {data.pathway}</p>
        <p><strong>W-2:</strong> {data.w2 ? "Yes" : "No"} &nbsp; <strong>Wage:</strong> ${data.wage}/hr &nbsp; <strong>Hours:</strong> {data.hours}</p>
        <p><strong>Dates:</strong> {data.start || "—"} → {data.end || "—"}</p>
        <hr />
        <ol>
          <li>Attach W-2 verification or offer letter</li>
          <li>Attach weekly time log</li>
          <li>Attach payroll proof for wage reimbursement</li>
          <li>Submit to local OMJ/HSTI/CTIG as applicable</li>
        </ol>
      </section>

      <div style={{marginTop:12}}>
        <button className="btn" onClick={handlePrint}>Print packet</button>
      </div>
    </div>
  );
}
