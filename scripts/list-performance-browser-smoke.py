import os, shutil
import asyncio, json, pathlib, re, sys, time, os, shutil
from playwright.async_api import async_playwright
ROOT=pathlib.Path(__file__).resolve().parents[1]
index=(ROOT/'dist/index.html').read_text(errors='ignore')
css=(ROOT/'dist/styles.css').read_text(errors='ignore')
js=(ROOT/'dist/app.js').read_text(errors='ignore')
index=re.sub(r'<link[^>]+href="[^\"]*styles\.css[^\"]*"[^>]*>', '<style>'+css+'</style>', index)
index=re.sub(r'<script\s+defer\s+src="[^\"]*app\.js[^\"]*"\s*></script>', lambda _:'<script>'+js.replace('</script>','<\\/script>')+'</script>', index)
storage="""<script>(()=>{const make=()=>({_:{},setItem(k,v){this._[String(k)]=String(v)},getItem(k){return Object.prototype.hasOwnProperty.call(this._,String(k))?this._[String(k)]:null},removeItem(k){delete this._[String(k)]},clear(){this._={}},key(i){return Object.keys(this._)[i]??null},get length(){return Object.keys(this._).length}});try{Object.defineProperty(window,'localStorage',{value:make()})}catch(_){}try{Object.defineProperty(window,'sessionStorage',{value:make()})}catch(_){} })();</script>"""
index=index.replace('<head>','<head>'+storage,1)

async def main():
  async with async_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True, executable_path=browser_path or None, args=['--no-sandbox','--disable-dev-shm-usage','--js-flags=--max-old-space-size=2048'])
    page=await browser.new_page(viewport={'width':1440,'height':900})
    errors=[]
    page.on('pageerror',lambda e:errors.append(str(e)))
    await page.set_content(index,wait_until='domcontentloaded',timeout=30000)
    await page.evaluate("""() => {
      DataStore.localPut=async()=>true; DataStore.put=async()=>({local:true,remote:false,serverAvailable:false}); ServerStore.available=false; ServerStore.authenticated=false;
      DB.data=deep(Seed); DB.data.meta.setupComplete=true; DB.ensure();
      const u={id:'qa-admin',name:'QA Admin',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]}; DB.data.users=[u]; Auth.user=u;
      DB.data.customers=Array.from({length:5000},(_,i)=>({id:'c'+i,no:'C'+String(i+1).padStart(6,'0'),name:'عميل اختبار '+i,type:'individual',currency:'EGP',phone:'010'+String(i).padStart(8,'0'),email:'c'+i+'@test.local',active:i%31!==0}));
      DB.data.suppliers=Array.from({length:2500},(_,i)=>({id:'s'+i,no:'S'+String(i+1).padStart(6,'0'),name:'مورد اختبار '+i,type:'hotel',currency:'EGP',phone:'011'+String(i).padStart(8,'0'),active:i%37!==0}));
      DB.data.invoices=Array.from({length:25000},(_,i)=>({id:'inv'+i,no:'SI'+String(i+1).padStart(7,'0'),kind:'customer',partyType:'customer',partyId:'c'+(i%5000),currency:'EGP',date:'2026-08-'+String(1+(i%28)).padStart(2,'0'),dueDate:'2026-09-'+String(1+(i%28)).padStart(2,'0'),status:'open',baseRate:1,lines:[{id:'l'+i,qty:1,price:100+(i%50),discount:0,discountMode:'amount',taxId:'TAX0'}]}));
      DB.data.receipts=Array.from({length:12500},(_,i)=>({id:'r'+i,no:'R'+i,date:'2026-08-20',partyType:'customer',partyId:'c'+(i%5000),currency:'EGP',amount:50,paymentMethod:'cash',status:'posted',allocations:[{invoiceId:'inv'+(i*2),invoiceAmount:50}]}));
      DB.data.payments=[]; DB.data.invoiceAdjustments=[];
      DB.data.journals=Array.from({length:50000},(_,i)=>({id:'j'+i,no:'J'+i,date:'2026-08-15',status:'posted',memo:'اختبار ضغط',refType:'stress',refId:'j'+i,lines:[{id:'jd'+i,accountId:'1200',partyType:'customer',partyId:'c'+(i%5000),currency:'EGP',debit:100,credit:0,baseDebit:100,baseCredit:0},{id:'jc'+i,accountId:'4000',partyType:'',partyId:'',currency:'EGP',debit:0,credit:100,baseDebit:0,baseCredit:100}]}));
      Accounting.invalidateLineCache(); UI._lazyTables.clear();
    }""")
    async def bench(expr):
      return await page.evaluate(expr)
    customers=await bench("""() => {UI.current='customers';UI._lazyTables.clear();const t=performance.now(),html=CleanPages.customers(),gen=performance.now()-t;document.getElementById('pages').innerHTML='<section class="page active">'+html+'</section>';UI.enhanceResponsiveTables(document.getElementById('pages'));const total=performance.now()-t;return {genMs:gen,totalMs:total,rows:document.querySelectorAll('#pages tbody tr:not(:has(td.empty))').length,count:document.querySelector('#pages .table-count')?.textContent||'',pager:document.querySelector('#pages .table-page-status')?.textContent||''}}""")
    search_customer=await bench("""() => {const input=document.querySelector('#pages .table-search input');input.value='عميل اختبار 4999';const t=performance.now();UI.filterTable(input);return {ms:performance.now()-t,rows:document.querySelectorAll('#pages tbody tr:not(:has(td.empty))').length,count:document.querySelector('#pages .table-count')?.textContent||'',text:document.querySelector('#pages tbody')?.innerText||''}}""")
    suppliers=await bench("""() => {UI.current='suppliers';UI._lazyTables.clear();const t=performance.now(),html=CleanPages.suppliers(),gen=performance.now()-t;document.getElementById('pages').innerHTML='<section class="page active">'+html+'</section>';UI.enhanceResponsiveTables(document.getElementById('pages'));return {genMs:gen,totalMs:performance.now()-t,rows:document.querySelectorAll('#pages tbody tr:not(:has(td.empty))').length,count:document.querySelector('#pages .table-count')?.textContent||''}}""")
    invoices=await bench("""() => {UI.current='invoices';CleanPages.invoiceKind='customer';UI.listFilters.invoices='all';UI._lazyTables.clear();const t=performance.now(),html=CleanPages.invoices(),gen=performance.now()-t;document.getElementById('pages').innerHTML='<section class="page active">'+html+'</section>';UI.enhanceResponsiveTables(document.getElementById('pages'));return {genMs:gen,totalMs:performance.now()-t,rows:document.querySelectorAll('#pages tbody tr:not(:has(td.empty))').length,count:document.querySelector('#pages .table-count')?.textContent||'',pager:document.querySelector('#pages .table-page-status')?.textContent||''}}""")
    search_invoice=await bench("""() => {const input=document.querySelector('#pages .table-search input');input.value='SI0025000';const t=performance.now();UI.filterTable(input);return {ms:performance.now()-t,rows:document.querySelectorAll('#pages tbody tr:not(:has(td.empty))').length,count:document.querySelector('#pages .table-count')?.textContent||'',text:document.querySelector('#pages tbody')?.innerText||''}}""")
    result={'ok':not errors and customers['rows']<=25 and suppliers['rows']<=25 and invoices['rows']<=25 and '4999' in search_customer['text'] and 'SI0025000' in search_invoice['text'],'dataset':{'customers':5000,'suppliers':2500,'invoices':25000,'receipts':12500,'journals':50000,'journalLines':100000},'customers':customers,'customerSearch':search_customer,'suppliers':suppliers,'invoices':invoices,'invoiceSearch':search_invoice,'pageErrors':errors[:10]}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    await browser.close()
    if not result['ok']: sys.exit(1)
asyncio.run(main())
