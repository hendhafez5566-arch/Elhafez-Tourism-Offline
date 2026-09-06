import fs from 'node:fs';
const java=fs.readFileSync(new URL('../android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java',import.meta.url),'utf8');
const checks=[
 ['no inaccessible LayoutResultCallback constructor',!java.includes('new PrintDocumentAdapter.LayoutResultCallback()')],
 ['no inaccessible WriteResultCallback constructor',!java.includes('new PrintDocumentAdapter.WriteResultCallback()')],
 ['structured PDF uses public PdfDocument',java.includes('new PdfDocument()')&&java.includes('document.startPage(info)')&&java.includes('document.writeTo(out)')],
 ['PDF no longer renders a WebView or Bitmap screenshot',!java.includes('view.draw(canvas)')&&!java.includes('Bitmap.createBitmap')&&!java.includes('drawBitmap(bitmap')],
 ['Java filename sanitizer is compiler-safe',java.includes('name = name.replaceAll(')&&!java.includes('\\p{L}')&&!java.includes('\\p{N}')],
];
for(const [name,pass] of checks)console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,pass])=>!pass))process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
