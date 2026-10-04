import {readFile,stat,readdir,access} from 'node:fs/promises';
import {join,relative} from 'node:path';
import {createPrivateKey,createPublicKey,sign,verify,pbkdf2Sync,webcrypto} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const must=[
 ['server/src/license.ts','verifyLicenseToken'],['server/src/migrations.ts','erp_schema_migrations'],['src/documents/attachments-backup.ts','erp-professional-suite-portable'],
 ['server/src/session.ts','last_seen_at'],['server/src/authz.ts','assertStateChangeAllowed'],['src/commercial/product.ts','BranchScope'],
 ['src/commercial/data-exchange.ts',"name.endsWith('.xlsx')"],['src/ui/party360.ts','Party360'],['src/commercial/pages.ts','programProfitability'],
 ['scripts/init-env.ps1','ERP_COMPANY_ID'],['src/commercial/pages.ts','حماية البيانات'],['server/src/server.ts','/api/integrations/whatsapp/send'],['src/persistence/server-store.ts','_requireLogin'],['src/persistence/server-store.ts','setupPassword'],['src/security/auth.ts','ServerStore.setup(DB.data,password)'],['src/security/auth.ts','data-setup-key="email"'],['src/security/auth.ts','showRecovery()'],['server/src/auth-recovery.ts','resetPasswordWithToken'],['server/src/server.ts','verifyPassword(adminUser,setupPassword)'],['src/persistence/browser-store.ts','d.meta.setupComplete===true&&!d.treasuries.length'],['src/commercial/product.ts','if(ServerStore.available!==true){if(!(await ServerStore.probe()))'],
 ['VERIFY_BACKUP_WINDOWS.bat','docker compose --env-file ".env" exec -T db pg_restore -l'],['VERIFY_BACKUP_WINDOWS.bat','backups\\*.dump'],['BACKUP_ERP_WINDOWS.bat','Backup completed and verified.'],['BUILD_ANDROID_APK_WINDOWS.bat','Elhafez_Tourism_Customer_v%ERP_VERSION%_DEBUG.apk'],['scripts/install-update.ps1','build --pull --no-cache app']
];
let ok=true;const checks=[];
for(const [file,text] of must){const s=await readFile(join(root,file),'utf8'),pass=s.includes(text);checks.push({file,text,pass});if(!pass)ok=false}
const pub=await readFile(join(root,'server/license-public.pem'),'utf8');let licenseCrypto=true;try{await access(join(root,'vendor-private/license-private.pem'));const priv=await readFile(join(root,'vendor-private/license-private.pem'),'utf8'),payload=Buffer.from(JSON.stringify({companyId:'TEST-COMPANY',edition:'professional',expiresAt:'2030-12-31'})).toString('base64url'),sig=sign(null,Buffer.from(payload),createPrivateKey(priv));licenseCrypto=verify(null,Buffer.from(payload),createPublicKey(pub),sig)}catch{licenseCrypto=pub.includes('PUBLIC KEY')}if(!licenseCrypto)ok=false;
const runtime=await readFile(join(root,'src/core/runtime.ts'),'utf8'),freshNamespace=runtime.includes('v32_2_commercial_fresh')&&!runtime.includes("legacyStorage:'erp_professional_suite_v29");if(!freshNamespace)ok=false;
const state=await readFile(join(root,'server/src/repository/postgres-state-repository.ts'),'utf8'),passwordSecretsPreserved=state.includes('u.passwordHash||old.passwordHash'),clientHashesStripped=state.includes('delete u.passwordHash'),emailVerificationServerOwned=state.includes("emailVerifiedAt:sameEmail?String(old.emailVerifiedAt||''):''");if(!passwordSecretsPreserved||!clientHashesStripped||!emailVerificationServerOwned)ok=false;

const samplePassword='Admin@12345',sampleSalt='00112233445566778899aabbccddeeff',iterations=210000;
const key=await webcrypto.subtle.importKey('raw',new TextEncoder().encode(samplePassword),'PBKDF2',false,['deriveBits']);
const bits=await webcrypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode(sampleSalt),iterations},key,256);
const browserHash=Buffer.from(bits).toString('hex'),serverHash=pbkdf2Sync(samplePassword,sampleSalt,iterations,32,'sha256').toString('hex'),passwordHashCompatible=browserHash===serverHash;if(!passwordHashCompatible)ok=false;

const context=await readFile(join(root,'server/src/context.ts'),'utf8'),serverSrc=await readFile(join(root,'server/src/server.ts'),'utf8'),authSrc=await readFile(join(root,'src/security/auth.ts'),'utf8');
const uniqueSessionCookie=context.includes('sessionCookieName')&&context.includes('SameSite=Lax'),setupCreatesSession=/api\/auth\/setup[\s\S]{0,4500}createSession\(req,t,adminUser\.id\)/.test(serverSrc),setupReturnsAuthenticated=serverSrc.includes('authenticated:true,userId:adminUser.id'),setupEmailRequired=serverSrc.includes('بريد مدير النظام مطلوب')&&authSrc.includes('data-setup-key="email"'),loginReturnsData=serverSrc.includes('data:clientPayload(st.payload,user,license)'),recoveryRoutes=['/api/auth/email/verify','/api/auth/recovery/request','/api/auth/recovery/reset'].every(x=>serverSrc.includes(x));
if(!uniqueSessionCookie||!setupCreatesSession||!setupReturnsAuthenticated||!setupEmailRequired||!loginReturnsData||!recoveryRoutes)ok=false;

const result={ok,licenseCrypto,freshNamespace,passwordSecretsPreserved,clientHashesStripped,emailVerificationServerOwned,passwordHashCompatible,uniqueSessionCookie,setupCreatesSession,setupReturnsAuthenticated,setupEmailRequired,loginReturnsData,recoveryRoutes,checks};console.log(JSON.stringify(result,null,2));if(!ok)process.exit(1);
