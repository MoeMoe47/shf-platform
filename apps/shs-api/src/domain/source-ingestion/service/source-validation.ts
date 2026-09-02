import path from "node:path";

export const SOURCE_MAX_BYTES = 25 * 1024 * 1024;

export type AcceptedSourceType = "PDF" | "DOCX" | "TXT" | "MARKDOWN";

export class SourceValidationError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = "SourceValidationError";
  }
}

function extensionOf(filename: string) {
  return path.extname(filename).toLowerCase();
}

function hasZipSignature(content: Buffer) {
  return content.length >= 4 && content[0] === 0x50 && content[1] === 0x4b && content[2] === 0x03 && content[3] === 0x04;
}

export function validateSourceFile(file: { originalname: string; mimetype: string; size: number; buffer: Buffer }) {
  const filename = String(file.originalname || "");
  if (!filename || filename.includes("\0") || filename !== path.basename(filename) || filename.includes("..")) {
    throw new SourceValidationError("UNSAFE_FILENAME", "Filename contains an unsafe path component.");
  }
  if (!file.buffer || file.size !== file.buffer.length || file.size <= 0 || file.size > SOURCE_MAX_BYTES) {
    throw new SourceValidationError("FILE_TOO_LARGE_OR_EMPTY", "File is empty or exceeds the 25 MB limit.");
  }

  const extension = extensionOf(filename);
  const mime = String(file.mimetype || "").toLowerCase();
  let type: AcceptedSourceType;
  if (extension === ".pdf" && mime === "application/pdf" && file.buffer.subarray(0, 5).toString("ascii") === "%PDF-") type = "PDF";
  else if (extension === ".docx" && mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && hasZipSignature(file.buffer)) type = "DOCX";
  else if (extension === ".txt" && mime === "text/plain" && !file.buffer.includes(0)) type = "TXT";
  else if ((extension === ".md" || extension === ".markdown") && (mime === "text/markdown" || mime === "text/plain") && !file.buffer.includes(0)) type = "MARKDOWN";
  else throw new SourceValidationError("UNSUPPORTED_FILE", "Only validated PDF, DOCX, TXT, and Markdown files are accepted.");

  return { extension, type, mediaType: mime };
}
