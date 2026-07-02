import { createPersistenceRepository } from "../repositoryFactory";

export const productionAutomationRepository = createPersistenceRepository({
  repository: "production_automation",
  entityType: "production_automation_record",
});

export default productionAutomationRepository;

