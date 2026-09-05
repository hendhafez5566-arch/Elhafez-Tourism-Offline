import fs from 'node:fs';
const java=fs.readFileSync(new URL('../android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java',import.meta.url),'utf8');
const checks=[
 ['no inaccessible LayoutResultCallback constructor',!java.includes('new PrintDocumentAdapter.LayoutResultCallback()')],
 ['no inaccessible WriteResultCallback constructor',!java.includes('new PrintDocumentAdapter.WriteResultCallback()')],
 ['uses public PrintedPdfDocument',java.includes('new PrintedPdfDocument')&&java.includes('document.startPage(pageIndex)')&&java.includes('document.writeTo(out)')],
 ['PDF renders WebView directly without Bitmap',java.includes('view.draw(canvas)')&&!java.includes('Bitmap.createBitmap')&&!java.includes('drawBitmap(bitmap')],
 ['Java regex escapes are compiler-safe',java.includes('"[^\\\\p{L}\\\\p{N}._-]+"')],
];
for(const [name,pass] of checks)console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,pass])=>!pass))process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
