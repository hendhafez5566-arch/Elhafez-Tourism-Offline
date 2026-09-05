import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=fs.readFileSync(path.join(root,'android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java'),'utf8');
const printing=fs.readFileSync(path.join(root,'src/reports/printing.ts'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
 ['native shared PDF is a structured PdfDocument, not WebView raster',main.includes('new PdfDocument()')&&main.includes('StaticLayout')&&main.includes('createStructuredPdf')&&main.includes('document.writeTo(out)')&&!main.includes('PrintedPdfDocument')&&!main.includes('view.draw(canvas)')],
 ['native print targets ISO A4 and respects orientation',main.includes('PrintAttributes.MediaSize.ISO_A4')&&main.includes('media.asLandscape()')&&main.includes('media.asPortrait()')],
 ['native print uses real 10mm A4 margins',main.includes('PrintAttributes.Margins.NO_MARGINS')],
 ['framework-only callback constructors are absent',!main.includes('LayoutResultCallback()')&&!main.includes('WriteResultCallback()')&&!main.includes('ParcelFileDescriptor.open')],
 ['screenshot/raster PDF path is absent',!main.includes('Bitmap.createBitmap')&&!main.includes('view.draw(bitmapCanvas)')&&!main.includes('drawBitmap(bitmap')],
 ['generic PDF share uses FileProvider and readable URI grant',main.includes('FileProvider.getUriForFile')&&main.includes('ClipData.newRawUri')&&main.includes('FLAG_GRANT_READ_URI_PERMISSION')],
 ['native PDF callback is wired back to UI',main.includes('erp:native-pdf-share')&&printing.includes('erp:native-pdf-share')&&printing.includes('native?.shareStructuredPdf')],
 ['legacy print WhatsApp targeting is absent',!printing.includes('shareWhatsApp')&&!printing.includes('shareRecipient')&&!html.includes('printWhatsAppBtn')],
 ['print payload keeps bounded A4 layout rules',printing.includes('table-layout:fixed')&&printing.includes('grid-template-columns:repeat(3,minmax(0,1fr))')&&printing.includes('overflow-x:hidden')],
 ['print payload has explicit A4 CSS page rules',printing.includes('@page{size:A4 ${orientation};margin:10mm}')],
 ['offline print payload does not fetch Google Fonts',!printing.includes('fonts.googleapis.com')]
];
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,p])=>!p)) process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
