import useTour from "./useTour";
import TourOverlay from "./TourOverlay";
import { tourSteps } from "./tourConfig";
import "./tourStyles.css";

export default function TourProvider({ children }) {
  const tour = useTour(tourSteps.length);

  return (
    <>
      {children}

      <TourOverlay
        state={tour.state}
        nextStep={tour.nextStep}
        prevStep={tour.prevStep}
        endTour={tour.endTour}
      />

      {!tour.state.isActive ? (
        <button
          type="button"
          className="tour-start-btn"
          onClick={tour.startTour}
          aria-label="Start guided system tour"
        >
          Guided Tour
        </button>
      ) : null}
    </>
  );
}
