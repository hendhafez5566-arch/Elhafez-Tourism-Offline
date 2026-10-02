# Tracked repository classification

| Area | Tracked files | Role |
|---|---:|---|
| `src/` | 69 | Client source |
| `server/src/` | 15 | Server source |
| `scripts/` | 78 | Build, smoke and operational tooling |
| `database/` | 15 | Database documentation/assets |
| `dist/` | 8 | Tracked generated web output |
| `server/dist/` | 15 | Tracked generated server output |
| `android/` | 66 | Native project and synced output |
| `pwa/` | 4 | PWA source assets |
| `docs/` | 45 | Documentation/history |

Root package files and tsconfigs control builds; index.html/native-offline.html and src/styles.css are presentation sources. Root release reports/manifests are historical evidence. No dependency directories are tracked. No source or historical evidence removed.

Archive decision: root release manifests contain historical checksums and paths for other root reports/manifests. Moving them would invalidate their original path semantics and risk release-tool assumptions. Leave these in place in Phase 1; defer an archive migration with reference mapping. Existing docs/history remains intact.
