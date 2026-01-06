import React from "react";
import raw from "@/data/marketplace.json";
const norm = (x,i)=>({ id:x.id ?? i+1, title:x.title ?? x.name ?? "Item", number:x.number ?? x.sku ?? "",
  price:Number(x.price ?? 0), rarity:(x.rarity ?? "common").toLowerCase(),
  origin:(x.origin ?? "fresh").toLowerCase(), market:(x.market ?? "other").toLowerCase(),
  badge:x.badge, hue:x.hue ?? 8 });
export function useCatalog(){ const list = Array.isArray(raw) ? raw : Array.isArray(raw.items) ? raw.items : [];
  return React.useMemo(()=>list.map(norm),[list]); }
