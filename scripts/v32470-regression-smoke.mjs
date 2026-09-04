import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const pkg=JSON.parse(read('package.json')),serverPkg=JSON.parse(read('server/package.json'));
const runtime=read('src/core/runtime.ts'), store=read('src/persistence/server-store.ts'), party=read('src/crm/party360.ts'), del=read('src/core/delete-center.ts'), pages=read('src/ui/pages.ts'), product=read('src/commercial/product.ts'), browser=read('src/persistence/browser-store.ts'), sess=read('server/src/session.ts'), vendor=read('server/src/vendor.ts'), vo=read('src/commercial/vendor-owner.ts'), ui=read('src/ui/ui.ts'), css=read('src/styles.css'), server=read('server/src/server.ts'), mobile=read('src/mobile.ts');
const checks=[
 ['release is current and runtime-aligned',pkg.version===serverPkg.version&&runtime.includes(`version:'${pkg.version}'`)],
 ['normal save stays lean and 409 retry sends merge baseline',store.includes('baseRevision')&&store.includes('baseData')&&store.includes('r.status===409')&&!store.includes('baseData=this.baseData?deep(this.baseData):null')],
 ['party deletion requires suspension',party.includes('تعليق')&&party.includes('يجب تعليق السجل أولًا')&&del.includes('يجب تعليق')],
 ['activity history has current range and retention controls',pages.includes('آخر 24 ساعة')&&pages.includes('آخر 30 يومًا')&&pages.includes('إدارة السجل')&&product.includes('activityRetentionDays')&&browser.includes('activityViewDays')],
 ['program deletion uses lifecycle and dependency guards',del.includes('programOperationalRefs')&&del.includes('programFinancialRefs')&&del.includes("'planning'")&&del.includes("'closed'")],
 ['only three supported themes remain',pages.includes('هادئ احترافي')&&!pages.includes('أزرق تنفيذي')&&!pages.includes('رملي فاخر')&&!pages.includes('رمادي احترافي')&&css.includes('body[data-theme="dark"]')&&css.includes('body[data-theme="comfort"]')],
 ['same device session is deduplicated',sess.includes('delete from erp_sessions where tenant_key=$1 and user_id=$2 and ip_address=$3 and user_agent=$4')],
 ['customer package has no local Owner/Vendor administration',vendor.includes('Customer hardened build')&&vendor.includes("reason:'customer_build'")&&vo.includes('enabled:false')&&!vendor.includes('railwayGraphql')],
 ['Android session is cookie-backed and not JS-token-backed',mobile.includes("credentials:'include'")&&!mobile.includes('erp_native_session_v1')&&!mobile.includes('mobileSessionToken')],
 ['login throttling is PostgreSQL-backed',server.includes('erp_login_attempts')&&!server.includes('loginFailures=new Map')],
 ['Umrah intermediate workspace interface is removed',ui.includes("this.current=id==='umrah'?modules[0][0]:'dashboard'")&&ui.includes("ws.id==='umrah'?'':")],
];
const out={ok:checks.every(x=>x[1]),checks:checks.map(([name,pass])=>({name,pass}))};
console.log(JSON.stringify(out,null,2));
if(!out.ok)process.exit(1);
