import { mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { isProductKey, type ProductKey } from "./product-report-contract.js";
import { PRODUCT_BRANDS } from "./report-template-registry.js";

function safeSegment(value: any, fallback: string) {
  const normalized = String(value || fallback).replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^\.+/, "").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}

export function safeReportFilename({ productKey = "civicsure", jurisdiction, reportType, period, version, format, filenamePrefix }: any) {
  if (!isProductKey(productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
  const extension = String(format).toLowerCase();
  const prefix = safeSegment(filenamePrefix || PRODUCT_BRANDS[productKey as ProductKey].filenamePrefix, PRODUCT_BRANDS[productKey as ProductKey].filenamePrefix);
  const name = `${prefix}_${safeSegment(jurisdiction, "scope")}_${safeSegment(reportType, "report")}_${safeSegment(period, "period")}_v${safeSegment(version, "1")}.${extension}`;
  return name.slice(0, 180);
}

export function safeReportStorageReference({ productKey, organizationId, tenantId, artifactId, renderedFileId, format }: any) {
  if (!isProductKey(productKey)) throw new Error("REPORT_PRODUCT_KEY_INVALID");
  return [productKey, organizationId, tenantId, artifactId, `${renderedFileId}.${String(format).toLowerCase()}`]
    .map((segment) => safeSegment(segment, "unknown"))
    .join("/");
}

export class ReportFileStorage {
  constructor(private root = resolveStorageRoot()) {}

  async put(reference: string, bytes: Buffer) {
    const resolved = path.resolve(this.root, reference);
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) throw new Error("REPORT_STORAGE_REFERENCE_INVALID");
    await mkdir(path.dirname(resolved), { recursive: true });
    await writeFile(resolved, bytes, { flag: "wx" });
    return resolved;
  }

  async get(reference: string) {
    const resolved = path.resolve(this.root, reference);
    if (!resolved.startsWith(path.resolve(this.root) + path.sep)) throw new Error("REPORT_STORAGE_REFERENCE_INVALID");
    return readFile(resolved);
  }
}

function resolveStorageRoot() {
  const configured = String(process.env.SHS_REPORT_STORAGE_ROOT || "").trim();
  if (String(process.env.NODE_ENV || "").toLowerCase() === "production" && !configured) throw new Error("SHS_REPORT_STORAGE_ROOT_REQUIRED");
  return configured || path.join(os.tmpdir(), "shs-report-artifacts");
}
