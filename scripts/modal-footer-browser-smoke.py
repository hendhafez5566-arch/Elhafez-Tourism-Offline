import asyncio, pathlib, re, json, os, shutil
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'dist/index.html').read_text(errors='ignore'); css=(ROOT/'dist/styles.css').read_text(errors='ignore'); js=(ROOT/'dist/app.js').read_text(errors='ignore')
index=re.sub(r'<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>', '<style>'+css+'</style>', index)
index=re.sub(r'<script\s+defer\s+src="[^\"]*app\.js[^\"]*"\s*></script>', lambda _:'<script>'+js.replace('</script>','<\\/script>')+'</script>', index)
storage="""<script>(()=>{const make=()=>({_:{},setItem(k,v){this._[String(k)]=String(v)},getItem(k){return Object.prototype.hasOwnProperty.call(this._,String(k))?this._[String(k)]:null},removeItem(k){delete this._[String(k)]},clear(){this._={}},key(i){return Object.keys(this._)[i]??null},get length(){return Object.keys(this._).length}});try{Object.defineProperty(window,'localStorage',{value:make()})}catch(_){}try{Object.defineProperty(window,'sessionStorage',{value:make()})}catch(_){} })();</script>"""
index=index.replace('<head>','<head>'+storage,1)
async def main():
 out={'ok':True,'checks':[],'pageErrors':[],'consoleErrors':[]}
 def ck(name,p): out['checks'].append({'name':name,'pass':bool(p)}); out.__setitem__('ok',out['ok'] and bool(p))
 async with async_playwright() as p:
  browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True,executable_path=browser_path or None,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':390,'height':844}); page.on('pageerror',lambda e:out['pageErrors'].append(str(e))); page.on('console',lambda m:out['consoleErrors'].append(m.text) if m.type=='error' else None)
  await page.set_content(index,wait_until='domcontentloaded'); await page.wait_for_timeout(120)
  await page.evaluate("""()=>{DataStore.localPut=async()=>true;DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});ServerStore.available=false;DB.data=deep(Seed);DB.data.meta.setupComplete=true;DB.ensure();const u={id:'u',name:'QA',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true}};DB.data.users=[u];Auth.user=u;Auth.enter();DB.data.customers=[{id:'c1',no:'C1',name:'عميل',currency:'EGP',active:true}];if(!DB.data.treasuries.length)Transactions.createTreasury({name:'خزنة',type:'cash',currency:'EGP',opening:0,date:today(),silent:true});}""")
  # A view-only Umrah modal used to leak hidden submit state.
  await page.evaluate("UmrahCore_Forms.view('عرض فقط','اختبار','<div>عرض</div>')"); await page.wait_for_timeout(20)
  hidden=await page.locator('#modalFoot button[type=submit]').evaluate("b=>getComputedStyle(b).display==='none'"); ck('view-only modal hides submit',hidden)
  await page.evaluate('UmrahCore_Forms.close()');
  await page.evaluate("Forms.open('receipt',{partyType:'customer',partyId:'c1'})"); await page.wait_for_timeout(30)
  vis=await page.locator('#modalFoot button[type=submit]').is_visible(); txt=(await page.locator('#modalSubmitText').inner_text()).strip(); ck('receipt restores visible save/confirm button',vis and len(txt)>0)
  await page.evaluate('UI.closeModalAll(true)')
  await page.evaluate("Forms.open('attachment',{entityType:'customer',entityId:'c1'})"); await page.wait_for_timeout(30)
  ck('attachment form has visible submit button',await page.locator('#modalFoot button[type=submit]').is_visible())
  await page.evaluate('UI.closeModalAll(true)')
  await page.evaluate("UI.confirmAction('حذف السجل','اختبار',()=>{})"); await page.wait_for_timeout(20)
  ck('delete confirmation exposes executable delete button',(await page.locator('#modalSubmitText').inner_text()).strip()=='تأكيد' and await page.locator('#modalFoot button[type=submit]').is_visible())
  await page.evaluate("DB.data.customers.push({id:'c2',no:'C2',name:'غير مرتبط',currency:'EGP',active:false},{id:'c3',no:'C3',name:'مرتبط',currency:'EGP',active:false});DB.data.invoices.push({id:'inv-c3',no:'I3',partyId:'c3',partyType:'customer',kind:'customer',status:'posted',active:true,lines:[]})")
  await page.evaluate("DeleteCenter.execute('customer','c2')"); ck('safe delete removes suspended unlinked master record',not await page.evaluate("DB.data.customers.some(x=>x.id==='c2')"))
  blocked=await page.evaluate("async()=>{try{await DeleteCenter.execute('customer','c3');return false}catch(e){return /مرتبط|مستخدم|حركات|عمليات/.test(String(e.message))}}"); ck('safe delete blocks suspended linked master record',blocked and await page.evaluate("DB.data.customers.some(x=>x.id==='c3')"))
  ck('no runtime errors',not out['pageErrors'] and not out['consoleErrors'])
  await browser.close()
 print(json.dumps(out,ensure_ascii=False,indent=2)); raise SystemExit(0 if out['ok'] else 1)
asyncio.run(main())
