import { mergeQuickMapMarkerSources, toQuickMapMarkerModels } from "./markerViewModel.js";

export class QuickMapClientAdapter {
  toMarkerModels(clientProjectionResults) {
    return toQuickMapMarkerModels(clientProjectionResults);
  }

  mergeMarkerSources(sources) {
    return mergeQuickMapMarkerSources(sources);
  }
}

export function createQuickMapClientAdapter() {
  return Object.freeze(new QuickMapClientAdapter());
}
