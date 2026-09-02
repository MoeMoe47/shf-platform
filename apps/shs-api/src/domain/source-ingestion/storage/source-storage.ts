import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export interface SourceStorage {
  readonly provider: string;
  put(storageKey: string, content: Buffer): Promise<void>;
  get(storageKey: string): Promise<Buffer>;
  remove(storageKey: string): Promise<void>;
  // Phase 4.6: `put` is deliberately exclusive-create (original uploads
  // are immutable). Extraction artifacts are the one thing this domain
  // legitimately re-derives deterministically from an unchanged source,
  // so idempotent re-processing needs a distinct, explicit overwrite
  // path rather than weakening `put`'s own immutability guarantee.
  putOverwrite(storageKey: string, content: Buffer): Promise<void>;
}

function assertSafeStorageKey(storageKey: string) {
  if (!storageKey || storageKey.includes("..") || path.isAbsolute(storageKey) || storageKey.includes("\\")) {
    throw new Error("unsafe_storage_key");
  }
}

export class LocalPrivateSourceStorage implements SourceStorage {
  readonly provider = "local_private";
  private readonly root: string;

  constructor(root = process.env.SHF_PRIVATE_SOURCE_STORAGE_DIR || path.join("/tmp", "shf-private-source-assets")) {
    this.root = path.resolve(root);
  }

  private resolve(storageKey: string) {
    assertSafeStorageKey(storageKey);
    const target = path.resolve(this.root, storageKey);
    if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) throw new Error("unsafe_storage_key");
    return target;
  }

  async put(storageKey: string, content: Buffer) {
    const target = this.resolve(storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, content, { mode: 0o600, flag: "wx" });
  }

  async get(storageKey: string) {
    return readFile(this.resolve(storageKey));
  }

  async putOverwrite(storageKey: string, content: Buffer) {
    const target = this.resolve(storageKey);
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, content, { mode: 0o600 });
  }

  async remove(storageKey: string) {
    await unlink(this.resolve(storageKey)).catch((error: any) => {
      if (error?.code !== "ENOENT") throw error;
    });
  }
}
