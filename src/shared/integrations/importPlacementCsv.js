/**
 * Parse a basic CSV:
 * userId,jobTitle,employer,status,compensation,startDate
 * status ∈ [applied,interview,offer,hired,rejected]
 */
export async function parsePlacementCsv(text){
  const rows = text.trim().split(/\r?\n/).slice(1);
  return rows.map(line=>{
    const [userId, jobTitle, employer, status, compensation, startDate] =
      line.split(",").map(s=>s.trim());
    return { userId, jobTitle, employer, status, compensation, startDate, ts: Date.now() };
  });
}
