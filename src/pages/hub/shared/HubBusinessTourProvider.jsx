import TourProvider from "@/system/tour/TourProvider";
import { getHubTourSteps } from "./hubTourSteps";

export default function HubBusinessTourProvider({ pageKey, children }) {
  return (
    <TourProvider steps={getHubTourSteps(pageKey)} buttonLabel="Start Tour">
      {children}
    </TourProvider>
  );
}
