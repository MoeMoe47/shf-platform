// src/components/arcade/ArcadeSidebarHud.jsx
import React from "react";
import AppLink from "@/components/nav/AppLink.jsx";
import { inApp } from "@/router/paths.js";

export default function ArcadeSidebarHud() {
  const link = "sh-sidebarItem";
  return (
    <nav className="sh-sidebarNav">
      <ul className="sh-sidebarGroup">
        <li><AppLink app="arcade" to={inApp.arcade.dashboard()}   className={link}>🎮 <span>Dashboard</span></AppLink></li>
        <li><AppLink app="arcade" to={inApp.arcade.games()}       className={link}>🕹️ <span>Games</span></AppLink></li>
        <li><AppLink app="arcade" to={inApp.arcade.leaderboard()} className={link}>🏆 <span>Leaderboard</span></AppLink></li>
      </ul>
    </nav>
  );
}
