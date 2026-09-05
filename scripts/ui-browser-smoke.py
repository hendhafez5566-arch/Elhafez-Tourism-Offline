import asyncio, json, pathlib, re, sys, time, os, shutil
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'dist/index.html').read_text(errors='ignore')
css=(ROOT/'dist/styles.css').read_text(errors='ignore')
js=(ROOT/'dist/app.js').read_text(errors='ignore')
# Keep one real document, but make it self-contained so the locked-down QA browser does not navigate.
index=re.sub(r'<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>', '<style>'+css+'</style>', index)
index=re.sub(r'<script\s+defer\s+src="[^\"]*app\.js[^\"]*"\s*></script>', lambda _:'<script>'+js.replace('</script>','<\\/script>')+'</script>', index)
storage="""<script>
(()=>{const make=()=>({_:{},setItem(k,v){this._[String(k)]=String(v)},getItem(k){return Object.prototype.hasOwnProperty.call(this._,String(k))?this._[String(k)]:null},removeItem(k){delete this._[String(k)]},clear(){this._={}},key(i){return Object.keys(this._)[i]??null},get length(){return Object.keys(this._).length}});try{Object.defineProperty(window,'localStorage',{value:make()})}catch(_){}try{Object.defineProperty(window,'sessionStorage',{value:make()})}catch(_){} })();
</script>"""
index=index.replace('<head>', '<head>'+storage,1)

async def main():
  errors=[]; console_errors=[]
  async with async_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True, executable_path=browser_path or None, args=['--no-sandbox','--disable-dev-shm-usage'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type=='error' else None)
    await page.set_content(index, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(300)
    init=await page.evaluate("""() => {
      DataStore.localPut=async()=>true; DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});
      ServerStore.available=false; ServerStore.authenticated=false;
      DB.data=deep(Seed); DB.data.meta.setupComplete=true; DB.ensure();
      const u={id:'qa-admin',name:'QA Admin',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]};
      DB.data.users=[u]; Auth.user=u; Auth.enter(); document.documentElement.classList.add('native-android');
      return {appHidden:document.getElementById('app').classList.contains('hidden'), current:UI.current, title:document.getElementById('pageTitle').textContent};
    }""")
    # Populate representative data without persistence, so list renderers are exercised with non-empty rows.
    await page.evaluate("""() => {
      DB.data.customers=Array.from({length:350},(_,i)=>({id:'c'+i,no:'C'+String(i+1).padStart(4,'0'),name:'عميل اختبار '+i,type:'individual',currency:'EGP',phone:'0100000'+i,active:true}));
      DB.data.suppliers=Array.from({length:180},(_,i)=>({id:'s'+i,no:'S'+String(i+1).padStart(4,'0'),name:'مورد اختبار '+i,type:'hotel',currency:'EGP',active:true}));
      DB.data.umrahPrograms=Array.from({length:80},(_,i)=>({id:'up'+i,no:'UP'+i,name:'برنامج عمرة '+i,status:'draft',currency:'SAR',capacity:50,active:true,departureDate:'2026-09-01',returnDate:'2026-09-10'}));
      DB.refreshAuditBaseline();
    }""")
    routes=await page.evaluate("""() => [...new Set(UI.workspaces().flatMap(w=>UI.workspaceModules(w).map(m=>m[0])))]""")
    timings=[]; failed=[]
    for route in routes:
      try:
        r=await page.evaluate("""route=>{const t=performance.now();UI.openPage(route,'',{skipHistory:true});return {ms:performance.now()-t,html:document.getElementById('pages')?.innerHTML.length||0,buttons:document.querySelectorAll('#pages button').length,title:document.getElementById('pageTitle')?.textContent||''}}""", route)
        timings.append({'route':route,**r})
        if r['html']<20: failed.append({'route':route,'reason':'empty'})
      except Exception as e:
        failed.append({'route':route,'reason':str(e)})
    # Actual simple master-form interaction: open, fill and submit a customer form.
    customer_flow={}
    try:
      await page.evaluate("UI.openPage('customers','',{skipHistory:true})")
      before=await page.evaluate("DB.data.customers.length")
      await page.evaluate("Forms.open('customer')")
      # use fields by name discovered from the real form
      names=await page.locator('#modalForm [name]').evaluate_all("els=>els.map(e=>e.name)")
      if 'name' in names:
        await page.locator('#modalForm [name="name"]').fill('عميل QA جديد')
      # Some forms use phone/currency defaults; required fields are populated conservatively.
      req=page.locator('#modalForm [required]')
      for i in range(await req.count()):
        el=req.nth(i); tag=await el.evaluate('e=>e.tagName'); typ=await el.get_attribute('type'); val=await el.input_value()
        if val: continue
        if tag=='SELECT':
          opts=await el.locator('option').evaluate_all('os=>os.map(o=>o.value).filter(Boolean)')
          if opts: await el.select_option(opts[0])
        elif typ=='date': await el.fill('2026-08-27')
        elif typ in ('number','tel'): await el.fill('1')
        else: await el.fill('QA')
      t0=time.perf_counter(); await page.locator('#modalForm button[type="submit"]').click(); await page.wait_for_timeout(80); elapsed=(time.perf_counter()-t0)*1000
      after=await page.evaluate("DB.data.customers.length")
      customer_flow={'before':before,'after':after,'uiSubmitMs':round(elapsed,1),'modalOpen':await page.locator('#modal').evaluate("e=>e.classList.contains('show')")}
      if after!=before+1: failed.append({'route':'customer-form','reason':'customer count did not increase'})
    except Exception as e:
      failed.append({'route':'customer-form','reason':str(e)})
    await page.wait_for_timeout(250)
    # Print + generic PDF share wiring: Android Share Sheet is document-based and does not depend on a party phone.
    print_flow={}
    try:
      share=await page.evaluate("""async () => {
        const c=DB.data.customers[0]; c.phone='01012345678'; c.whatsapp='';
        window.__qaPdfShare=null; window.NativePrint={shareDocumentPdf:(html,title,orientation)=>window.__qaPdfShare={html:html.length,title,orientation}};
        Print.show(Print.wrap('كشف حساب عميل','','<p>QA</p>'),{type:'statement',statementType:'customer',id:c.id});
        const partyVisible=!document.getElementById('printSharePdfBtn').classList.contains('hidden'), enabled=!document.getElementById('printSharePdfBtn').disabled;
        await Print.sharePdf(); const native=window.__qaPdfShare;
        Print.show(Print.wrap('تقرير عام','','<p>QA</p>'));
        const globalVisible=!document.getElementById('printSharePdfBtn').classList.contains('hidden');
        return {partyVisible,enabled,native,globalVisible,legacyButton:!!document.getElementById('printWhatsAppBtn'),modalVisible:document.getElementById('printModal').classList.contains('show'),printButtonCount:document.querySelectorAll('#printModal button').length};
      }""")
      print_flow=share
      if not share['modalVisible']: failed.append({'route':'print','reason':'print modal not visible'})
      if not share['partyVisible'] or not share['enabled']: failed.append({'route':'print-share','reason':'generic PDF share button unavailable'})
      if not share['native'] or share['native']['orientation'] not in ('portrait','landscape'): failed.append({'route':'print-share','reason':'native generic PDF share did not receive document orientation'})
      if not share['globalVisible']: failed.append({'route':'print-share','reason':'generic PDF share should work for global reports too'})
      if share['legacyButton']: failed.append({'route':'print-share','reason':'legacy WhatsApp print button still exists'})
    except Exception as e: failed.append({'route':'print','reason':str(e)})
    slow=sorted(timings,key=lambda x:x['ms'],reverse=True)[:10]
    result={'ok':not failed and not errors,'init':init,'routesTested':len(routes),'failed':failed,'pageErrors':errors[:20],'consoleErrors':console_errors[:20],'customerFlow':customer_flow,'printFlow':print_flow,'slowestRoutes':[{**x,'ms':round(x['ms'],1)} for x in slow]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    await browser.close()
    if not result['ok']: sys.exit(1)
asyncio.run(main())
