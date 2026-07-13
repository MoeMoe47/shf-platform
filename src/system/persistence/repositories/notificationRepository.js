import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const notificationRepository = createCriticalStateRepository({
  repository: "notification_fabric",
  entityType: "notification_record",
  idField: "notification_id",
});

export default notificationRepository;
