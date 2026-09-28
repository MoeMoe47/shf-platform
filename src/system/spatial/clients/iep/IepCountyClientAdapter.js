import { joinIepCountyViewModel, toIepCountyViewModels } from "./countyViewModel.js";

export class IepCountyClientAdapter {
  toCountyViewModels(clientProjectionResults) {
    return toIepCountyViewModels(clientProjectionResults);
  }

  joinDomainRecord(record, countyViewModel) {
    return joinIepCountyViewModel(record, countyViewModel);
  }
}

export function createIepCountyClientAdapter() {
  return Object.freeze(new IepCountyClientAdapter());
}
