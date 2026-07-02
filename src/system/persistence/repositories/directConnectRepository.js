import { createPersistenceRepository } from "../repositoryFactory";

export const directConnectRepository = createPersistenceRepository({
  repository: "direct_connect",
  entityType: "direct_connect_record",
  idField: "connectionId",
});

export default directConnectRepository;

