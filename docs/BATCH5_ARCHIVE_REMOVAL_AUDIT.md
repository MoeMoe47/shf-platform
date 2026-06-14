# Batch 5 Archive-Removal Audit

Generated: 2026-06-14

This is an audit-only report for the current unstaged deletion set. No `git add`, `git rm`, commit, restore, reset, delete, or move action was performed.

## Current Git State

- Current HEAD: `7dde09f feat: lock SHS governance foundation and active admin/product layers`
- Expected HEAD: `7dde09f feat: lock SHS governance foundation and active admin/product layers`
- HEAD match: yes
- Current unstaged deleted file count: 3279
- Expected unstaged deleted file count: 3279
- Deleted count match: yes
- Deleted-file list captured at: `/tmp/shrv1_batch5_deleted_files.txt`

## Category Counts

| Category | Count |
|---|---:|
| top-level .backup_* folders | 21 |
| .restore_points | 2215 |
| .bak / backup files | 92 |
| inactive router backups | 6 |
| inactive report/funding backup files | 75 |
| inactive service/CLI backups | 7 |
| old archived app snapshots | 863 |
| other archive/backup/restore candidates | 0 |
| unexpected / needs review | 0 |

All 3279 deleted files are classified in `docs/BATCH5_ARCHIVE_REMOVAL_AUDIT.json` under `classified_files_by_category`.

## Protected Path Check

- Protected path hits: 0
- Result: PASS

No active protected Truth Spine, Oracle, AI Guardrails, Game Theory, Admin Ops, SHF Impact, WebMaker, BuilderHub, Identity, active backend route/service/test, governance doc, or `package.json` path is deleted in Batch 5.

## Unexpected Deletes

- Unexpected / needs review deletions: 0
- Result: PASS

## Non-Delete Changes Present

Batch 5 itself is only unstaged `D` entries. The following non-delete working-tree entries are present separately and are not part of Batch 5:

- `?? SHS_FOCUSED_REVIEW.txt`
- `?? SHS_LIVE_ONLY_REVIEW.txt`
- `?? SHS_PROJECT_REVIEW_SNAPSHOT.txt`
- `?? docs/BATCH2_STAGING_REVIEW.json`
- `?? docs/BATCH2_STAGING_REVIEW.md`
- `?? docs/BATCH3_STAGING_REVIEW.json`
- `?? docs/BATCH3_STAGING_REVIEW.md`
- `?? docs/BATCH4_STAGING_REVIEW.json`
- `?? docs/BATCH4_STAGING_REVIEW.md`
- `?? shs_focused_review.sh`
- `?? shs_live_only_review.sh`
- `?? shs_project_snapshot.sh`
- `?? src/content/lessons/asl-student/student.asl-01-dup.json`

## Prior Stabilization Comparison

- `expected_archive_moves` in stabilization report: 3279
- Current deleted files not in `expected_archive_moves`: 0
- `expected_archive_moves` not currently deleted: 0
- `unexpected_deletes` in stabilization report: 0
- `needs_review` modified/untracked in stabilization report: 7 / 11
- Batch 6 archive-later count: 7

## External Manifest Coverage

- Checked: yes
- Manifest entries checked: 377
- Covered deleted files: 3279
- Missing manifest coverage: 0

Manifests checked:

- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/ARCHIVE_MANIFEST.md`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/admin.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/ai.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/applyManifest.js`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/arcade.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/career.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/civic.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/credit.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/curriculum.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/debt.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/employer.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/foundation.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/fuel.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/launch.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/loo.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/manifest.schema.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/sales.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/solutions.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/store.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/treasury.manifest.json`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/apps/manifest/validateManifests.js`
- `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/shrv1-cleanup-20260614-095113/repo-root/.restore_points/stable_base_20260422_093031/src/content/lessons/manifest.js`
- `/Users/mikeslate/Desktop/shrv1/_archive/duplicate-layer-audit/20260614-093838/ARCHIVE_MANIFEST.md`

Coverage note: coverage is counted when a deleted path exactly matches a manifest source path or is contained under a manifest source folder. `/Users/mikeslate/Desktop/_external_repo_archives/` was checked but no relevant manifest files were found. `/Users/mikeslate/Desktop/SHF_REPO_EXTERNAL_ARCHIVE/` and the in-repo duplicate-layer audit manifest covered the deletion set.

## Validation Results

- `python3 scripts/check_duplicate_layer_cleanup.py`: PASS
- `python3 scripts/check_master_layer_registry.py`: PASS
- `python3 scripts/check_truth_spine_freeze.py`: PASS
- `python3 scripts/check_oracle_layer.py`: PASS
- `python3 scripts/check_ai_guardrails_layer.py`: PASS
- `python3 scripts/check_game_theory_layer.py`: PASS
- `npm run check:governance`: PASS
- `npm run build`: PASS with existing large chunk warning

## Recommendation

Recommendation: safe to stage as archive-removal commit

Safe to stage: yes

Reason: the current deletion set is exactly 3,279 files, matches the prior expected archive moves, has zero protected path hits, has zero unexpected deletes, has full manifest coverage, and validation passed. Batch 6 and other non-delete working-tree files remain separate and should not be included.

## Proposed Command Only

Do not execute until owner approval:

```bash
git status --short | awk '/^ D / {print substr($0,4)}' | xargs git rm --cached --ignore-unmatch
```

Option B is simpler but broader and should be used only if the owner explicitly wants all tracked modifications/deletions staged from the working tree:

```bash
git add -u
```

## Suggested Commit Message

```text
chore: remove externally archived backup and restore files

- removes tracked backup/archive/restore files already moved outside repo
- preserves active Truth Spine, Oracle, AI Guardrails, Game Theory, Watchtower, LOO, Reports, SHF Impact, WebMaker, BuilderHub, Identity, and Ops files
- keeps archive manifests for audit trail
- no runtime behavior changes intended
```

## No-Action Confirmation

No `git add`, `git rm`, `git commit`, `git restore`, `git reset`, file deletion, file move, source-code edit, package-file edit, or runtime behavior change was performed during this audit.
