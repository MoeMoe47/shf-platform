export default function MapUsaPlate() {
  return (
    <div className="map-usa-plate">
      <div className="map-usa-plate__debug">USA PLATE LIVE</div>
      <img
        className="map-usa-plate__base"
        src="/assets/maps/usa-base.svg"
        alt="USA base"
      />
      <img
        className="map-usa-plate__states"
        src="/assets/maps/usa-state-lines.svg"
        alt="USA state lines"
      />
    </div>
  );
}
