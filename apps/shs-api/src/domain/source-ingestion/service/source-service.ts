import { createHash, randomUUID } from "node:crypto";
import { writeSecurityAuditEvent } from "../../../auth/security-audit.js";
import * as repo from "../repo/source-repo.js";
import { LocalPrivateSourceStorage, SourceStorage } from "../storage/source-storage.js";
import { validateSourceFile } from "./source-validation.js";

export class SourceIngestionError extends Error {
  constructor(public readonly code: string, message: string, public readonly statusCode = 400) {
    super(message);
    this.name = "SourceIngestionError";
  }
}

export type SourceActor = { user_id: string; organization_id: string; tenant_id: string };

function publicAsset(asset: any) {
  const { storage_key: _storageKey, ...safe } = asset;
  return safe;
}

export function toInputSecuritySourceReference(asset: any, version: any) {
  return {
    resourceType: "source_document_version",
    resourceId: String(version.source_document_version_id),
    sourceKind: "SOURCE_DOCUMENT_VERSION",
    sourceRef: String(asset.source_asset_id),
    organizationId: String(asset.organization_id),
    tenantId: String(asset.tenant_id),
    contentType: String(asset.media_type || "application/octet-stream"),
    malwareScanStatus: String(asset.scan_status || "UNAVAILABLE"),
    boundary: "Upload validation, malware scan status, prompt-injection scan, and resource classification remain separate controls.",
  };
}

export async function createSourceAsset(actor: SourceActor, file: any, req: any, storage: SourceStorage = new LocalPrivateSourceStorage()) {
  const validated = validateSourceFile(file);
  const contentHash = createHash("sha256").update(file.buffer).digest("hex");
  const idempotencyKey = String(req?.headers?.["idempotency-key"] || "").trim() || null;
  if (idempotencyKey) {
    const existing = await repo.findAssetByIdempotency(actor.organization_id, idempotencyKey);
    if (existing) return { asset: publicAsset(existing), version: (await repo.listVersions(actor.organization_id, existing.source_asset_id))[0], replayed: true };
  }
  if (await repo.findAssetByHash(actor.organization_id, contentHash)) {
    throw new SourceIngestionError("SOURCE_ASSET_DUPLICATE", "This exact source file already exists for the organization.", 409);
  }

  const sourceAssetId = randomUUID();
  const storageKey = `source-assets/${sourceAssetId}`;
  const version = {
    source_document_version_id: randomUUID(), source_asset_id: sourceAssetId,
    organization_id: actor.organization_id, tenant_id: actor.tenant_id, version_number: 1,
    // Phase 4.6: extraction capability now genuinely exists (see
    // document-extraction-service.ts) — "UNAVAILABLE" would no longer be
    // an honest initial claim. Existing rows created before this phase
    // keep whatever value they already have; this only changes what NEW
    // uploads start at.
    processing_status: "STORED", extraction_status: "NOT_STARTED", parser_version: null,
    metadata: { input_type: validated.type }, created_by_user_id: actor.user_id,
  };
  const asset = {
    source_asset_id: sourceAssetId, organization_id: actor.organization_id, tenant_id: actor.tenant_id,
    uploaded_by_user_id: actor.user_id, original_filename: file.originalname, media_type: validated.mediaType,
    file_extension: validated.extension, byte_size: file.size, content_hash: contentHash,
    storage_provider: storage.provider, storage_key: storageKey, visibility: "PRIVATE", status: "ACTIVE",
    scan_status: "UNAVAILABLE", idempotency_key: idempotencyKey,
  };
  await storage.put(storageKey, file.buffer);
  try {
    const created = await repo.createAssetAndVersion({ asset, version });
    await writeSecurityAuditEvent(req, {
      action_type: "source_asset.uploaded", target_object_type: "source_asset", target_object_id: sourceAssetId,
      new_state_json: { source_asset_id: sourceAssetId, source_document_version_id: version.source_document_version_id,
        content_hash: contentHash, byte_size: file.size, scan_status: "UNAVAILABLE" },
      reason_code: "source_asset_received", reason_text: "Source material received; no malware scanner is configured.",
    });
    return { asset: publicAsset(created.asset), version: created.version, replayed: false };
  } catch (error) {
    await storage.remove(storageKey).catch(() => undefined);
    throw error;
  }
}

export async function downloadSourceAsset(actor: SourceActor, sourceAssetId: string, storage: SourceStorage = new LocalPrivateSourceStorage()) {
  const asset = await repo.getAsset(actor.organization_id, sourceAssetId);
  if (!asset || asset.status !== "ACTIVE") return null;
  return { asset: publicAsset(asset), content: await storage.get(asset.storage_key) };
}

export { getAsset, listAssets, listVersions } from "../repo/source-repo.js";
