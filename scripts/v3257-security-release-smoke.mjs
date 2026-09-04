import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const server=read('server/src/server.ts'),session=read('server/src/session.ts'),mobile=read('src/mobile.ts'),gradle=read('android/app/build.gradle'),migration=read('database/migrations/009_persistent_login_throttle.sql'),prepare=read('scripts/prepare-customer-build.mjs');
const checks=[
 ['persistent login throttling migration exists',migration.includes('erp_login_attempts')&&server.includes('await loginBlocked')&&server.includes('await loginFailed')],
 ['process-memory login limiter removed',!server.includes('loginFailures=new Map')],
 ['Android session token not exposed to JavaScript',!mobile.includes('erp_native_session_v1')&&!mobile.includes('mobileSessionToken')&&!server.includes('mobileSessionToken')&&mobile.includes("credentials:'include'")],
 ['session list does not disclose token hash',!session.includes('tokenHash:x.token_hash')&&session.includes('id:x.token_hash.slice(0,16)')],
 ['factory reset preserves audit history',server.includes("auditEvent(c,t,a,'factory-reset'")&&!server.includes("delete from erp_audit_events where tenant_key=$1',[t])")],
 ['Release build requires signing credentials',gradle.includes('Release signing is required.')],
 ['Customer preparer keeps central vendor agent key',!prepare.includes("'vendorAutoRollout','vendorAgentKey'")],
];
let bad=0;for(const [name,ok] of checks){console.log(ok?'PASS':'FAIL',name);if(!ok)bad++}if(bad)process.exit(1);
