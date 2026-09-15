import React from "react";
import { unlockStateLabel } from "@/system/metaverse/metaverseUnlockProjection.js";

export default function MetaverseLocationNavigator({
  open,
  districts,
  selectedDistrictId,
  selectedFacilityId,
  getUnlock,
  onSelectDistrict,
  onSelectFacility,
  onClose,
}) {
  return (
    <section className={`met-navigator ${open ? "is-open" : ""}`} aria-label="Accessible metaverse location browser">
      <div className="met-navigator__header">
        <h2>Location browser</h2>
        <button type="button" onClick={onClose}>Close</button>
      </div>
      <div className="met-navigator__tree">
        {districts.map((district) => {
          const districtUnlock = getUnlock({ id: district.id, type: "DISTRICT" });
          const expanded = selectedDistrictId === district.id;
          return (
            <div className="met-navigator__group" key={district.id}>
              <button
                type="button"
                className="met-navigator__item"
                aria-expanded={expanded}
                aria-current={expanded ? "true" : undefined}
                onClick={() => onSelectDistrict(district)}
              >
                <span>{district.label}</span>
                <span>{unlockStateLabel(districtUnlock.decision)}</span>
              </button>
              {expanded ? (
                <div className="met-navigator__children" role="group" aria-label={`${district.label} facilities`}>
                  {district.facilities.map((facility) => {
                    const facilityUnlock = getUnlock({ id: facility.id, type: "FACILITY" });
                    return (
                      <button
                        type="button"
                        key={facility.id}
                        className="met-navigator__child"
                        aria-current={selectedFacilityId === facility.id ? "true" : undefined}
                        onClick={() => onSelectFacility(facility)}
                      >
                        <span>{facility.label}</span>
                        <span>{unlockStateLabel(facilityUnlock.decision)}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
