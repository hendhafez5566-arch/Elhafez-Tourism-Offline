# BATCH_02A_HANDOFF — Repository Hygiene (Archive Moves)

- **Batch:** B02A (repository hygiene only; no business source changes)
- **Repo:** hendhafez5566-arch/Elhafez-Tourism-Offline
- **Executed within:** B02R sanitization checkpoint (`chore(refactor): sanitize checkpoint and complete verification gate`)

## Moves performed (git mv, content preserved byte-for-byte)

### To `docs/archive/releases/`
All historically fixed release files that actually exist at the repository root:

- `RELEASE_MANIFEST_V32.5.31.txt` … `RELEASE_MANIFEST_V32.5.43.txt` (12 manifests; note: no `.36` exists in this snapshot)
- `RELEASE_REPORT_V32.5.31_AR.txt` … `RELEASE_REPORT_V32.5.66_AR.txt` (24 reports: 31–35, 37–43, 45, 46, 48, 50–55, 60, 63, 66)

Total: **36 files** → `docs/archive/releases/`

### To `docs/archive/reports/`

- `QA_SUMMARY_V32.5.15.txt`
- `CONTINUATION_AUDIT_AR.txt`
- `OFFLINE_FULL_COPY_REPORT_AR.txt`

Total: **3 files** → `docs/archive/reports/`

## Pre-move safety verification

Before moving, every runtime/test location was grepped for references to these
file names (`scripts/*.mjs`, `src/**`, `server/src/**`, `tests/**`, `android/**`,
`database/**`, `package.json`, `.github/**`):
**zero references found.** None of the moved files is a runtime or test dependency.
The Node smoke suite (60 tests) passes identically before and after the moves
(gate result unchanged: 43/60, exit 0).

## Explicitly NOT moved / NOT deleted

Left at the repository root because they are active update/customer-package
manifests referenced by tooling (e.g. `scripts/install-update.ps1`):

- `UPDATE_DELETE_MANIFEST.txt`
- `UPDATE_ONLY_README_AR.txt`
- `CUSTOMER_PACKAGE.txt`

No file was deleted in B02A.

## Generated artifacts policy (this batch)

`dist/`, `server/dist/`, and `android/app/src/main/assets/public/` are
**generated but currently tracked**. They are NOT removed or untracked in this
batch — see `docs/refactor/GENERATED_ARTIFACT_POLICY.md`. The regression gate
deliberately uses `tsc --noEmit` for the server leg so it never rewrites them.

## Constraints honored

- No changes under `src/**`, `tests/**`, `android/**`, `database/**`.
- No additional edits to `server/src/**` (B01A already approved and preserved).
- Business source untouched.
