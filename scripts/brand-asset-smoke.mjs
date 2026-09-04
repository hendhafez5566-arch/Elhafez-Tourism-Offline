import fs from 'node:fs';
import crypto from 'node:crypto';
const read=p=>fs.readFileSync(p,'utf8');
const bin=p=>fs.readFileSync(p);
const pkg=JSON.parse(read('package.json'));
const version=String(pkg.version);
const src512=bin('pwa/icons/erp-512.png'),dist512=bin('dist/icons/erp-512.png');
const src192=bin('pwa/icons/erp-192.png'),dist192=bin('dist/icons/erp-192.png');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const auth=read('src/security/auth.ts'),copy=read('scripts/copy-static.mjs'),sw=read('dist/sw.js'),html=read('dist/index.html'),manifest=read('dist/manifest.webmanifest');
const checks=[
 ['identity PNG 512 exists and is nontrivial',src512.length>20000&&src512.subarray(1,4).toString()==='PNG'],
 ['identity PNG 192 exists and is nontrivial',src192.length>5000&&src192.subarray(1,4).toString()==='PNG'],
 ['dist icon bytes exactly match source identity assets',sha(src512)===sha(dist512)&&sha(src192)===sha(dist192)],
 ['setup/reset screens use versioned 512 identity asset',!auth.includes('src="./icons/erp-512.png"')&&auth.includes('erp-512.png?v=${encodeURIComponent(APP.version)}')],
 ['static build cache-busts both identity icon sizes',copy.includes("'./icons/erp-192.png','./icons/erp-512.png'")],
 ['dist login identity 512 is versioned',html.includes(`./icons/erp-512.png?v=${version}`)],
 ['manifest identity icons are versioned',manifest.includes(`./icons/erp-192.png?v=${version}`)&&manifest.includes(`./icons/erp-512.png?v=${version}`)],
 ['service worker uses current versioned identity icons',sw.includes(`const ERP_VERSION='${version}'`)&&sw.includes('./icons/erp-192.png?v=${ERP_VERSION}')&&sw.includes('./icons/erp-512.png?v=${ERP_VERSION}')],
 ['service worker no longer references deleted HR chunk',!sw.includes('core/hr.js')],
 ['service worker activates updated cache immediately',sw.includes('self.skipWaiting()')&&sw.includes('self.clients.claim()')]
];
const failed=checks.filter(([,ok])=>!ok);for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);if(failed.length)process.exit(9);
