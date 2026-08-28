#!/usr/bin/env python3
"""Independent certification validator for Package H Batch 03 IGLS-1 Phase 7.

This validator is intentionally adversarial: it collects every finding it can
discover, then decides certification state only after all validation groups run.
It never writes to the repository.
"""

from __future__ import annotations

import ast
import json
import os
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
PHASE_ROOT = ROOT / "docs" / "releases"
PHASE7 = PHASE_ROOT / "PACKAGE_H_BATCH_03_PHASE_7"
EPL1 = ROOT / "docs" / "governance" / "EPL_1"
IMPLEMENTATION_FILE = ROOT / "services" / "shf-agent-fabric" / "services" / "extension_kernel" / "runtime_owner_closure.py"
EXPORT_FILE = ROOT / "services" / "shf-agent-fabric" / "services" / "extension_kernel" / "__init__.py"

VALIDATOR_ID = "PACKAGE_H_BATCH_03_PHASE_7_CERTIFICATION_VALIDATOR"
VALID_STATE = "PACKAGE_H_BATCH_03_PHASE_7_VALID"
INVALID_STATE = "PACKAGE_H_BATCH_03_PHASE_7_INVALID"
REVIEW_STATE = "PACKAGE_H_BATCH_03_PHASE_7_REQUIRES_CONSTITUTIONAL_REVIEW"
AUTHORIZED_CAPABILITIES = {"B03-CAP-001", "B03-CAP-002", "B03-CAP-003", "B03-CAP-004"}
EXPECTED_PHASE8 = "IGLS-1 Phase 8 - PUBLICATION_AUTHORIZATION"
EXPECTED_PHASE7_ARTIFACTS = {
    "INDEPENDENT_IMPLEMENTATION_CERTIFICATION": "IIC-1",
    "IMPLEMENTATION_CONFORMANCE_CERTIFICATE": "ICC-1",
    "INDEPENDENT_CERTIFICATION_ASSESSMENT": "ICA-1",
    "IMPLEMENTATION_VERIFICATION_MATRIX": "IVM-1",
    "IMPLEMENTATION_EVIDENCE_VERIFICATION": "IEMV-1",
    "CONSTITUTIONAL_TRACEABILITY_VERIFICATION": "CTV-1",
    "ARCHITECTURE_REVIEW_VERIFICATION": "ARV-1",
    "OWNERSHIP_CONFORMANCE_VERIFICATION": "OCV-1",
    "REPOSITORY_CONFORMANCE_VERIFICATION": "RCV-1",
    "CERTIFICATION_FINDINGS_SUMMARY": "CFS-1",
    "NON_CONFORMANCE_REGISTER": "NCR-1",
    "CORRECTIVE_ACTION_REGISTER": "CAR-1",
    "INDEPENDENT_CERTIFICATION_REPORT": "ICR-1",
    "PACKAGE_H_BATCH_03_PHASE_7_MANIFEST": "P7M-1",
}
REQUIRED_PHASE_DIRS = {
    "Phase 1": "PACKAGE_H_BATCH_03_PHASE_1",
    "Phase 2": "PACKAGE_H_BATCH_03_PHASE_2",
    "Phase 3": "PACKAGE_H_BATCH_03_PHASE_3",
    "Phase 4": "PACKAGE_H_BATCH_03_PHASE_4",
    "Phase 5": "PACKAGE_H_BATCH_03_PHASE_5",
    "Phase 6": "PACKAGE_H_BATCH_03_PHASE_6",
    "Phase 7": "PACKAGE_H_BATCH_03_PHASE_7",
}
MANDATORY_VALIDATORS = [
    ("Phase 1 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_1.py"]),
    ("Phase 2 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_2.py"]),
    ("Phase 3 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_3.py"]),
    ("Phase 4 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_4.py"]),
    ("Phase 5 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_5.py"]),
    ("Phase 6 validator", [sys.executable, "scripts/check_package_h_batch_03_phase_6.py"]),
    ("EPL-1 validator", [sys.executable, "scripts/check_epl_1.py"]),
    ("IGLS-1 validator", [sys.executable, "scripts/check_igls_1.py"]),
    ("Master Layer Registry validator", [sys.executable, "scripts/check_master_layer_registry.py"]),
    ("Architecture Proposal validator", [sys.executable, "scripts/check_architecture_proposal.py"]),
    ("Layer Audit validator", [sys.executable, "scripts/check_shs_bos_v1_layer_audit.py"]),
    ("Layer Family validator", [sys.executable, "scripts/check_shs_bos_layer_family_architecture.py"]),
    ("Manifest validator", ["node", "scripts/validate-manifests.mjs"]),
]
FOCUSED_TESTS = [
    ("Phase 7 focused tests", [sys.executable, "-m", "pytest", "-q", "tests/test_package_h_batch_03_phase_7.py"]),
    ("Phase 6 focused tests", [sys.executable, "-m", "pytest", "-q", "tests/test_package_h_batch_03_phase_6.py"]),
    (
        "Extension kernel regressions",
        [
            sys.executable,
            "-m",
            "pytest",
            "-q",
            "-p",
            "no:cacheprovider",
            "services/shf-agent-fabric/tests/test_extension_kernel_foundation.py",
            "services/shf-agent-fabric/tests/test_extension_kernel_owner_onboarding.py",
            "services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
        ],
    ),
    (
        "Implementation regressions",
        [
            sys.executable,
            "-m",
            "pytest",
            "-q",
            "-p",
            "no:cacheprovider",
            "services/shf-agent-fabric/tests/test_extension_kernel_runtime_owner_closure.py",
        ],
    ),
]
CONSTITUTIONAL_REVIEW_TRIGGERS = {
    "architecture_redesign_occurred",
    "new_constitutional_layer_created",
    "new_layer_created",
    "new_canonical_owner_created",
    "new_registry_created",
    "duplicate_evidence_authority_created",
    "duplicate_runtime_owner_created",
    "deployment_authorized",
    "production_release_authorized",
    "operational_activation_authorized",
    "architecture_expansion_authorized",
    "new_capabilities_authorized",
}


@dataclass(frozen=True)
class Finding:
    group: str
    severity: str
    artifact: str
    path: str
    expected: str
    observed: str
    requirement: str
    recommendation: str
    certification_impact: str

    def as_dict(self) -> dict[str, str]:
        return {
            "validator_id": VALIDATOR_ID,
            "group": self.group,
            "severity": self.severity,
            "artifact": self.artifact,
            "repository_path": self.path,
            "expected": self.expected,
            "observed": self.observed,
            "requirement": self.requirement,
            "recommendation": self.recommendation,
            "certification_impact": self.certification_impact,
        }


class CertificationValidator:
    def __init__(self, root: Path = ROOT) -> None:
        self.root = root
        self.findings: list[Finding] = []
        self.groups_passed: list[str] = []
        self.artifacts: dict[str, dict[str, Any]] = {}
        self.phase6: dict[str, dict[str, Any]] = {}

    def add(
        self,
        group: str,
        severity: str,
        artifact: str,
        path: Path | str,
        expected: str,
        observed: str,
        requirement: str,
        recommendation: str,
        certification_impact: str,
    ) -> None:
        rel = str(path)
        if isinstance(path, Path):
            try:
                rel = str(path.relative_to(self.root))
            except ValueError:
                rel = str(path)
        self.findings.append(
            Finding(group, severity, artifact, rel, expected, observed, requirement, recommendation, certification_impact)
        )

    def pass_group_if_clean(self, group: str, before_count: int) -> None:
        if len(self.findings) == before_count:
            self.groups_passed.append(group)

    def read_json(self, path: Path, group: str, artifact: str) -> dict[str, Any] | None:
        try:
            return json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError:
            self.add(group, "Critical", artifact, path, "file exists", "missing", "mandatory JSON artifact", "Create the required artifact through a governed certification mission.", "BLOCKS_CERTIFICATION")
        except json.JSONDecodeError as exc:
            self.add(group, "Critical", artifact, path, "valid JSON", str(exc), "JSON integrity", "Repair JSON through governed correction and revalidate.", "BLOCKS_CERTIFICATION")
        return None

    def discover_phase_dir(self, phase_name: str, folder: str) -> Path:
        path = self.root / "docs" / "releases" / folder
        return path

    def run_command(self, label: str, command: list[str], group: str, timeout: int = 120) -> None:
        env = {**os.environ, "PYTHONDONTWRITEBYTECODE": "1", "PYTEST_ADDOPTS": "-p no:cacheprovider"}
        try:
            result = subprocess.run(command, cwd=self.root, env=env, capture_output=True, text=True, timeout=timeout, check=False)
        except FileNotFoundError as exc:
            self.add(group, "Critical", label, command[0], "command executable", f"missing: {exc}", "mandatory execution chain", "Install or restore the required local executable.", "BLOCKS_CERTIFICATION")
            return
        except subprocess.TimeoutExpired:
            self.add(group, "Critical", label, " ".join(command), "command completes deterministically", f"timeout after {timeout}s", "mandatory execution chain", "Make the command bounded and re-run certification.", "BLOCKS_CERTIFICATION")
            return
        if result.returncode != 0:
            observed = (result.stdout + result.stderr).strip()[-1200:] or f"exit code {result.returncode}"
            self.add(group, "Critical", label, " ".join(command), "exit code 0", observed, "mandatory execution chain", "Fix failing validator/test before certification.", "BLOCKS_CERTIFICATION")

    def validate_repository_integrity(self) -> None:
        group = "GROUP 1 Repository Integrity"
        before = len(self.findings)
        for phase_name, folder in REQUIRED_PHASE_DIRS.items():
            path = self.discover_phase_dir(phase_name, folder)
            if not path.is_dir():
                self.add(group, "Critical", phase_name, path, "required phase directory exists", "missing", "repository structure", "Restore the canonical phase package.", "BLOCKS_CERTIFICATION")
        if not EPL1.is_dir():
            self.add(group, "Critical", "EPL-1", EPL1, "EPL-1 directory exists", "missing", "evidence authority", "Restore EPL-1 governance package.", "BLOCKS_CERTIFICATION")
        duplicates = []
        for phase_name, folder in REQUIRED_PHASE_DIRS.items():
            matches = sorted((self.root / "docs" / "releases").glob(f"{folder}*"))
            if len([item for item in matches if item.is_dir()]) > 1:
                duplicates.append(phase_name)
        if duplicates:
            self.add(group, "Major", "phase directories", "docs/releases", "one canonical directory per phase", ", ".join(duplicates), "duplicate Phase folders", "Resolve duplicate phase package topology.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_artifact_completeness(self) -> None:
        group = "GROUP 2 Artifact Completeness"
        before = len(self.findings)
        for artifact, artifact_id in EXPECTED_PHASE7_ARTIFACTS.items():
            for suffix in (".json", ".md"):
                path = PHASE7 / f"{artifact}{suffix}"
                if not path.exists():
                    self.add(group, "Critical", artifact, path, f"{artifact}{suffix} exists", "missing", "mandatory Phase 7 paired artifact", "Create the missing certification artifact.", "BLOCKS_CERTIFICATION")
            data = self.read_json(PHASE7 / f"{artifact}.json", group, artifact)
            if data is not None:
                self.artifacts[artifact] = data
        if not (self.root / "scripts" / "check_package_h_batch_03_phase_7.py").exists():
            self.add(group, "Critical", "Phase 7 validator", "scripts/check_package_h_batch_03_phase_7.py", "validator exists", "missing", "mandatory validator", "Restore validator.", "BLOCKS_CERTIFICATION")
        if not (self.root / "tests" / "test_package_h_batch_03_phase_7.py").exists():
            self.add(group, "Critical", "Phase 7 tests", "tests/test_package_h_batch_03_phase_7.py", "focused tests exist", "missing", "mandatory focused tests", "Create focused Phase 7 tests.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_json_integrity(self) -> None:
        group = "GROUP 3 JSON Integrity"
        before = len(self.findings)
        for artifact, artifact_id in EXPECTED_PHASE7_ARTIFACTS.items():
            data = self.artifacts.get(artifact)
            if data is None:
                continue
            if data.get("schema_version") != "1.0":
                self.add(group, "Major", artifact, PHASE7 / f"{artifact}.json", "schema_version 1.0", str(data.get("schema_version")), "schema consistency", "Correct schema_version.", "BLOCKS_CERTIFICATION")
            if data.get("artifact_id") != artifact_id:
                self.add(group, "Critical", artifact, PHASE7 / f"{artifact}.json", artifact_id, str(data.get("artifact_id")), "artifact identity", "Correct artifact_id.", "BLOCKS_CERTIFICATION")
            if data.get("artifact") != artifact:
                self.add(group, "Critical", artifact, PHASE7 / f"{artifact}.json", artifact, str(data.get("artifact")), "artifact identity", "Correct artifact field.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_markdown_consistency(self) -> None:
        group = "GROUP 4 Markdown Consistency"
        before = len(self.findings)
        for artifact, artifact_id in EXPECTED_PHASE7_ARTIFACTS.items():
            path = PHASE7 / f"{artifact}.md"
            if not path.exists():
                continue
            text = path.read_text(encoding="utf-8")
            if artifact_id not in text:
                self.add(group, "Moderate", artifact, path, f"Markdown references {artifact_id}", "artifact id not found", "Markdown/JSON identity alignment", "Add artifact ID to Markdown.", "BLOCKS_CERTIFICATION")
            title_words = artifact.replace("_", " ").title().split()
            if title_words and title_words[0] not in text:
                self.add(group, "Minor", artifact, path, "Markdown title aligns with artifact role", "title alignment weak", "Markdown consistency", "Align Markdown heading with artifact role.", "NON_BLOCKING")
        self.pass_group_if_clean(group, before)

    def load_phase6(self) -> None:
        group = "Phase 6 Discovery"
        for name in (
            "PACKAGE_H_BATCH_03_PHASE_6_MANIFEST",
            "CAPABILITY_IMPLEMENTATION_REGISTER",
            "IMPLEMENTATION_TRACEABILITY_MATRIX",
            "IMPLEMENTATION_EVIDENCE_MATRIX",
            "EPL_1_PHASE_6_REGISTRATION_MAPPING",
            "PHASE_6_SCOPE_INTEGRITY_REPORT",
            "PHASE_6_CERTIFICATION_READINESS_REPORT",
        ):
            path = self.root / "docs" / "releases" / "PACKAGE_H_BATCH_03_PHASE_6" / f"{name}.json"
            data = self.read_json(path, group, name)
            if data is not None:
                self.phase6[name] = data

    def validate_implementation_authorization(self) -> None:
        group = "GROUP 5 Implementation Authorization"
        before = len(self.findings)
        register = self.phase6.get("CAPABILITY_IMPLEMENTATION_REGISTER", {})
        caps = {item.get("capability_id") for item in register.get("capabilities", [])}
        if caps != AUTHORIZED_CAPABILITIES:
            self.add(group, "Critical", "P6CIR-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/CAPABILITY_IMPLEMENTATION_REGISTER.json", str(sorted(AUTHORIZED_CAPABILITIES)), str(sorted(caps)), "only authorized capabilities implemented", "Remove unauthorized capability or complete missing authorized capability.", "BLOCKS_CERTIFICATION")
        if register.get("unauthorized_capabilities_implemented"):
            self.add(group, "Critical", "P6CIR-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/CAPABILITY_IMPLEMENTATION_REGISTER.json", "no unauthorized capability IDs", str(register.get("unauthorized_capabilities_implemented")), "implementation authorization", "Remove unauthorized implementations.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_ctb_conformance(self) -> None:
        group = "GROUP 6 CTB Conformance"
        before = len(self.findings)
        trace = self.phase6.get("IMPLEMENTATION_TRACEABILITY_MATRIX", {})
        for row in trace.get("rows", []):
            cap = row.get("ctb_1_capability")
            for field in ("ctb_1_capability", "bdl_1_decision", "irs_1_requirement", "implementation_symbol"):
                if not row.get(field):
                    self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", f"{field} present", "missing", "CTB/BDL/IRS conformance", "Complete implementation traceability.", "BLOCKS_CERTIFICATION")
            if cap not in AUTHORIZED_CAPABILITIES:
                self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", "authorized CTB capability", str(cap), "no orphan implementation", "Remove or reauthorize orphan implementation.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_acceptance(self) -> None:
        group = "GROUP 7 Acceptance Verification"
        before = len(self.findings)
        trace = self.phase6.get("IMPLEMENTATION_TRACEABILITY_MATRIX", {})
        acs = {row.get("acs_1_acceptance_criterion") for row in trace.get("rows", [])}
        expected = {"ACS-1-001", "ACS-1-002", "ACS-1-003", "ACS-1-004"}
        if acs != expected:
            self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", str(sorted(expected)), str(sorted(acs)), "all ACS criteria mapped", "Map every ACS-1 criterion.", "BLOCKS_CERTIFICATION")
        for row in trace.get("rows", []):
            if not row.get("test") or row.get("result") != "PASS":
                self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", "tested PASS acceptance row", str(row), "acceptance verification", "Add passing tests and result evidence.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_evidence(self) -> None:
        group = "GROUP 8 Evidence Verification"
        before = len(self.findings)
        matrix = self.phase6.get("IMPLEMENTATION_EVIDENCE_MATRIX", {})
        records = matrix.get("evidence_records", [])
        expected_ids = {f"P6-EV-00{i}" for i in range(1, 5)}
        ids = {item.get("evidence_id") for item in records}
        if ids != expected_ids:
            self.add(group, "Critical", "P6IEM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_EVIDENCE_MATRIX.json", str(sorted(expected_ids)), str(sorted(ids)), "required P6 evidence count and IDs", "Produce all required implementation evidence.", "BLOCKS_CERTIFICATION")
        for item in records:
            for field in ("capability_id", "acceptance_criterion_id", "evidence_requirement_id", "repository_path", "test_reference", "validator"):
                if not item.get(field):
                    self.add(group, "Critical", "P6IEM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_EVIDENCE_MATRIX.json", f"{field} present", "missing", "evidence completeness", "Complete evidence record.", "BLOCKS_CERTIFICATION")
            if item.get("actual_result") != "PASS":
                self.add(group, "Critical", "P6IEM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_EVIDENCE_MATRIX.json", "actual_result PASS", str(item.get("actual_result")), "evidence integrity", "Re-run evidence and correct failing implementation.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_epl(self) -> None:
        group = "GROUP 9 EPL Verification"
        before = len(self.findings)
        mapping = self.phase6.get("EPL_1_PHASE_6_REGISTRATION_MAPPING", {})
        evidence_ids = {item.get("evidence_id") for item in self.phase6.get("IMPLEMENTATION_EVIDENCE_MATRIX", {}).get("evidence_records", [])}
        mapped = {item.get("evidence_id") for item in mapping.get("evidence_records", [])}
        if mapped != evidence_ids:
            self.add(group, "Critical", "P6ERP-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/EPL_1_PHASE_6_REGISTRATION_MAPPING.json", str(sorted(evidence_ids)), str(sorted(mapped)), "every evidence record maps to EPL-1", "Complete EPL mapping.", "BLOCKS_CERTIFICATION")
        if mapping.get("creates_new_evidence_system") is not False or mapping.get("registration_authority") != "EPL-1":
            self.add(group, "Critical", "P6ERP-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/EPL_1_PHASE_6_REGISTRATION_MAPPING.json", "EPL-1 only", f"creates_new_evidence_system={mapping.get('creates_new_evidence_system')} authority={mapping.get('registration_authority')}", "no duplicate evidence authority", "Remove duplicate evidence authority.", "REQUIRES_CONSTITUTIONAL_REVIEW")
        self.pass_group_if_clean(group, before)

    def validate_traceability(self) -> None:
        group = "GROUP 10 Traceability Verification"
        before = len(self.findings)
        trace = self.phase6.get("IMPLEMENTATION_TRACEABILITY_MATRIX", {})
        for key in ("untraceable_symbols", "unmapped_acceptance_criteria", "orphan_evidence_requirements"):
            if trace.get(key):
                self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", f"{key} empty", str(trace.get(key)), "complete constitutional traceability", "Resolve traceability gap.", "BLOCKS_CERTIFICATION")
        for row in trace.get("rows", []):
            required = ("mission_requirement", "architecture_rule", "ctb_1_capability", "bdl_1_decision", "acs_1_acceptance_criterion", "implementation_file", "implementation_symbol", "test", "evidence_record")
            missing = [field for field in required if not row.get(field)]
            if missing:
                self.add(group, "Critical", "P6ITM-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/IMPLEMENTATION_TRACEABILITY_MATRIX.json", "full chain fields present", str(missing), "Mission-to-certification traceability", "Complete traceability row.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_ownership_architecture_runtime(self) -> None:
        checks = [
            ("GROUP 11 Ownership Verification", {"new_canonical_owner_created", "duplicate_evidence_authority_created", "duplicate_runtime_owner_created"}),
            ("GROUP 12 Architecture Verification", {"architecture_redesign_occurred", "new_constitutional_layer_created", "new_registry_created", "api_route_created"}),
            ("GROUP 13 Runtime Minimalism", {"runtime_behavior_introduced_by_phase7", "deployment_performed", "publication_performed", "production_release_performed", "deployment_configuration_created", "ui_surface_created", "persistence_created"}),
        ]
        scope = self.phase6.get("PHASE_6_SCOPE_INTEGRITY_REPORT", {})
        for group, keys in checks:
            before = len(self.findings)
            for key in keys:
                if scope.get(key) is True:
                    impact = "REQUIRES_CONSTITUTIONAL_REVIEW" if key in CONSTITUTIONAL_REVIEW_TRIGGERS else "BLOCKS_CERTIFICATION"
                    self.add(group, "Critical", "P6SIR-1", "docs/releases/PACKAGE_H_BATCH_03_PHASE_6/PHASE_6_SCOPE_INTEGRITY_REPORT.json", f"{key}=false", "true", group, "Remove unauthorized scope expansion and revalidate.", impact)
            self.pass_group_if_clean(group, before)

    def validate_validator_chain(self) -> None:
        group = "GROUP 14 Validator Chain"
        before = len(self.findings)
        for label, command in MANDATORY_VALIDATORS:
            self.run_command(label, command, group)
        self.pass_group_if_clean(group, before)

    def validate_focused_test_chain(self) -> None:
        group = "GROUP 15 Focused Test Chain"
        before = len(self.findings)
        for label, command in FOCUSED_TESTS:
            self.run_command(label, command, group)
        self.pass_group_if_clean(group, before)

    def validate_certification_integrity(self) -> None:
        group = "GROUP 16 Certification Integrity"
        before = len(self.findings)
        states: dict[str, str] = {}
        for artifact, data in self.artifacts.items():
            state = data.get("certification_state") or data.get("decision") or data.get("status") or data.get("assessment_state")
            if state:
                states[artifact] = str(state)
        invalid_states = {name: value for name, value in states.items() if value not in {"PACKAGE_H_BATCH_03_PHASE_7_CERTIFIED", "CERTIFIED", "PASS", "COMPLETE", "CONFORMANT", "NO_BLOCKING_NON_CONFORMANCE", "NO_BLOCKING_CORRECTIVE_ACTION_REQUIRED", "PASS_WITH_INFORMATIONAL_NOTE"}}
        if invalid_states:
            self.add(group, "Critical", "Phase 7 certification artifacts", PHASE7, "consistent certifiable states", str(invalid_states), "certification consistency", "Resolve contradictory states.", "BLOCKS_CERTIFICATION")
        report = self.artifacts.get("INDEPENDENT_CERTIFICATION_REPORT", {})
        manifest = self.artifacts.get("PACKAGE_H_BATCH_03_PHASE_7_MANIFEST", {})
        if report and manifest and report.get("certification_state") != manifest.get("certification_state"):
            self.add(group, "Critical", "ICR-1/P7M-1", PHASE7, "matching certification_state", f"{report.get('certification_state')} vs {manifest.get('certification_state')}", "report/manifest consistency", "Align certification states.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

    def validate_nonconformance_corrective_phase_publication(self) -> None:
        group = "GROUP 17 Non-Conformance Review"
        before = len(self.findings)
        cfs = self.artifacts.get("CERTIFICATION_FINDINGS_SUMMARY", {})
        for item in cfs.get("findings", []):
            missing = [field for field in ("finding_id", "description", "evidence", "repository_location", "affected_capability", "affected_requirement", "severity", "risk", "correction_recommendation", "certification_impact") if not item.get(field)]
            if missing:
                self.add(group, "Major", "CFS-1", PHASE7 / "CERTIFICATION_FINDINGS_SUMMARY.json", "complete finding fields", str(missing), "finding classification", "Complete finding metadata.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

        group = "GROUP 18 Corrective Actions"
        before = len(self.findings)
        ncr = self.artifacts.get("NON_CONFORMANCE_REGISTER", {})
        car = self.artifacts.get("CORRECTIVE_ACTION_REGISTER", {})
        if ncr.get("critical_non_conformances"):
            self.add(group, "Critical", "NCR-1", PHASE7 / "NON_CONFORMANCE_REGISTER.json", "no open critical findings", str(ncr.get("critical_non_conformances")), "critical findings cannot remain open", "Resolve critical findings before certification.", "BLOCKS_CERTIFICATION")
        if ncr.get("major_non_conformances") and not car.get("corrective_actions"):
            self.add(group, "Major", "CAR-1", PHASE7 / "CORRECTIVE_ACTION_REGISTER.json", "major findings have disposition", "missing corrective action", "major finding disposition", "Add corrective action dispositions.", "BLOCKS_CERTIFICATION")
        if car.get("required_actions_open"):
            self.add(group, "Major", "CAR-1", PHASE7 / "CORRECTIVE_ACTION_REGISTER.json", "no required actions open", str(car.get("required_actions_open")), "corrective action closure", "Close required actions.", "BLOCKS_CERTIFICATION")
        self.pass_group_if_clean(group, before)

        group = "GROUP 19 Phase Integrity"
        before = len(self.findings)
        rcv = self.artifacts.get("REPOSITORY_CONFORMANCE_VERIFICATION", {})
        for key in ("phase_7_implementation_changes", "phase_7_runtime_changes"):
            if rcv.get(key):
                self.add(group, "Critical", "RCV-1", PHASE7 / "REPOSITORY_CONFORMANCE_VERIFICATION.json", f"{key} empty", str(rcv.get(key)), "Phase 7 is certification-only", "Remove Phase 7 implementation/runtime mutation.", "BLOCKS_CERTIFICATION")
        for key, value in walk_values(self.artifacts):
            if key in CONSTITUTIONAL_REVIEW_TRIGGERS and value is True:
                self.add(group, "Critical", "Phase 7 artifacts", PHASE7, f"{key}=false", "true", "Phase 7 constitutional boundary", "Stop for constitutional review.", "REQUIRES_CONSTITUTIONAL_REVIEW")
        self.pass_group_if_clean(group, before)

        group = "GROUP 20 Publication Readiness"
        before = len(self.findings)
        for artifact, data in self.artifacts.items():
            next_phase = data.get("next_authorized_phase")
            if next_phase and next_phase != EXPECTED_PHASE8:
                self.add(group, "Critical", artifact, PHASE7 / f"{artifact}.json", EXPECTED_PHASE8, str(next_phase), "only Phase 8 publication authorization may be next", "Correct next phase boundary.", "BLOCKS_CERTIFICATION")
        for artifact, data in self.artifacts.items():
            for key in ("deployment_authorized", "production_release_authorized", "operational_activation_authorized"):
                if data.get(key) is True:
                    self.add(group, "Critical", artifact, PHASE7 / f"{artifact}.json", f"{key}=false", "true", "publication readiness boundary", "Remove unauthorized later-phase authorization.", "REQUIRES_CONSTITUTIONAL_REVIEW")
        self.pass_group_if_clean(group, before)

    def run(self) -> str:
        self.validate_repository_integrity()
        self.validate_artifact_completeness()
        self.validate_json_integrity()
        self.validate_markdown_consistency()
        self.load_phase6()
        self.validate_implementation_authorization()
        self.validate_ctb_conformance()
        self.validate_acceptance()
        self.validate_evidence()
        self.validate_epl()
        self.validate_traceability()
        self.validate_ownership_architecture_runtime()
        self.validate_validator_chain()
        self.validate_focused_test_chain()
        self.validate_certification_integrity()
        self.validate_nonconformance_corrective_phase_publication()
        if any(item.certification_impact == "REQUIRES_CONSTITUTIONAL_REVIEW" for item in self.findings):
            return REVIEW_STATE
        if self.findings:
            return INVALID_STATE
        return VALID_STATE

    def print_report(self, state: str) -> None:
        print(state)
        print()
        print("Certification Summary")
        print(f"- Validator ID: {VALIDATOR_ID}")
        print(f"- Validation Groups Passed: {len(self.groups_passed)}/20")
        print(f"- Artifacts Verified: {len(self.artifacts)}/{len(EXPECTED_PHASE7_ARTIFACTS)}")
        print(f"- Findings: {len(self.findings)}")
        print(f"- Traceability Status: {'PASS' if not self.findings_for('Traceability') else 'FAIL'}")
        print(f"- Evidence Status: {'PASS' if not self.findings_for('Evidence') else 'FAIL'}")
        print(f"- Ownership Status: {'PASS' if not self.findings_for('Ownership') else 'FAIL'}")
        print(f"- Architecture Status: {'PASS' if not self.findings_for('Architecture') else 'FAIL'}")
        print(f"- Repository Status: {'PASS' if not self.findings_for('Repository') else 'FAIL'}")
        print(f"- Publication Readiness: {'PASS' if state == VALID_STATE else 'NOT_AUTHORIZED'}")
        if self.findings:
            print()
            print("Findings")
            for index, finding in enumerate(self.findings, start=1):
                item = finding.as_dict()
                print(f"{index}. [{item['severity']}] {item['group']} / {item['artifact']}")
                print(f"   path: {item['repository_path']}")
                print(f"   expected: {item['expected']}")
                print(f"   observed: {item['observed']}")
                print(f"   requirement: {item['requirement']}")
                print(f"   recommendation: {item['recommendation']}")
                print(f"   certification impact: {item['certification_impact']}")

    def findings_for(self, token: str) -> list[Finding]:
        return [finding for finding in self.findings if token.lower() in finding.group.lower()]


def walk_values(value: Any):
    if isinstance(value, dict):
        for key, item in value.items():
            yield key, item
            yield from walk_values(item)
    elif isinstance(value, list):
        for item in value:
            yield from walk_values(item)


def main() -> int:
    validator = CertificationValidator(ROOT)
    state = validator.run()
    validator.print_report(state)
    return 0 if state == VALID_STATE else 1


if __name__ == "__main__":
    raise SystemExit(main())
