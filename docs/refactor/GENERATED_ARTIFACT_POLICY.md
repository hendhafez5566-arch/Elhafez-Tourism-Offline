# Generated artifact policy

Tracked at baseline: dist has 8 files, server/dist has 15, Android assets has 10 (including Capacitor configuration and public web assets). These remain tracked temporarily because existing distribution and native parity checks consume them.

Client compilation/static copy and server compilation regenerate outputs locally for validation. Restore tracked generated outputs to the starting version before committing Phase 1: this phase is source/tooling/documentation safety work, not a release or Android sync. Health config typing is erased except for an equivalent local object binding; do not ship a generated-output release in this phase.

Future changes that intentionally release generated outputs must document which authoritative source/build produced them, verify parity, and explicitly synchronize Android. Do not broadly delete generated trees here. node_modules and server/node_modules are dependency caches, must never be tracked, and are removed after the final npm command. .gitignore stays exactly the seven specified lines. No package/lock dependency versions changed.
