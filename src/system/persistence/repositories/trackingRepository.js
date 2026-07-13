import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const trackingRepository = createCriticalStateRepository({
  repository: "tracking_intelligence",
  entityType: "tracking_record",
  idField: "tracking_event_id",
});

export default trackingRepository;
