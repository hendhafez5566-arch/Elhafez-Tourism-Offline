import fs from 'node:fs';
const read=p=>fs.readFileSync(p,'utf8');
const printing=read('src/reports/printing.ts');
const java=read('android/app/src/main/java/com/elhafez/tourism/erp/customer/MainActivity.java');
const html=read('index.html');
const delegated=read('src/ui/delegated-actions.ts');
const ui=read('src/ui/ui.ts');
const forms=read('src/ui/forms.ts');
const defs=read('src/ui/forms-definitions.ts');
const manifest=read('android/app/src/main/AndroidManifest.xml');
const css=read('src/styles.css');
const pages=read('src/ui/pages.ts');
const party=read('src/crm/party360.ts');
const androidBundle=read('android/app/src/main/assets/public/app.js');
const actions=read('src/ui/actions.ts');
const commercialActions=read('src/commercial/actions.ts');
const pkg=JSON.parse(read('package.json'));

const checks=[];
const ok=(name,pass)=>{checks.push([name,!!pass]);console.log(`${pass?'PASS':'FAIL'} ${name}`)};

// Final print contract: the existing HTML/A4 print template remains canonical.
ok('release is v32.5.62+', Number(pkg.version.split('.').at(-1))>=62);
ok('print modal exposes Print and WhatsApp only for document delivery', html.includes('onclick="Print.doPrint()"')&&html.includes('id="printSharePdfBtn"')&&html.includes('>واتساب</button>')&&!html.includes('>مشاركة PDF</button>'));
ok('both Print and WhatsApp start from the same printPayload HTML/CSS payload', printing.includes('async doPrint(){const p=await this.printPayload()')&&printing.includes('async sharePdf(){')&&printing.includes('const p=await this.printPayload()'));
ok('native print uses canonical HTML A4 bridge', printing.includes('native?.printHtmlA4')&&printing.includes('native.printHtmlA4(p.html,p.fileName,p.orientation)'));
ok('native WhatsApp uses the same HTML, filename and orientation payload', printing.includes('native?.shareHtmlA4ToWhatsApp')&&printing.includes('native.shareHtmlA4ToWhatsApp(p.html,p.fileName,p.orientation,phone)'));
ok('print payload owns explicit ISO A4 CSS and bounded layout', printing.includes('@page{size:A4 ${orientation};margin:10mm}')&&printing.includes('table-layout:fixed')&&printing.includes('overflow-x:hidden'));
ok('offline print template does not fetch Google Fonts', !printing.includes('fonts.googleapis.com'));
ok('Android print bridge requests ISO A4', java.includes('public void printHtmlA4(')&&java.includes('PrintAttributes.MediaSize.ISO_A4')&&java.includes('manager.print(safeJob, adapter, buildPdfAttributes(landscape))'));
ok('Android WhatsApp bridge receives the same HTML document', java.includes('public void shareHtmlA4ToWhatsApp(String html, String jobName, String orientation, String phone)')&&java.includes('loadDataWithBaseURL("https://localhost/", html == null ? "" : html, "text/html", "UTF-8", null)')&&java.includes('sharePrintHtmlAsPdfToWhatsApp(view, jobName, phone, resolvedOrientation)'));
ok('bundled Android web assets match the active HTML/A4 WhatsApp source', androidBundle.includes('shareHtmlA4ToWhatsApp')&&!androidBundle.includes('native?.shareStructuredPdfToWhatsApp'));
ok('WhatsApp PDF generation uses the same A4 attributes helper as print', java.includes('final PrintAttributes attributes = buildPdfAttributes(landscape)'));
ok('registered party phone is resolved centrally', printing.includes('whatsappPhone()')&&printing.includes('Actions.normalizeWhatsApp'));
ok('WhatsApp delivery targets registered jid and supports normal/business packages', java.includes('share.putExtra("jid"')&&java.includes('com.whatsapp')&&java.includes('com.whatsapp.w4b'));
ok('active Print/WhatsApp flow does not call the obsolete structured renderer', !printing.includes('native?.shareStructuredPdfToWhatsApp')&&!printing.includes('native?.printStructuredPdf')&&printing.includes('native?.shareHtmlA4ToWhatsApp')&&printing.includes('native?.printHtmlA4'));
ok('delegated WhatsApp button routes only to Print.sharePdf', delegated.includes("[data-print-share-pdf]")&&delegated.includes('Print.sharePdf()'));

// Preserve unrelated regressions that used to live in historical print-version tests.
ok('compact invoice narrative remains enabled', printing.includes("DocumentNarrative.invoiceLine(inv,l,i,'short')"));
ok('shortcut controls remain present and per-user capped', html.includes('data-ui-toggle-shortcut="1"')&&ui.includes('elhafez-shortcuts:${Auth.user?.id')&&ui.includes('.slice(0,12)'));
ok('Android keyboard suggestions remain enabled', forms.includes('spellcheck="true" autocorrect="on"')&&ui.includes("el.setAttribute('autocorrect','on')"));
ok('native contact picker remains wired without broad contacts permission', java.includes('ContactsContract.CommonDataKinds.Phone.CONTENT_URI')&&forms.includes('data-contact-pick')&&!manifest.includes('READ_CONTACTS')&&!manifest.includes('READ_CALL_LOG'));
ok('agent WhatsApp field remains available', defs.includes("['whatsapp','واتساب','tel',{value:agent?.whatsapp||'',required:false}]"));
ok('sidebar accordion remains sibling-scoped and stable on Android', ui.includes("const group=el.parentElement?.closest?.('.workspace-accordion')")&&!ui.includes('sidebar.scrollTop=0')&&css.includes('.native-android .sidebar{will-change:transform'));
ok('activity visible cap remains 1000', pages.includes('.slice(0,1000)'));
ok('legacy WhatsApp text-template sender remains removed', !commercialActions.includes('sendWhatsAppApi')&&!actions.includes('whatsAppOptions')&&!actions.includes('whatsAppMessage'));
ok('party More keeps direct WhatsApp and real Documents entries', party.includes('data-party-action="whatsapp"')&&party.includes('data-party-action="documents"')&&party.includes("key==='invoices'")&&party.includes("key==='receipts'")&&party.includes("key==='payments'"));
ok('framework callback-constructor hacks stay absent', !java.includes('LayoutResultCallback()')&&!java.includes('WriteResultCallback()'));

const failed=checks.filter(([,p])=>!p);
console.log(`v32.5.62 final print/WhatsApp release gate: ${checks.length-failed.length}/${checks.length}`);
if(failed.length) process.exit(1);
