// Source-text smoke tests assert on the text of modules that were split by responsibility (facade + parts).
// These helpers return the facade text followed by every part, so assertions keep their meaning.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
const cat = (files) => files.map((f) => fs.readFileSync(path.join(root, 'src/core/umrah', `${f}.ts`), 'utf8')).join('\n');
export const umrahPagesText = () => cat(['ui-pages', 'ui-contracts-pages', 'ui-programs-pages', 'ui-bookings-pages', 'ui-inventory-pages', 'ui-operations-pages']);
export const umrahFormsText = () => cat(['forms', 'forms-contract-entities', 'forms-programs', 'forms-bookings', 'forms-trip']);
const catIn = (dir, files) => files.map((f) => fs.readFileSync(path.join(root, dir, `${f}.ts`), 'utf8')).join('\n');
// src/ui/ui.ts, src/ui/pages.ts and umrah/program-wizard.ts were split by responsibility into facade + parts; these return facade text followed by every part.
export const uiText = () => catIn('src/ui', ['ui', 'ui-fonts', 'ui-shell', 'ui-workspace-nav', 'ui-menus-search', 'ui-tables', 'ui-modal-settings', 'ui-base-methods', 'ui-modal-stack']);
export const pagesText = () => catIn('src/ui', ['pages', 'operations-pages', 'accounting-pages', 'admin-pages', 'settings-pages']);
export const wizardText = () => catIn('src/core/umrah', ['program-wizard', 'program-wizard-validation', 'program-wizard-finish']);
