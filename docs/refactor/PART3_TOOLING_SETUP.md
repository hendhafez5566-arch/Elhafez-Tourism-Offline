# Part 3 — one-time tooling setup (run on a machine WITH internet)

Prettier and ESLint were prepared (configs, scripts, ratchets, CI job) but **could not be installed or run** in the
environment where Part 3 was prepared (no network). `package.json` devDependencies and `package-lock.json` were
deliberately NOT touched so `npm ci` keeps working. Do this once, in order:

```bash
# 1. install exact versions (records them in package.json AND package-lock.json)
npm install --save-dev --save-exact prettier eslint @eslint/js typescript-eslint globals
git add package.json package-lock.json && git commit -m "tooling: prettier + eslint (exact)"

# 2. baseline BEFORE formatting
npm run build && npm run test:golden && npm run release:check -- --with-browser

# 3. format ONE FOLDER at a time, then rebuild and compare after each
npx prettier --write "src/core/**/*.ts"   # then: npm run build && npm run test:golden && npm run test:baseline
npx prettier --write "src/accounting/**/*.ts" "src/finance/**/*.ts"
# ... crm, commercial, persistence, security, documents, reports, ui, integrated, application, then server/src and scripts

# 4. smoke tests that read src/ as TEXT may now fail ONLY because of whitespace. Fix the checker (normalise whitespace), never the assertion.
#    Pinned tests are listed in .prettierignore on purpose; formatting them needs `npm run pins:update` in the same reviewed change.

# 5. lint
npm run lint                         # read the output
node scripts/lint-ratchet.mjs --update   # record the warning baseline (errors must be 0)
git config # then in GitHub: repository variable STYLE_GATE=on  (activates the `style` CI job)
```

Why order matters: formatting makes the "800 lines" split criterion meaningful and makes type annotations reviewable;
do file splitting and type tightening **after** step 3.
