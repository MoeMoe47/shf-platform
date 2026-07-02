import { PERSISTENCE_ADAPTERS } from "./persistenceTypes";

const memoryStore = new Map();

function readJson(raw, fallback) {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function localKey(namespace) {
  return `shs:persistence:v1:${namespace}`;
}

export function createLocalStorageAdapter() {
  return {
    name: PERSISTENCE_ADAPTERS.LOCAL,
    enabled: true,
    read(namespace, fallback = []) {
      if (typeof window === "undefined" || !window.localStorage) return fallback;
      return readJson(window.localStorage.getItem(localKey(namespace)), fallback);
    },
    write(namespace, value) {
      if (typeof window === "undefined" || !window.localStorage) return value;
      window.localStorage.setItem(localKey(namespace), JSON.stringify(value));
      return value;
    },
    remove(namespace) {
      if (typeof window === "undefined" || !window.localStorage) return;
      window.localStorage.removeItem(localKey(namespace));
    },
  };
}

export function createMemoryAdapter() {
  return {
    name: PERSISTENCE_ADAPTERS.MEMORY,
    enabled: true,
    read(namespace, fallback = []) {
      return memoryStore.has(namespace) ? memoryStore.get(namespace) : fallback;
    },
    write(namespace, value) {
      memoryStore.set(namespace, value);
      return value;
    },
    remove(namespace) {
      memoryStore.delete(namespace);
    },
  };
}

export function createDatabaseAdapter() {
  return {
    name: PERSISTENCE_ADAPTERS.DATABASE_PLACEHOLDER,
    enabled: false,
    read() {
      throw new Error("Database adapter is not enabled in Persistence V1.");
    },
    write() {
      throw new Error("Database adapter is not enabled in Persistence V1.");
    },
    remove() {
      throw new Error("Database adapter is not enabled in Persistence V1.");
    },
  };
}

export function createPersistenceAdapter(adapterName = PERSISTENCE_ADAPTERS.LOCAL) {
  if (adapterName === PERSISTENCE_ADAPTERS.MEMORY) return createMemoryAdapter();
  if (adapterName === PERSISTENCE_ADAPTERS.DATABASE_PLACEHOLDER) return createDatabaseAdapter();
  return createLocalStorageAdapter();
}

