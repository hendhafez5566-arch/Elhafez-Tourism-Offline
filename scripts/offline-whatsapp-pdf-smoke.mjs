import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const main=fs.readFileSync(path.join(root,'android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java'),'utf8');
const printing=fs.readFileSync(path.join(root,'src/reports/printing.ts'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const checks=[
 ['native PDF uses public PrintedPdfDocument canvas API',main.includes('new PrintedPdfDocument')&&main.includes('document.startPage')&&main.includes('view.draw(canvas)')&&main.includes('document.writeTo(out)')],
 ['native PDF targets ISO A4 and respects orientation',main.includes('PrintAttributes.MediaSize.ISO_A4')&&main.includes('media.asLandscape()')&&main.includes('media.asPortrait()')],
 ['native PDF uses real 10mm A4 content margins',main.includes('new PrintAttributes.Margins(394, 394, 394, 394)')],
 ['framework-only callback constructors are absent',!main.includes('LayoutResultCallback()')&&!main.includes('WriteResultCallback()')&&!main.includes('ParcelFileDescriptor.open')],
 ['screenshot/raster document path is absent',!main.includes('Bitmap.createBitmap')&&!main.includes('view.draw(bitmapCanvas)')&&!main.includes('drawBitmap(bitmap')],
 ['generic PDF share uses FileProvider and readable URI grant',main.includes('FileProvider.getUriForFile')&&main.includes('ClipData.newRawUri')&&main.includes('FLAG_GRANT_READ_URI_PERMISSION')],
 ['native callback is wired back to UI',main.includes('erp:native-pdf-share')&&printing.includes('erp:native-pdf-share')&&printing.includes('native?.shareDocumentPdf')],
 ['legacy print WhatsApp targeting is absent',!main.includes('com.whatsapp')&&!main.includes('s.whatsapp.net')&&!printing.includes('shareWhatsApp')&&!printing.includes('shareRecipient')&&!html.includes('printWhatsAppBtn')],
 ['canonical PDF payload strips preview theme CSS',printing.includes('commercial-print-theme')&&printing.includes('rawSource.replace')&&printing.includes('table-layout:fixed')&&printing.includes('grid-template-columns:repeat(3,minmax(0,1fr))')],
 ['print payload has A4 CSS page rules',printing.includes('@page{size:${s.printPaper||\'A4\'} ${orientation};margin:10mm}')],
 ['offline print payload does not fetch Google Fonts',!printing.includes('fonts.googleapis.com')]
];
for(const [name,pass] of checks) console.log(`${pass?'PASS':'FAIL'} ${name}`);
if(checks.some(([,p])=>!p)) process.exit(1);
console.log(JSON.stringify({ok:true,checks:checks.length},null,2));
