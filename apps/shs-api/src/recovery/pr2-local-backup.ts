import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

export type BackupEntry = {
  relativePath: string;
  sha256: string;
  byteSize: number;
  classification: "PRIVATE_FILE" | "REPORT_ARTIFACT" | "EVIDENCE_ARTIFACT";
  contentBase64: string;
};

export type LocalBackupArchive = {
  schema: "shs.pr2.local-backup.v1";
  createdAt: string;
  sourceRootLabel: string;
  entries: BackupEntry[];
};

function sha256(buffer: Buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function assertSafeRelativePath(relativePath: string) {
  const normalized = String(relativePath || "").replaceAll("\\", "/");
  if (!normalized || normalized.startsWith("/") || normalized.includes("..") || path.isAbsolute(normalized)) {
    throw new Error("backup_path_unsafe");
  }
  return normalized;
}

async function walk(root: string, dir = root): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const current = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(root, current);
    if (entry.isFile()) return [path.relative(root, current)];
    return [];
  }));
  return files.flat();
}

export async function createLocalFileBackup(input: {
  sourceRoot: string;
  archivePath: string;
  sourceRootLabel?: string;
  classification?: BackupEntry["classification"];
}) {
  const sourceRoot = path.resolve(input.sourceRoot);
  const archivePath = path.resolve(input.archivePath);
  const files = await walk(sourceRoot);
  const entries: BackupEntry[] = [];
  for (const relative of files) {
    const safe = assertSafeRelativePath(relative);
    const content = await readFile(path.join(sourceRoot, safe));
    entries.push({
      relativePath: safe,
      sha256: sha256(content),
      byteSize: content.length,
      classification: input.classification || "PRIVATE_FILE",
      contentBase64: content.toString("base64"),
    });
  }
  const archive: LocalBackupArchive = {
    schema: "shs.pr2.local-backup.v1",
    createdAt: new Date().toISOString(),
    sourceRootLabel: input.sourceRootLabel || "local-file-store",
    entries: entries.sort((a, b) => a.relativePath.localeCompare(b.relativePath)),
  };
  await mkdir(path.dirname(archivePath), { recursive: true, mode: 0o700 });
  await writeFile(archivePath, JSON.stringify(archive, null, 2), { mode: 0o600, flag: "wx" });
  return archive;
}

export async function restoreLocalFileBackup(input: { archivePath: string; targetRoot: string }) {
  const archive = JSON.parse(await readFile(input.archivePath, "utf8")) as LocalBackupArchive;
  if (archive.schema !== "shs.pr2.local-backup.v1") throw new Error("backup_schema_unsupported");
  const targetRoot = path.resolve(input.targetRoot);
  await mkdir(targetRoot, { recursive: true, mode: 0o700 });
  for (const entry of archive.entries) {
    const relative = assertSafeRelativePath(entry.relativePath);
    const content = Buffer.from(entry.contentBase64, "base64");
    if (sha256(content) !== entry.sha256 || content.length !== entry.byteSize) throw new Error("backup_entry_integrity_failed");
    const target = path.resolve(targetRoot, relative);
    if (target !== targetRoot && !target.startsWith(`${targetRoot}${path.sep}`)) throw new Error("backup_path_unsafe");
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await writeFile(target, content, { mode: 0o600, flag: "wx" });
  }
  return { restoredCount: archive.entries.length, archive };
}

export async function verifyRestoredBackup(input: { archivePath: string; targetRoot: string }) {
  const archive = JSON.parse(await readFile(input.archivePath, "utf8")) as LocalBackupArchive;
  for (const entry of archive.entries) {
    const content = await readFile(path.join(input.targetRoot, assertSafeRelativePath(entry.relativePath)));
    if (sha256(content) !== entry.sha256 || content.length !== entry.byteSize) throw new Error("restored_backup_integrity_failed");
  }
  return { verifiedCount: archive.entries.length };
}

export function databaseBackupPlan(env: NodeJS.ProcessEnv = process.env) {
  const outputDir = String(env.SHF_BACKUP_OUTPUT_DIR || "").trim();
  if (!outputDir) throw new Error("SHF_BACKUP_OUTPUT_DIR_REQUIRED");
  return {
    command: "pg_dump",
    args: ["--format=custom", "--no-owner", "--no-privileges", "--file", path.join(outputDir, "shs-db.backup")],
    secretHandling: "DATABASE_URL is supplied by the process environment and is never printed by this plan.",
    restoreCommand: "pg_restore",
    restoreArgs: ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname", "$RESTORE_DATABASE_URL", path.join(outputDir, "shs-db.backup")],
  };
}
