import React from "react";
import { NavLink } from "react-router-dom";

export default function LordOutcomesHeaderLocked(){
  const tabs=[
    {to:"/lord-outcomes",label:"Overview",end:true},
    {to:"/lord-outcomes/states",label:"States"},
    {to:"/lord-outcomes/programs",label:"Programs"},
    {to:"/lord-outcomes/employers",label:"Employers"},
    {to:"/lord-outcomes/funding",label:"Funding"},
    {to:"/lord-outcomes/pilots",label:"Pilots"},
  ];

  return(
    <div className="looHdrTop">
      <nav className="looTopTabs">
        {tabs.map(t=>(
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({isActive})=>`looTopTab${isActive?" is-active":""}`}
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
