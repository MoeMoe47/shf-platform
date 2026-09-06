import { createHash } from "node:crypto";
import { CONTEXT_ADMISSION_CODES, INPUT_SECURITY_FINDING_CATEGORIES } from "../model/input-security.js";

export type SecurityFinding = {
  category: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  confidence: "LOW" | "MEDIUM" | "HIGH";
  decisionCode: string;
  excerpt: string;
  startOffset: number;
  endOffset: number;
};

export type SecurityScanResult = {
  scannerProvider: string;
  scannerVersion: string;
  scanStatus: "CLEAR" | "SUSPICIOUS";
  riskLevel: "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  decision: "ALLOW" | "ALLOW_WITH_WARNING" | "REQUIRE_REVIEW" | "QUARANTINE" | "BLOCK";
  reviewRequired: boolean;
  findings: SecurityFinding[];
  contentSha256: string;
};

type PatternRule = {
  category: string;
  severity: SecurityFinding["severity"];
  confidence: SecurityFinding["confidence"];
  decisionCode: string;
  pattern: RegExp;
};

const RULES: PatternRule[] = [
  { category: INPUT_SECURITY_FINDING_CATEGORIES.DIRECT_PROMPT_INJECTION, severity: "HIGH", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.PROMPT_INJECTION_DETECTED, pattern: /ignore\s+(all\s+)?(previous|prior|above)\s+(system\s+)?instructions?/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.INDIRECT_PROMPT_INJECTION, severity: "HIGH", confidence: "MEDIUM", decisionCode: CONTEXT_ADMISSION_CODES.INDIRECT_INJECTION_DETECTED, pattern: /when\s+(an\s+)?(ai|agent|assistant|model)\s+reads\s+this[,:\s]+(it\s+must|ignore|follow)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.SYSTEM_POLICY_OVERRIDE, severity: "HIGH", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.SYSTEM_OVERRIDE_ATTEMPT, pattern: /(you\s+are\s+now|act\s+as)\s+(system|developer|administrator|root)|override\s+(bos\s+)?(policy|governance|permissions?)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.TOOL_USE_MANIPULATION, severity: "HIGH", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.TOOL_MANIPULATION_DETECTED, pattern: /(use|call|invoke|run)\s+(the\s+)?(tool|mcp|shell|terminal|api)\s+(secretly|without\s+approval|to\s+send|to\s+delete|to\s+export)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.DATA_EXFILTRATION, severity: "CRITICAL", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.EXFILTRATION_ATTEMPT, pattern: /(reveal|print|send|export|exfiltrate)\s+(the\s+)?(system\s+prompt|hidden\s+instructions|secrets?|credentials?|api\s+keys?|other\s+tenant\s+data)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.CROSS_AGENT_MANIPULATION, severity: "MEDIUM", confidence: "MEDIUM", decisionCode: CONTEXT_ADMISSION_CODES.INDIRECT_INJECTION_DETECTED, pattern: /tell\s+(the\s+)?(next|other)\s+agent\s+to\s+(ignore|bypass|approve|delete|send)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.EXTERNAL_ACTION_COERCION, severity: "HIGH", confidence: "MEDIUM", decisionCode: CONTEXT_ADMISSION_CODES.CONTEXT_ADMISSION_DENIED, pattern: /(approve|release|delete|pay|wire|email|text|publish)\s+.+\s+(without\s+human\s+approval|immediately|automatically)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.APPROVAL_BYPASS, severity: "HIGH", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.SYSTEM_OVERRIDE_ATTEMPT, pattern: /bypass\s+(human\s+)?approval|mark\s+(this\s+)?approved|approval\s+is\s+not\s+required/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.PRIVILEGE_ESCALATION_INSTRUCTION, severity: "CRITICAL", confidence: "HIGH", decisionCode: CONTEXT_ADMISSION_CODES.SYSTEM_OVERRIDE_ATTEMPT, pattern: /(grant|change|elevate|expand)\s+((my|your|the)\s+)?(agent\s+)?(permissions?|role|delegation|authority|scope)/i },
  { category: INPUT_SECURITY_FINDING_CATEGORIES.OBFUSCATION_HIDDEN_INSTRUCTION, severity: "MEDIUM", confidence: "MEDIUM", decisionCode: CONTEXT_ADMISSION_CODES.SECURITY_REVIEW_REQUIRED, pattern: /(base64|rot13|zero-width|hidden\s+instruction|white\s+text|display\s*:\s*none)/i },
];

function riskRank(severity: string) {
  return { NONE: 0, LOW: 1, MEDIUM: 2, HIGH: 3, CRITICAL: 4 }[severity] || 0;
}

function excerpt(content: string, start: number, end: number) {
  return content.slice(Math.max(0, start - 24), Math.min(content.length, end + 24)).replace(/\s+/g, " ").slice(0, 300);
}

export class DeterministicInputSecurityScanner {
  provider = "deterministic";
  version = "prompt-injection-rules-v1";

  async scan(input: { content: string }) {
    const content = String(input.content || "");
    const findings: SecurityFinding[] = [];
    for (const rule of RULES) {
      const match = rule.pattern.exec(content);
      if (!match) continue;
      findings.push({
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        decisionCode: rule.decisionCode,
        excerpt: excerpt(content, match.index, match.index + match[0].length),
        startOffset: match.index,
        endOffset: match.index + match[0].length,
      });
    }
    const highest = findings.reduce<SecurityScanResult["riskLevel"]>((max, item) => riskRank(item.severity) > riskRank(max) ? item.severity : max, "NONE");
    const hasCritical = findings.some((item) => item.severity === "CRITICAL");
    const hasHigh = findings.some((item) => item.severity === "HIGH");
    return {
      scannerProvider: this.provider,
      scannerVersion: this.version,
      scanStatus: findings.length ? "SUSPICIOUS" : "CLEAR",
      riskLevel: highest,
      decision: hasCritical ? "BLOCK" : hasHigh ? "QUARANTINE" : findings.length ? "REQUIRE_REVIEW" : "ALLOW",
      reviewRequired: findings.length > 0 && !hasCritical,
      findings,
      contentSha256: createHash("sha256").update(content).digest("hex"),
    } satisfies SecurityScanResult;
  }
}

export class UnavailableSemanticScanner {
  provider = "semantic-unavailable";
  version = "unavailable";

  async scan() {
    return {
      scannerProvider: this.provider,
      scannerVersion: this.version,
      scanStatus: "SCANNER_UNAVAILABLE",
      riskLevel: "UNKNOWN",
      decision: "REQUIRE_REVIEW",
      reviewRequired: true,
      findings: [],
      contentSha256: "",
    };
  }
}
