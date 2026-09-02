import { pool, query } from "../../../db/client.js";

export type SourceAssetRecord = Record<string, any>;
type QueryExecutor = { query: typeof query };

export async function findAssetByIdempotency(organizationId: string, idempotencyKey: string, executor: QueryExecutor = { query }) {
  const result = await executor.query("SELECT * FROM source_assets WHERE organization_id = $1 AND idempotency_key = $2", [organizationId, idempotencyKey]);
  return result.rows[0] || null;
}

export async function findAssetByHash(organizationId: string, contentHash: string, executor: QueryExecutor = { query }) {
  const result = await executor.query("SELECT * FROM source_assets WHERE organization_id = $1 AND content_hash = $2", [organizationId, contentHash]);
  return result.rows[0] || null;
}

export async function createAssetAndVersion(input: {
  asset: SourceAssetRecord;
  version: SourceAssetRecord;
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const assetResult = await client.query(
      `INSERT INTO source_assets
       (source_asset_id, organization_id, tenant_id, uploaded_by_user_id, original_filename,
        media_type, file_extension, byte_size, content_hash, storage_provider, storage_key,
        visibility, status, scan_status, idempotency_key)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
      [input.asset.source_asset_id, input.asset.organization_id, input.asset.tenant_id, input.asset.uploaded_by_user_id,
        input.asset.original_filename, input.asset.media_type, input.asset.file_extension, input.asset.byte_size,
        input.asset.content_hash, input.asset.storage_provider, input.asset.storage_key, input.asset.visibility,
        input.asset.status, input.asset.scan_status, input.asset.idempotency_key],
    );
    const versionResult = await client.query(
      `INSERT INTO source_document_versions
       (source_document_version_id, source_asset_id, organization_id, tenant_id, version_number,
        processing_status, extraction_status, parser_version, metadata, created_by_user_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10)
       RETURNING *`,
      [input.version.source_document_version_id, input.version.source_asset_id, input.version.organization_id,
        input.version.tenant_id, input.version.version_number, input.version.processing_status,
        input.version.extraction_status, input.version.parser_version, JSON.stringify(input.version.metadata || {}),
        input.version.created_by_user_id],
    );
    await client.query("COMMIT");
    return { asset: assetResult.rows[0], version: versionResult.rows[0] };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function listAssets(organizationId: string, executor: QueryExecutor = { query }) {
  const result = await executor.query("SELECT * FROM source_assets WHERE organization_id = $1 ORDER BY created_at DESC", [organizationId]);
  return result.rows;
}

export async function getAsset(organizationId: string, sourceAssetId: string, executor: QueryExecutor = { query }) {
  const result = await executor.query("SELECT * FROM source_assets WHERE organization_id = $1 AND source_asset_id = $2", [organizationId, sourceAssetId]);
  return result.rows[0] || null;
}

export async function listVersions(organizationId: string, sourceAssetId: string, executor: QueryExecutor = { query }) {
  const result = await executor.query("SELECT * FROM source_document_versions WHERE organization_id = $1 AND source_asset_id = $2 ORDER BY version_number DESC", [organizationId, sourceAssetId]);
  return result.rows;
}

// Phase 4.6: a single, org-scoped version lookup — every prior consumer
// only ever needed the whole per-asset list.
export async function getVersion(organizationId: string, sourceDocumentVersionId: string, executor: QueryExecutor = { query }) {
  const result = await executor.query(
    "SELECT * FROM source_document_versions WHERE organization_id = $1 AND source_document_version_id = $2",
    [organizationId, sourceDocumentVersionId],
  );
  return result.rows[0] || null;
}

// Phase 4.6: persists extraction outcome. error/warning detail lives in
// the existing `metadata` JSONB column (merged, not replaced) rather
// than a new column — Step 12 only requires the error be "safe and
// diagnosable," which a metadata field already satisfies.
export async function updateVersionProcessing(
  organizationId: string,
  sourceDocumentVersionId: string,
  fields: {
    processingStatus: string;
    extractionStatus: string;
    parserVersion?: string | null;
    extractedTextLocation?: string | null;
    derivedHash?: string | null;
    metadataPatch?: Record<string, unknown>;
  },
  executor: QueryExecutor = { query },
) {
  const result = await executor.query(
    `UPDATE source_document_versions SET
       processing_status = $3,
       extraction_status = $4,
       parser_version = CASE WHEN $5::boolean THEN $6 ELSE parser_version END,
       extracted_text_location = CASE WHEN $7::boolean THEN $8 ELSE extracted_text_location END,
       derived_hash = CASE WHEN $9::boolean THEN $10 ELSE derived_hash END,
       metadata = metadata || $11::jsonb,
       updated_at = NOW()
     WHERE organization_id = $1 AND source_document_version_id = $2
     RETURNING *`,
    [
      organizationId, sourceDocumentVersionId, fields.processingStatus, fields.extractionStatus,
      fields.parserVersion !== undefined, fields.parserVersion ?? null,
      fields.extractedTextLocation !== undefined, fields.extractedTextLocation ?? null,
      fields.derivedHash !== undefined, fields.derivedHash ?? null,
      JSON.stringify(fields.metadataPatch ?? {}),
    ],
  );
  return result.rows[0] || null;
}
