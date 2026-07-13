import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const executiveCommandCenterRepository = createCriticalStateRepository({
  repository: "executive_command_center",
  entityType: "executive_command_record",
  idField: "record_id",
});

export default executiveCommandCenterRepository;
