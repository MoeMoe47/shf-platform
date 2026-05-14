import React from "react";

function parseCSV(text){
  const rows = text.trim().split(/\r?\n/);
  const [head, ...lines] = rows;
  const cols = head.split(",").map(s=>s.trim());
  return lines.map((ln,i)=>{
    const cells = ln.split(",").map(s=>s.trim());
    const obj = {}; cols.forEach((c,idx)=>obj[c]=cells[idx]||"");
    obj._id = i+1; return obj;
  });
}

export default function PartnerJobs(){
  const [rows,setRows] = React.useState([]);
  const fileRef = React.useRef(null);

  async function onFile(e){
    const f = e.target.files?.[0]; if(!f) return;
    const txt = await f.text();
    setRows(parseCSV(txt));
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(rows,null,2)], {type:"application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "partner-jobs.json"; a.click();
  }

  return (
    <div className="page fade-in">
      <h2>Partner Jobs (CSV)</h2>

      <div className="toolbar" style={{marginBottom:12}}>
        <input ref={fileRef} type="file" accept=".csv" onChange={onFile} className="input" />
        <button className="btn" onClick={exportJSON} disabled={!rows.length}>Export JSON</button>
      </div>

      {!rows.length ? (
        <div className="card lead">Upload a CSV with columns like: <code>title,company,city,url</code></div>
      ) : (
        <div className="card" style={{padding:0}}>
          <table className="table">
            <thead>
              <tr>
                {Object.keys(rows[0]).filter(k=>k!=="_id").map(k=>(
                  <th key={k}>{k}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r._id}>
                  {Object.keys(r).filter(k=>k!=="_id").map(k=>(
                    <td key={k}>{k==="url" ? <a href={r[k]} target="_blank" rel="noreferrer">{r[k]}</a> : r[k]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
