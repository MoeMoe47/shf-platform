import React from "react";

export default function SimulationAccessibleAlternative({ accessibleAlternative }) {
  if (!accessibleAlternative) return null;
  return (
    <section className="met-simulation__accessible-alt" aria-label="Accessible alternative">
      <h3>Accessibility</h3>
      <ul>
        <li>Keyboard operable: {accessibleAlternative.keyboardOperable ? "yes" : "no"}</li>
        <li>Screen-reader equivalent instructions and status: {accessibleAlternative.screenReaderEquivalent ? "yes" : "no"}</li>
        <li>Reduced-motion support: {accessibleAlternative.reducedMotionSupported ? "yes" : "no"}</li>
        <li>Color-independent task state: {accessibleAlternative.colorIndependentState ? "yes" : "no"}</li>
        <li>Mobile/tablet support: {accessibleAlternative.mobileTabletSupported ? "yes" : "no"}</li>
      </ul>
      <p>{accessibleAlternative.nonSpatialAlternative}</p>
      {accessibleAlternative.timedInteractionAccommodation ? <p>{accessibleAlternative.timedInteractionAccommodation}</p> : null}
    </section>
  );
}
