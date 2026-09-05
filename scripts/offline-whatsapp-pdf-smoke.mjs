import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=fs.readFileSync(path.join(root,'android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java'),'utf8');
const printing=fs.readFileSync(path.join(root,'src/reports/printing.ts'),'utf8');
const checks=[
 ['whole-document draw enabled before Bridge WebView',main.indexOf('WebView.enableSlowWholeDocumentDraw();')>=0&&main.indexOf('WebView.enableSlowWholeDocumentDraw();')<main.indexOf('super.onCreate(savedInstanceState);')],
 ['print WebView is attached and software-rendered',main.includes('root.addView(view, 0')&&main.includes('View.LAYER_TYPE_SOFTWARE')&&!main.includes('setTranslationX(-10000f)')],
 ['visual state callback gates rendering',main.includes('postVisualStateCallback')&&main.includes('afterVisualReady(view')],
 ['WebView rasterizes through bitmap before PdfDocument',main.includes('Bitmap.createBitmap')&&main.includes('view.draw(bitmapCanvas)')&&main.includes('drawBitmap(bitmap, 0, 0, null)')],
 ['blank PDF is detected and retried',main.includes('bitmapHasInk')&&main.includes('pdf_render_blank')&&main.includes('attempt < 2')],
 ['WhatsApp PDF uses FileProvider and readable URI grant',main.includes('FileProvider.getUriForFile')&&main.includes('ClipData.newRawUri')&&main.includes('FLAG_GRANT_READ_URI_PERMISSION')&&main.includes('grantUriPermission')],
 ['native callback is wired back to UI',main.includes('erp:native-pdf-share')&&printing.includes('erp:native-pdf-share')&&printing.includes('native?.sharePdf')],
 ['forbidden PrintDocumentAdapter callbacks are absent',!main.includes('LayoutResultCallback()')&&!main.includes('WriteResultCallback()')]
];
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,p])=>!p)) process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
