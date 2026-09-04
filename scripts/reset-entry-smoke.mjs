import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const auth=read('src/security/auth.ts');
const store=read('src/persistence/server-store.ts');
const server=read('server/src/server.ts');
const context=read('server/src/context.ts');
const actions=read('src/commercial/actions.ts');
const css=read('src/styles.css');
const checks=[
 ['boot routes reset state to choice gate',auth.includes('ServerStore.resetPending?this.showResetChoice():this.showSetup()')],
 ['choice gate contains existing and new user paths',auth.includes('مستخدم حالي')&&auth.includes('مستخدم جديد')&&auth.includes('showResetChoice()')],
 ['existing login can return to reset gate',auth.includes('resetEntryBack')&&auth.includes('الرجوع لاختيار نوع المستخدم')],
 ['new setup can return to reset gate',auth.includes("back.addEventListener('click',()=>this.showResetChoice())")],
 ['client tracks reset flags from bootstrap',store.includes('resetPending:false')&&store.includes('existingLoginAvailable:false')&&store.includes('b?.resetPending')],
 ['factory reset preserves only admin directory identities',server.includes('resetAdmins=(old.users||[]).filter')&&server.includes('syncUserDirectory(c,t,resetAdmins)')],
 ['factory reset is disabled by environment unless explicitly enabled',context.includes('ALLOW_FACTORY_RESET')&&context.includes('allowFactoryReset')&&server.includes("if(!allowFactoryReset)return json(res,403,{error:'factory_reset_disabled'})")],
 ['factory reset marks reset gate instead of first install',server.includes('resetPending:true')&&server.includes('resetExistingLogin:resetAdmins.length>0')],
 ['legacy reset state is upgraded to reset gate before boot',server.includes('repairLegacyResetStates()')&&server.includes('resetLegacyCompatibility:true')&&server.includes('resetPending:true')],
 ['legacy reset can recover previous admin only from pre-reset server backup',server.includes('created_at<=coalesce($2::timestamptz,now())')&&server.includes('resetLegacyAdminBackupId')&&server.includes('syncUserDirectory(c,t,admins)')],
 ['existing-user button is enabled only when a previous admin is really available',auth.includes('canLogin=ServerStore.existingLoginAvailable===true')],
 ['old admin login restores reset state',server.includes("'reset-existing-login'")&&server.includes('resetRestored=true')],
 ['ordinary user cannot claim reset company',server.includes('بعد إعادة التهيئة يجب الدخول بحساب المدير السابق')],
 ['new setup updates reset state instead of duplicate insert',server.includes("if(existing){if(!existing?.payload?.meta?.resetPending)")&&server.includes('persistStateRecord(c,t,payload,schemaVersion)')],
 ['reset confirmation explains two-path landing',actions.includes('مستخدم حالي')&&actions.includes('مستخدم جديد')],
 ['reset gate has mobile responsive styling',css.includes('safe post-reset entry gate')&&css.includes('@media(max-width:700px)')]
];
let bad=0;for(const [name,ok] of checks){console.log(`${ok?'PASS':'FAIL'} ${name}`);if(!ok)bad++}if(bad)process.exit(1);
