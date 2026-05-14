const wait=(ms=600)=>new Promise(r=>setTimeout(r,ms));
export async function chargeCard({ amountUSD, item }){ await wait(); return { ok:true, id:"card_"+Date.now(), amountUSD, itemId:item.id }; }
export async function payWithPolygon({ amountUSD, item, polygon }){ await polygon?.connect?.(); await wait(); return { ok:true, txId:"sim:"+Date.now(), amountUSD, itemId:item.id }; }
