import asyncio, json, pathlib, re, sys, os, shutil
from playwright.async_api import async_playwright

ROOT=pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'dist/index.html').read_text(errors='ignore')
css=(ROOT/'dist/styles.css').read_text(errors='ignore')
js=(ROOT/'dist/app.js').read_text(errors='ignore')
index=re.sub(r'<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>', '<style>'+css+'</style>', index)
index=re.sub(r'<script\s+defer\s+src="[^\"]*app\.js[^\"]*"\s*></script>', lambda _:'<script>'+js.replace('</script>','<\\/script>')+'</script>', index)
storage="""<script>(()=>{const m=()=>({_:{},setItem(k,v){this._[k]=String(v)},getItem(k){return this._[k]??null},removeItem(k){delete this._[k]},clear(){this._={}},key(i){return Object.keys(this._)[i]??null},get length(){return Object.keys(this._).length}});Object.defineProperty(window,'localStorage',{value:m()});Object.defineProperty(window,'sessionStorage',{value:m()})})();</script>"""
index=index.replace('<head>','<head>'+storage,1)

async def main():
  errors=[]; consoles=[]; checks={}
  async with async_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True,executable_path=browser_path or None,args=['--no-sandbox','--disable-dev-shm-usage'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror',lambda e:errors.append(str(e)))
    page.on('console',lambda m:consoles.append(m.text) if m.type=='error' else None)
    await page.set_content(index,wait_until='domcontentloaded',timeout=30000)
    await page.wait_for_timeout(200)
    await page.evaluate("""() => {
      DataStore.localPut=async()=>true;DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});
      ServerStore.available=false;ServerStore.authenticated=false;
      DB.data=deep(Seed);DB.data.meta.setupComplete=true;DB.ensure();
      const u={id:'qa',name:'QA',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]};
      DB.data.users=[u];Auth.user=u;Auth.enter();document.documentElement.classList.add('native-android');
      UmrahCore_DB.load();
    }""")
    # Sidebar groups must respond to actual pointer/click events.
    await page.evaluate("UI.openWorkspace('umrah');UI.setSidebarOpen(true)")
    await page.wait_for_timeout(80)
    groups=page.locator('#nav details.umrah-nav-group')
    n=await groups.count()
    checks['umrahGroups']=n>=5
    opened=0; navigated=0
    for i in range(n):
      g=groups.nth(i); summary=g.locator('summary')
      if not await g.evaluate("e=>e.open"):
        await summary.click(force=True)
      if await g.evaluate("e=>e.open"): opened+=1
      btn=g.locator('button[data-workspace-page]').first
      if await btn.count():
        target=await btn.get_attribute('data-workspace-page')
        await btn.click(force=True)
        try:
          await page.wait_for_function("target => UI.current === target", target, timeout=1000)
        except Exception:
          pass
        current=await page.evaluate("UI.current")
        if current==target:navigated+=1
        await page.evaluate("UI.setSidebarOpen(true)")
    checks['allGroupsOpen']=opened==n
    checks['allGroupsNavigate']=n>0 and navigated==n

    # Current lifecycle: closed programs are immutable history; cancelled + empty programs can be deleted; financial references stay protected.
    result=await page.evaluate("""() => {
      UmrahCore_DB.load();
      const base={no:'P-QA',name:'برنامج QA',programType:'umrah',seasonId:'',branchId:'',departureDate:'2026-09-01',returnDate:'2026-09-05',durationDays:5,capacity:10,currency:'SAR',active:true};
      UmrahCore_DB.data.programs=[{...base,id:'p-closed',status:'closed'},{...base,id:'p-free',status:'cancelled'},{...base,id:'p-fin',no:'P-FIN',status:'cancelled'}];
      DB.data.invoices=[{id:'inv-program',no:'INV',status:'posted',programId:'p-fin',lines:[]}];
      let free=false,blocked=false,closedProtected=false,financialRetained=false,msg='';
      try{DeleteCenter.remove('umrahProgram','p-closed')}catch(e){closedProtected=/المغلق|السجل/.test(String(e.message))}
      try{DeleteCenter.remove('umrahProgram','p-free');free=!UmrahCore_DB.data.programs.some(x=>x.id==='p-free')}catch(e){msg='free:'+e.message}
      try{const r=DeleteCenter.remove('umrahProgram','p-fin');const kept=UmrahCore_DB.data.programs.find(x=>x.id==='p-fin');financialRetained=!!(r?.retainedForAudit&&kept?.deleted===true&&kept?.active===false)}catch(e){blocked=true;msg=e.message}
      return {free,blocked,closedProtected,financialRetained,msg,financialStill:UmrahCore_DB.data.programs.some(x=>x.id==='p-fin')};
    }""")
    checks['closedProgramProtected']=result['closedProtected']
    checks['cancelledEmptyProgramDeletes']=result['free']
    checks['financialProgramAuditRetained']=result['financialRetained'] and result['financialStill']

    # Party files/activity: real attachment rows + five activity rows + delete controls.
    party=await page.evaluate("""() => {
      const c={id:'c69',no:'C0069',name:'عميل QA',type:'individual',currency:'EGP',active:true};
      DB.data.customers=[c];
      DB.data.attachments=[
        {id:'a1',entityType:'customer',entityId:c.id,name:'passport.pdf',fileName:'passport.pdf',mime:'application/pdf',createdAt:'2026-08-27T10:00:00Z'},
        {id:'a2',entityType:'customer',entityId:c.id,name:'photo.jpg',fileName:'photo.jpg',mime:'image/jpeg',createdAt:'2026-08-27T11:00:00Z'}
      ];
      DB.data.auditLog=[];
      for(let i=0;i<8;i++)DB.data.auditLog.push({id:'log'+i,date:`2026-08-27T1${i}:00:00Z`,action:'update',entity:'customer',entityId:c.id,summary:'نشاط '+i});
      const html=Party360.files('customer',c.id);
      const box=document.createElement('div');box.innerHTML=html;document.body.appendChild(box);
      return {rows:box.querySelectorAll('tbody tr').length,acts:box.querySelectorAll('.party360-activity').length,fileDelete:box.querySelectorAll('.party360-file-actions .danger').length,activityDelete:box.querySelectorAll('.party360-activity-actions .danger').length,text:box.textContent};
    }""")
    checks['attachmentsVisible']=party['rows']==2 and 'passport.pdf' in party['text'] and 'photo.jpg' in party['text']
    checks['attachmentDeleteVisible']=party['fileDelete']==2
    checks['activityLimitedFive']=party['acts']==5
    checks['activityDeleteVisible']=party['activityDelete']==5

    result={'ok':all(checks.values()) and not errors and not consoles,'checks':checks,'pageErrors':errors[:10],'consoleErrors':consoles[:10]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    await browser.close()
    if not result['ok']:sys.exit(1)

asyncio.run(main())
