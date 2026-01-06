import React from "react";
import { NavLink } from "react-router-dom";

const Tab = ({ to, icon, label, end=false }) => (
  <NavLink
    to={to}
    end={end}
    className={({isActive}) => isActive ? "mtab is-active" : "mtab"}
    aria-label={label}
  >
    <span className="mtab-ic" aria-hidden>{icon}</span>
    <span className="mtab-txt">{label}</span>
  </NavLink>
);

export default function MobileTabBar(){
  return (
    <nav className="mobile-tabs" aria-label="Quick nav">
      <Tab to="dashboard" end icon="🏠" label="Home" />
      <Tab to="leads"            icon="🧲" label="Leads" />
      <Tab to="proposal"         icon="📝" label="Pitch" />
      <Tab to="revenue"          icon="💰" label="Revenue" />
      <Tab to="team"             icon="🏅" label="Team" />
    </nav>
  );
}
