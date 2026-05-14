export interface ExportRecord {
  id: string;
  exportKind: string;
  artifactId: string;
  status: string;
  requestedBy: string;
  createdAt: string;
}

const EXPORT_HISTORY: ExportRecord[] = [];

export function addExport(record: ExportRecord) {
  EXPORT_HISTORY.unshift(record);
  return record;
}

export function getExports() {
  return EXPORT_HISTORY.slice(0, 50);
}
