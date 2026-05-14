// src/shared/views/savedViews.js
const KEY = "shf:treasury:views";

export function listViews(){ 
  try { 
    return JSON.parse(localStorage.getItem(KEY) || "[]"); 
  } catch { 
    return []; 
  } 
}

export function saveView(name, state){ 
  try{
    const views = listViews().filter(v => v.name !== name);
    views.push({ name, state });
    localStorage.setItem(KEY, JSON.stringify(views));
  } catch{} 
}

export function removeView(name){ 
  try{
    const views = listViews().filter(v => v.name !== name);
    localStorage.setItem(KEY, JSON.stringify(views));
  } catch{} 
}
