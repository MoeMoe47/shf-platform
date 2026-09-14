// Route: /store.html#/notifications (via StoreRoutes.jsx → StoreCatalogShell)
//
// NCA-3: Store's canonical inbox destination — mounts the same shared
// NotificationInbox every shell consumes (NCA-D002), inside the same
// StoreCatalogShell sidebar/footer chrome the Catalog page already uses.
// mobileNavOpen/onToggleMobileMenu/mobileMenuBtnRef are injected by
// StoreCatalogShell (it clones its child with these props) but this page
// has no header of its own to hand them to, so they are accepted and
// intentionally unused rather than causing a prop-type mismatch.
import React from "react";
import NotificationInbox from "@/components/shared/notifications/NotificationInbox.jsx";

export default function StoreNotifications() {
  return <NotificationInbox description="Updates across the Silicon Heartland Store and your ecosystem activity." />;
}
