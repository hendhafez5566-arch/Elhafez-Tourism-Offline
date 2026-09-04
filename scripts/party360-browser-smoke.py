import asyncio, json, pathlib, re, sys, time, os, shutil
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'dist/index.html').read_text(errors='ignore')
css=(ROOT/'dist/styles.css').read_text(errors='ignore')
js=(ROOT/'dist/app.js').read_text(errors='ignore')
index=re.sub(r'<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>', '<style>'+css+'</style>', index)
index=re.sub(r'<script\s+defer\s+src="[^\"]*app\.js[^\"]*"\s*></script>', lambda _:'<script>'+js.replace('</script>','<\\/script>')+'</script>', index)
storage="""<script>
(()=>{const make=()=>({_:{},setItem(k,v){this._[String(k)]=String(v)},getItem(k){return Object.prototype.hasOwnProperty.call(this._,String(k))?this._[String(k)]:null},removeItem(k){delete this._[String(k)]},clear(){this._={}},key(i){return Object.keys(this._)[i]??null},get length(){return Object.keys(this._).length}});try{Object.defineProperty(window,'localStorage',{value:make()})}catch(_){}try{Object.defineProperty(window,'sessionStorage',{value:make()})}catch(_){} })();
</script>"""
index=index.replace('<head>', '<head>'+storage,1)
async def main():
  errors=[]; console_errors=[]; flows={}
  async with async_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True, executable_path=browser_path or None, args=['--no-sandbox','--disable-dev-shm-usage'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:console_errors.append(m.text) if m.type=='error' else None)
    await page.set_content(index,wait_until='domcontentloaded',timeout=30000)
    await page.wait_for_timeout(200)
    await page.evaluate("""() => {
      DataStore.localPut=async()=>true;DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});
      ServerStore.available=false;ServerStore.authenticated=false;
      DB.data=deep(Seed);DB.data.meta.setupComplete=true;DB.ensure();
      const u={id:'qa-admin',name:'QA Admin',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]};
      DB.data.users=[u];Auth.user=u;Auth.enter();document.documentElement.classList.add('native-android');
      DB.data.customers=[{id:'c0',no:'C0001',name:'عميل ضغط 360',type:'individual',phone:'01000000000',active:true}];
      DB.data.suppliers=[{id:'s0',no:'S0001',name:'مورد ضغط 360',type:'hotel',currency:'EGP',active:true}];
      DB.data.invoices=Array.from({length:900},(_,i)=>({id:'i'+i,no:'I'+i,kind:i%2?'customer':'supplier',partyType:'customer',partyId:i%2?'c0':'s0',date:'2026-08-20',status:'posted',currency:'EGP',lines:[],active:true}));
      DB.data.receipts=Array.from({length:300},(_,i)=>({id:'r'+i,no:'R'+i,partyId:i%2?'c0':'other',date:'2026-08-20',status:'posted',amount:10,currency:'EGP',active:true}));
      DB.data.payments=Array.from({length:300},(_,i)=>({id:'p'+i,no:'P'+i,partyId:i%2?'s0':'other',date:'2026-08-20',status:'posted',amount:10,currency:'EGP',active:true}));
      DB.data.services=Array.from({length:500},(_,i)=>({id:'sv'+i,no:'SV'+i,customerId:i%3?'c0':'other',supplierId:i%4?'s0':'other',date:'2026-08-20',status:'confirmed',active:true}));
      DB.data.bookings=Array.from({length:300},(_,i)=>({id:'b'+i,no:'B'+i,customerId:i%2?'c0':'other',date:'2026-08-20',status:'confirmed',active:true}));
      DB.data.purchaseOrders=Array.from({length:300},(_,i)=>({id:'po'+i,no:'PO'+i,supplierId:i%2?'s0':'other',date:'2026-08-20',status:'draft',currency:'EGP',lines:[],active:true}));
      DB.data.attachments=Array.from({length:180},(_,i)=>({id:'a'+i,entityType:i%2?'customer':'supplier',entityId:i%2?'c0':'s0',name:'ملف '+i,active:true}));
      DB.data.meta.updatedAt='qa-360-stress';Party360._modelCacheKey='';Party360._modelCache=null;DB.refreshAuditBaseline();
    }""")
    # Warm the first Party360 shell once so the threshold measures the component, not Chromium/JIT cold start.
    await page.evaluate("Party360.open('customer','c0')")
    await page.wait_for_function("() => { const d=document.querySelector('#party360-detail'); return d && !d.textContent.includes('جاري تجهيز'); }", timeout=6000)
    await page.evaluate("UI.closeModal(true);Party360._modelCacheKey='';Party360._modelCache=null")
    for typ,ident in [('customer','c0'),('supplier','s0')]:
      t=time.perf_counter()
      await page.evaluate("(x)=>Party360.open(x.type,x.id)",{'type':typ,'id':ident})
      shell_ms=(time.perf_counter()-t)*1000
      await page.wait_for_function("""() => {
        const d=document.querySelector('#party360-detail'); return d && !d.textContent.includes('جاري تجهيز');
      }""",timeout=6000)
      stats=await page.locator('.party360-strip b').all_text_contents()
      flows[typ]={'shellMs':round(shell_ms,1),'stats':stats}
      if shell_ms>180: errors.append(f'{typ} 360 shell blocked for {shell_ms:.1f}ms')
      await page.evaluate("UI.closeModal(true);Party360._modelCacheKey='';Party360._modelCache=null")
    result={'ok':not errors and not console_errors,'flows':flows,'pageErrors':errors[:20],'consoleErrors':console_errors[:20]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    await browser.close()
    if not result['ok']:sys.exit(1)
asyncio.run(main())
