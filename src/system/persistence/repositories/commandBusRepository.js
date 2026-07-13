import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const commandBusRepository = createCriticalStateRepository({
  repository: "command_bus",
  entityType: "command_record",
  idField: "command_id",
});

export default commandBusRepository;
