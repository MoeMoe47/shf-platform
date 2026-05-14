const KEY = "sales:proposal:drafts";
function load(){ try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return[]} }
function save(v){ try{localStorage.setItem(KEY, JSON.stringify(v));}catch{} }

export function createDraft(from){
  const drafts = load();
  const draft = {
    id: Date.now(),
    createdAt: Date.now(),
    org: from?.org || "Unknown Org",
    contact: from?.contact || {},
    items: from?.items || [],
    notes: from?.notes || "",
    source: "employer-bridge"
  };
  drafts.push(draft); save(drafts);
  return draft;
}
export function listDrafts(){ return load(); }
