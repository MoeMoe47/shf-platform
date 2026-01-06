import * as React from "react";
export function start(fn){
  const st = React.startTransition || ((f)=>f());
  st(fn);
}
