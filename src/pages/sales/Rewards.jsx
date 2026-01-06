// src/pages /sales/Rewards.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import RewardsChip from "@/components/rewards/RewardsChip.jsx";
import AchievementsBar from "@/components/rewards/AchievementsBar.jsx";
import BadgeDetailsModal from "@/components/rewards/BadgeDetailsModal.jsx"; // the tiny modal we added

export default function RewardsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [openId, setOpenId] = React.useState(null);

  // Open from deep link like #/rewards?badge=streak_7
  React.useEffect(() => {
    const q = searchParams.get("badge");
    if (q && q !== openId) {
      setOpenId(q);
      // optional: emit analytics
      try {
        window.dispatchEvent(new CustomEvent("analytics:ping", { detail: { name: "rewards.badge.deepLinkOpen", badge: q }}));
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // When user clicks a badge chip in the bar
  function handleOpen(id) {
    setOpenId(id);
    // keep URL in sync (so they can copy/paste/share)
    const next = new URLSearchParams(searchParams);
    next.set("badge", id);
    setSearchParams(next, { replace: false });
  }

  function handleClose() {
    setOpenId(null);
    const next = new URLSearchParams(searchParams);
    next.delete("badge");
    setSearchParams(next, { replace: true });
  }

  return (
    <section className="crb-main" aria-labelledby="rw-title">
      <header className="db-head">
        <div>
          <h1 id="rw-title" className="db-title">Rewards & Achievements</h1>
          <p className="db-subtitle">Your points, badges, and streak progress.</p>
        </div>
        <RewardsChip />
      </header>

      {/* Achievements row (clickable) */}
      <section className="card card--pad" aria-label="Achievements">
        <AchievementsBar onOpen={handleOpen} />
      </section>

      {/* (Optional) You can add wallet history / points breakdown below */}

      {/* Auto-openable badge modal */}
      <BadgeDetailsModal
        open={!!openId}
        badgeId={openId}
        onClose={handleClose}
      />
    </section>
  );
}
