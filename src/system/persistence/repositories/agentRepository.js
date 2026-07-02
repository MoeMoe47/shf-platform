import { createPersistenceRepository } from "../repositoryFactory";

export const agentRepository = createPersistenceRepository({
  repository: "agents",
  entityType: "agent_record",
});

export default agentRepository;

