# Release gate tooling (reproducible setup)

Run once on a machine WITH network access and a full git clone (`fetch-depth: 0`); without them the gates below report
ENVIRONMENT BLOCKED (never PASS).

```bash
npm ci                                              # exact typescript 5.9.3 / esbuild 0.28.2 / @types/node (server build)
pip install -r qa-requirements.txt                  # playwright (Python) for golden print + browser smokes
python -m playwright install --with-deps chromium
npm run build && npm run test:golden
npm run release:check -- --with-browser             # needs full git history for APPLICATION / BUSINESS / PRESENTATION checks
```

ESLint/Prettier are installed once per `docs/refactor/PART3_TOOLING_SETUP.md`; `lint:ratchet` stays ENVIRONMENT BLOCKED until then.

Differential checks read baseline sources with `git show <START_SHA>:<path>`. A file moved after the baseline is resolved through
`movedSinceBaseline` in `scripts/application-workflow-check.mjs`; a path missing from both locations is a hard error.
