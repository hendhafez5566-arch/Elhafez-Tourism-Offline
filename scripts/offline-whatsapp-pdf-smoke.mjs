import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=fs.readFileSync(path.join(root,'android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java'),'utf8');
const printing=fs.readFileSync(path.join(root,'src/reports/printing.ts'),'utf8');
const checks=[
 ['native PDF uses Chromium PrintDocumentAdapter',main.includes('createPrintDocumentAdapter')&&main.includes('LayoutResultCallback()')&&main.includes('WriteResultCallback()')],
 ['native PDF targets ISO A4 and respects orientation',main.includes('PrintAttributes.MediaSize.ISO_A4')&&main.includes('media.asLandscape()')&&main.includes('media.asPortrait()')],
 ['native PDF writes directly to a file descriptor',main.includes('ParcelFileDescriptor.open')&&main.includes('PageRange.ALL_PAGES')],
 ['screenshot/raster document path is absent',!main.includes('Bitmap.createBitmap')&&!main.includes('view.draw(bitmapCanvas)')&&!main.includes('drawBitmap(bitmap')&&!main.includes('PdfDocument pdf')],
 ['obsolete whole-document bitmap drawing is absent',!main.includes('enableSlowWholeDocumentDraw')&&!main.includes('bitmapHasInk')],
 ['WhatsApp PDF uses FileProvider and readable URI grant',main.includes('FileProvider.getUriForFile')&&main.includes('ClipData.newRawUri')&&main.includes('FLAG_GRANT_READ_URI_PERMISSION')&&main.includes('grantUriPermission')],
 ['native callback is wired back to UI',main.includes('erp:native-pdf-share')&&printing.includes('erp:native-pdf-share')&&printing.includes('native?.sharePdfA4')],
 ['print payload has A4 CSS page rules',printing.includes('@page{size:${s.printPaper||\'A4\'} ${s.printOrientation||\'portrait\'};margin:10mm}')],
 ['offline print payload does not fetch Google Fonts',!printing.includes('fonts.googleapis.com')]
];
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,p])=>!p)) process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
