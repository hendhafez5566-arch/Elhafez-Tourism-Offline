import fs from 'node:fs';
const css=fs.readFileSync('src/styles.css','utf8'), pages=fs.readFileSync('src/ui/pages.ts','utf8'), ui=fs.readFileSync('src/ui/ui.ts','utf8'), actions=fs.readFileSync('src/ui/actions.ts','utf8');
const checks=[['3-column filters',css.includes('grid-template-columns:repeat(3,minmax(0,1fr))')],['font picker',pages.includes('setFontFamily')&&pages.includes('font-family-option')],['font apply',ui.includes('--system-font')&&ui.includes('SystemFontCatalog')&&ui.includes('ensureSystemFontAsset')],['font save',actions.includes('settings.fontFamily')],['compact 360',css.includes('.party360-tab-icon')]];
for(const [n,ok] of checks){console.log(ok?'PASS':'FAIL',n);if(!ok)process.exitCode=1}
