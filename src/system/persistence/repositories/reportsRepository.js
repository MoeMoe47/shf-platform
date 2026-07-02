import { createPersistenceRepository } from "../repositoryFactory";

export const reportsRepository = createPersistenceRepository({
  repository: "reports",
  entityType: "report_record",
  idField: "report_id",
});

export default reportsRepository;

