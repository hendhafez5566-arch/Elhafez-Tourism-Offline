# Phase 1 repository baseline

Start: main / phase-1-foundation-work at `e97fa6d9cb52acb22b676e1b975c1b2332bc9a13`. Remote commit checked via GitHub; cloned only the target branch. Working tree initially clean. WORK GITHUB WRITE TEST: PASSED (non-forced update of target reference to its existing SHA).

Client: 67 explicitly ordered TypeScript files, ES2020, module none, one dist/app.js, strict false, noEmitOnError true, comments removed and maps disabled. The order is execution order, not a module graph. runtime/action policy/seed precede persistence; accounting and CRM precede security and UI; Umrah globals precede page/action wiring; mobile/PWA/bootstrap run last.

Server: 15 TypeScript files, ES2022/NodeNext, strict true, package type module. Native Node HTTP entry server.ts imports context, migrations, sessions, state/patch, entity mirror, authorizers, licenses, vendor, backups and archives. context.ts constructs pg.Pool and requires DATABASE_URL at runtime. Typechecking does not start the server or touch a database.

Build: root build compiles client, copies static/PWA assets, compiles server. build:offline omits server. build:server uses server package command. Capacitor mobile:sync builds offline output and synchronizes Android assets; Phase 1 does not invoke it.

Globals: UI in src/ui/ui.ts; DB in src/persistence/browser-store.ts; Auth in src/security/auth.ts; Pages in src/ui/pages.ts; toast in src/core/runtime.ts. ServerStore/DataStore bridge remote state, localStorage/IndexedDB and browser notifications. DB.save schedules UI rendering, calls Commercial.beforeSave and reports synchronization errors. ServerStore._requireLogin invokes Auth and toast. Accounting.engine integrity helpers invoke UI and toast. These are existing reverse dependencies, not Phase 1 changes.

Offline: APP.offlineEdition in runtime.ts, persistence browser/server stores, src/pwa.ts, pwa/sw.js, pwa/manifest.webmanifest and native-offline.html. Android: Capacitor/Gradle project, MainActivity.java and native PdfPrint.java, synchronized public assets. Android builds/native runtime not executed here.
