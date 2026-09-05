import fs from 'node:fs';
const read=f=>fs.readFileSync(new URL('../'+f,import.meta.url),'utf8');
const pkg=JSON.parse(read('package.json'));
const portable=read('src/documents/attachments-backup.ts');
const pages=read('src/commercial/pages.ts');
const main=read('android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java');
const manifest=read('android/app/src/main/AndroidManifest.xml');
const checks=[
  ['release version advanced while backup behavior remains protected', Number(pkg.version.split('.').at(-1))>=53],
  ['one canonical restorable backup builder preserved', portable.includes('formatVersion:4') && portable.includes('async verifyPackage(pkg)') && portable.includes('async restorePackage(pkg)')],
  ['android native backup bridge registered', main.includes('addJavascriptInterface(new NativeBackupBridge(), "NativeBackup")')],
  ['chunked backup transfer avoids giant single bridge payload', portable.includes('chunkSize=192*1024') && portable.includes('appendBackupChunk') && main.includes('appendBackupChunk(String id, String base64Chunk)')],
  ['android download uses MediaStore Downloads', main.includes('MediaStore.Downloads.EXTERNAL_CONTENT_URI') && main.includes('Environment.DIRECTORY_DOWNLOADS + "/Elhafez Tourism"')],
  ['legacy android save permission limited to api 28', manifest.includes('WRITE_EXTERNAL_STORAGE') && manifest.includes('android:maxSdkVersion="28"')],
  ['android share uses system ACTION_SEND and FileProvider', main.includes('Intent.ACTION_SEND') && main.includes('FileProvider.getUriForFile') && main.includes('مشاركة النسخة الاحتياطية')],
  ['delivery waits for native success before saved status', portable.includes('waitNativeDelivery') && portable.includes('if(out.saved)this.mark(kind,out.name)')],
  ['browser/laptop download fallback retained', portable.includes('browserSave(blob,name)') && portable.includes('a.download=name')],
  ['browser share fallback retained', portable.includes('navigator.share') && portable.includes('browserShare(blob,name,type,pkg)')],
  ['backup center exposes exactly the two requested primary actions', pages.includes('تنزيل نسخة على الجهاز') && pages.includes('مشاركة النسخة') && pages.includes('data-commercial-mode="download"') && pages.includes('data-commercial-mode="share"')],
  ['restore remains available from .erpbackup', pages.includes('استعادة نسخة محفوظة') && pages.includes('accept=".erpbackup,application/json"')],
  ['offline backup page does not show unusable server snapshots', pages.includes('const offline=APP.offlineEdition===true') && pages.includes("const serverCard=offline?'':")]
];
const failed=checks.filter(([,ok])=>!ok);
console.log(JSON.stringify({ok:failed.length===0,checks:checks.map(([name,pass])=>({name,pass}))},null,2));
if(failed.length)process.exit(1);
