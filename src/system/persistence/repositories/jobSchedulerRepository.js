import { createCriticalStateRepository } from "./criticalStateRepositoryFactory";

export const jobSchedulerRepository = createCriticalStateRepository({
  repository: "job_scheduler",
  entityType: "job_record",
  idField: "job_id",
});

export default jobSchedulerRepository;
