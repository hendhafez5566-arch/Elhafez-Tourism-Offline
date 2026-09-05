import os, shutil
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
  errors=[]; console_errors=[]; results=[]; failed=[]
  async with async_playwright() as p:
    browser_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium') or shutil.which('chromium-browser') or shutil.which('google-chrome'); browser=await p.chromium.launch(headless=True, executable_path=browser_path or None, args=['--no-sandbox','--disable-dev-shm-usage'])
    page=await browser.new_page(viewport={'width':390,'height':844})
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.on('console', lambda m: console_errors.append(m.text) if m.type=='error' else None)
    await page.set_content(index, wait_until='domcontentloaded', timeout=30000)
    await page.wait_for_timeout(250)
    await page.evaluate("""() => {
      DataStore.localPut=async()=>true; DataStore.put=async()=>({local:true,remote:false,serverAvailable:false});
      ServerStore.available=false; ServerStore.authenticated=false;
      DB.data=deep(Seed); DB.data.meta.setupComplete=true; DB.ensure();
      const u={id:'qa-admin',name:'QA Admin',username:'qa',role:'admin',active:true,onboardingSeen:true,permissions:{all:true},allowedBranchIds:[]};
      DB.data.users=[u]; DB.data.license={...(DB.data.license||{}),edition:'enterprise',modules:['whatsapp','umrah']}; Auth.user=u; Auth.enter(); document.documentElement.classList.add('native-android'); window.__waCalls=[]; window.NativeShell={...(window.NativeShell||{}),openWhatsAppChat:(phone,text)=>window.__waCalls.push({phone:String(phone||''),text:String(text||'')})};
      const customer={id:'qa-customer',no:'C-QA',name:'عميل اختبار الإجراءات',type:'individual',currency:'EGP',phone:'01000000001',whatsapp:'01000000001',active:true};
      const supplier={id:'qa-supplier',no:'S-QA',name:'مورد اختبار الإجراءات',type:'hotel',currency:'EGP',phone:'01000000002',whatsapp:'01000000002',active:true};
      const agent={id:'qa-agent',no:'A-QA',name:'مندوب اختبار الإجراءات',currency:'EGP',phone:'01000000003',whatsapp:'01000000003',active:true};
      DB.data.customers=[customer]; DB.data.suppliers=[supplier]; DB.data.agents=[agent];
      // Stress the heavy lists so More tabs are exercised against realistic volume.
      DB.data.invoices=[]; DB.data.services=[]; DB.data.receipts=[]; DB.data.payments=[]; DB.data.bookings=[]; DB.data.umrahBookings=[]; DB.data.purchaseOrders=[]; DB.data.commissions=[]; DB.data.attachments=[];
      for(let i=0;i<450;i++){
        DB.data.invoices.push({id:'ci'+i,no:'CI'+i,date:'2026-08-27',partyId:customer.id,partyType:'customer',kind:'customer',currency:'EGP',status:'posted',lines:[],active:true,createdAt:'2026-08-27T12:00:00Z'});
        DB.data.services.push({id:'sv'+i,no:'SV'+i,date:'2026-08-27',customerId:customer.id,supplierId:supplier.id,agentId:agent.id,currency:'EGP',status:'draft',active:true,createdAt:'2026-08-27T12:00:00Z'});
        DB.data.receipts.push({id:'rc'+i,no:'RC'+i,date:'2026-08-27',partyId:customer.id,partyType:'customer',amount:1,currency:'EGP',status:'posted',active:true,createdAt:'2026-08-27T12:00:00Z'});
        DB.data.payments.push({id:'pm'+i,no:'PM'+i,date:'2026-08-27',partyId:supplier.id,partyType:'supplier',amount:1,currency:'EGP',status:'posted',active:true,createdAt:'2026-08-27T12:00:00Z'});
      }
      DB.data.invoices.push({id:'si0',no:'SI0',date:'2026-08-27',partyId:supplier.id,kind:'supplier',currency:'EGP',status:'posted',lines:[],active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.invoices.push({id:'ai0',no:'AI0',date:'2026-08-27',partyId:agent.id,partyType:'agent',kind:'customer',currency:'EGP',status:'posted',lines:[],active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.receipts.push({id:'ar0',no:'AR0',date:'2026-08-27',partyId:agent.id,partyType:'agent',amount:1,currency:'EGP',status:'posted',active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.payments.push({id:'ap0',no:'AP0',date:'2026-08-27',partyId:agent.id,partyType:'agent',amount:1,currency:'EGP',status:'posted',active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.commissions.push({id:'co0',no:'CO0',agentId:agent.id,amount:100,paidAmount:0,currency:'EGP',status:'approved',createdAt:'2026-08-27T12:00:00Z'});
      DB.data.purchaseOrders.push({id:'po0',no:'PO0',supplierId:supplier.id,date:'2026-08-27',currency:'EGP',status:'draft',lines:[],active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.umrahBookings.push({id:'ub0',no:'UB0',customerId:customer.id,programId:'up0',date:'2026-08-27',persons:2,status:'draft',active:true,createdAt:'2026-08-27T12:00:00Z'});
      DB.data.umrahPrograms=[{id:'up0',no:'UP0',name:'برنامج QA',status:'draft',active:true,currency:'SAR'}];
      DB.data.attachments.push({id:'attc',entityType:'customer',entityId:customer.id,name:'a.pdf',category:'other',date:'2026-08-27',active:true});
      DB.data.attachments.push({id:'atts',entityType:'supplier',entityId:supplier.id,name:'s.pdf',category:'other',date:'2026-08-27',active:true});
      DB.data.attachments.push({id:'atta',entityType:'agent',entityId:agent.id,name:'g.pdf',category:'other',date:'2026-08-27',active:true});
    }""")

    async def modal_title():
      return await page.locator('#modalTitle').inner_text()

    async def close_child_and_expect(parent_prefix):
      # print modal is independent; close it first when present.
      if await page.locator('#printModal').evaluate("e=>e.classList.contains('show')"):
        await page.evaluate('Print.close()')
      if await page.locator('#modal').evaluate("e=>e.classList.contains('show')"):
        title=await modal_title()
        if not title.startswith(parent_prefix):
          await page.evaluate('UI.closeModal(true)')
          await page.wait_for_timeout(20)
      return await modal_title() if await page.locator('#modal').evaluate("e=>e.classList.contains('show')") else ''

    async def test_action_menu(ptype,pid):
      before_err=len(errors)+len(console_errors)
      t0=time.perf_counter(); await page.evaluate("([t,id])=>Actions.openPartyActions(t,id)",[ptype,pid]); await page.wait_for_timeout(20)
      open_ms=(time.perf_counter()-t0)*1000
      if open_ms>700: failed.append({'scope':ptype,'button':'الإجراءات','reason':f'slow open {open_ms:.1f}ms'})
      buttons=await page.locator('#modalBody .action-menu-grid button').all_inner_texts()
      for label in buttons:
        parent='إجراءات'
        # Always reopen the exact action menu before each click.
        await page.evaluate("([t,id])=>{UI.closeModalAll(true);Actions.openPartyActions(t,id)}",[ptype,pid]); await page.wait_for_timeout(10)
        locator=page.locator('#modalBody .action-menu-grid button').filter(has_text=label).first
        e0=len(errors)+len(console_errors); t=time.perf_counter()
        try:
          await locator.dispatch_event('pointerdown'); await locator.evaluate('el=>el.click()')
          await page.wait_for_timeout(40)
          ms=(time.perf_counter()-t)*1000
          if ms>900: failed.append({'scope':ptype,'button':label,'reason':f'slow click {ms:.1f}ms'})
          if len(errors)+len(console_errors)>e0: failed.append({'scope':ptype,'button':label,'reason':'runtime/console error'})
          # Statement opens a child options modal; other form actions do too. Closing must restore Actions.
          current=await modal_title() if await page.locator('#modal').evaluate("e=>e.classList.contains('show')") else ''
          if current and not current.startswith(parent):
            await page.evaluate('UI.closeModal(true)'); await page.wait_for_timeout(20)
            restored=await modal_title() if await page.locator('#modal').evaluate("e=>e.classList.contains('show')") else ''
            if not restored.startswith(parent): failed.append({'scope':ptype,'button':label,'reason':f'parent modal not restored: {restored}'})
          results.append({'scope':ptype,'area':'actions','button':label,'ms':round(ms,1)})
        except Exception as ex:
          failed.append({'scope':ptype,'button':label,'reason':str(ex)})
      await page.evaluate('UI.closeModalAll(true)')
      if len(errors)+len(console_errors)>before_err: failed.append({'scope':ptype,'button':'الإجراءات','reason':'errors while testing menu'})
      results.append({'scope':ptype,'area':'actions','button':'OPEN','ms':round(open_ms,1)})

    async def test_more(ptype,pid):
      await page.evaluate('UI.closeModalAll(true)')
      e0=len(errors)+len(console_errors); t=time.perf_counter(); await page.evaluate("([t,id])=>Party360.openMore(t,id)",[ptype,pid]); await page.wait_for_timeout(30)
      open_ms=(time.perf_counter()-t)*1000
      if open_ms>500: failed.append({'scope':ptype,'button':'المزيد','reason':f'slow shell open {open_ms:.1f}ms'})
      if len(errors)+len(console_errors)>e0: failed.append({'scope':ptype,'button':'المزيد','reason':'runtime/console error on open'})
      results.append({'scope':ptype,'area':'more','button':'OPEN','ms':round(open_ms,1)})
      # Every More tab must load quickly and remain interactive.
      tabs=await page.locator('#modalBody .party360-tab').all_inner_texts()
      for label in tabs:
        print('  TAB',ptype,repr(label),flush=True)
        loc=page.locator('#modalBody .party360-tab').filter(has_text=label).first
        e1=len(errors)+len(console_errors); t=time.perf_counter(); await loc.dispatch_event('pointerdown'); await loc.evaluate('el=>el.click()')
        try:
          await page.wait_for_function("() => !document.querySelector('#modalBody .party360-loading')", timeout=750)
        except Exception:
          pass
        ms=(time.perf_counter()-t)*1000
        loading=await page.locator('#modalBody .party360-loading').count()
        if ms>800: failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':f'slow tab {ms:.1f}ms'})
        if loading: failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':'tab still loading'})
        if len(errors)+len(console_errors)>e1: failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':'runtime/console error'})
        results.append({'scope':ptype,'area':'more-tab','button':label,'ms':round(ms,1)})
      # Management buttons: edit, direct WhatsApp, documents, suspend and delete.
      await page.evaluate("([t,id])=>{UI.closeModalAll(true);Party360.openMore(t,id)}",[ptype,pid]); await page.wait_for_timeout(30)
      manage=await page.locator('#modalBody .party-more-manage').all_inner_texts()
      for label in manage:
        print('  MANAGE',ptype,repr(label),flush=True)
        await page.evaluate("([t,id])=>{UI.closeModalAll(true);Party360.openMore(t,id)}",[ptype,pid]); await page.wait_for_timeout(20)
        loc=page.locator('#modalBody .party-more-manage').filter(has_text=label).first
        # Delete is intentionally locked while the party is active. Verify the guard,
        # then suspend only inside the QA fixture so the safe-delete child can be tested too.
        if label.strip()=='حذف':
          disabled=await loc.is_disabled()
          if not disabled: failed.append({'scope':ptype,'button':'المزيد/حذف','reason':'delete must be disabled before suspension'})
          await page.evaluate("([t,id])=>{const cfg=Party360.config(t);const x=byId(DB.data[cfg.list],id);x.active=false;Party360.invalidate();UI.closeModalAll(true);Party360.openMore(t,id)}",[ptype,pid]); await page.wait_for_timeout(25)
          loc=page.locator('#modalBody .party-more-manage').filter(has_text=label).first
          if await loc.is_disabled(): failed.append({'scope':ptype,'button':'المزيد/حذف','reason':'delete did not unlock after suspension'})
        e1=len(errors)+len(console_errors); t=time.perf_counter()
        try:
          await loc.dispatch_event('pointerdown'); await loc.evaluate('el=>el.click()'); await page.wait_for_timeout(40); ms=(time.perf_counter()-t)*1000
          if ms>900: failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':f'slow child open {ms:.1f}ms'})
          if len(errors)+len(console_errors)>e1: failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':'runtime/console error'})
          if label.strip()=='واتساب':
            calls=await page.evaluate('window.__waCalls||[]')
            expected={'customer':'201000000001','supplier':'201000000002','agent':'201000000003'}[ptype]
            if not calls or calls[-1].get('phone')!=expected:
              failed.append({'scope':ptype,'button':'المزيد/واتساب','reason':f'direct saved-number chat not targeted: {calls[-1] if calls else None}'})
            title=await modal_title()
            if not title.startswith('المزيد'):
              failed.append({'scope':ptype,'button':'المزيد/واتساب','reason':f'More should remain visible after direct chat launch: {title}'})
          else:
            title=await modal_title()
            if title.startswith('المزيد'):
              failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':'child dialog did not open'})
            # Documents is a real-document child. Ensure it exposes real categories.
            if label.strip()=='المستندات':
              doc_text=await page.locator('#modalBody').inner_text()
              if 'كشف الحساب' not in doc_text or 'الفواتير' not in doc_text:
                failed.append({'scope':ptype,'button':'المزيد/المستندات','reason':'real document categories missing'})
            await page.evaluate('UI.closeModal(true)'); await page.wait_for_timeout(25)
            restored=await modal_title() if await page.locator('#modal').evaluate("e=>e.classList.contains('show')") else ''
            if not restored.startswith('المزيد'):
              failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':f'More parent not restored: {restored}'})
          results.append({'scope':ptype,'area':'more-manage','button':label,'ms':round(ms,1)})
          if label.strip()=='حذف':
            await page.evaluate("([t,id])=>{const cfg=Party360.config(t);const x=byId(DB.data[cfg.list],id);if(x)x.active=true;Party360.invalidate()}",[ptype,pid])
        except Exception as ex:
          failed.append({'scope':ptype,'button':f'المزيد/{label}','reason':str(ex)})
      await page.evaluate('UI.closeModalAll(true)')

    for ptype,pid in [('customer','qa-customer'),('supplier','qa-supplier'),('agent','qa-agent')]:
      print('TEST',ptype,'actions',flush=True); await test_action_menu(ptype,pid)
      print('TEST',ptype,'more',flush=True); await test_more(ptype,pid)

    # Real-document regression: More -> Documents -> existing invoice -> Print preview,
    # then close back through the exact modal ancestry without creating any accounting record.
    before_counts=await page.evaluate("() => ({invoices:DB.data.invoices.length,receipts:DB.data.receipts.length,payments:DB.data.payments.length,journals:DB.data.journals.length})")
    await page.evaluate("() => {UI.closeModalAll(true);Party360.openMore('customer','qa-customer')}"); await page.wait_for_timeout(25)
    await page.locator('#modalBody .party-more-manage').filter(has_text='المستندات').first.click(); await page.wait_for_timeout(35)
    await page.locator('#modalBody [data-party-document-group="invoices"]').first.click(); await page.wait_for_timeout(35)
    await page.locator('#modalBody [data-party-document-open="invoices"]').first.click(); await page.wait_for_timeout(50)
    if not await page.locator('#printModal').evaluate("e=>e.classList.contains('show')"):
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':'real invoice did not open Print preview'})
    if 'فاتورة' not in await page.locator('#printBody').inner_text():
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':'print preview is not the real invoice document'})
    await page.evaluate('Print.close()'); await page.wait_for_timeout(15)
    if not (await modal_title()).startswith('الفواتير'):
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':'document list was not preserved under print preview'})
    await page.evaluate('UI.closeModal(true)'); await page.wait_for_timeout(15)
    if not (await modal_title()).startswith('المستندات'):
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':'documents parent was not restored'})
    await page.evaluate('UI.closeModal(true)'); await page.wait_for_timeout(15)
    if not (await modal_title()).startswith('المزيد'):
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':'More parent was not restored'})
    after_counts=await page.evaluate("() => ({invoices:DB.data.invoices.length,receipts:DB.data.receipts.length,payments:DB.data.payments.length,journals:DB.data.journals.length})")
    if before_counts!=after_counts:
      failed.append({'scope':'customer','button':'المستندات/فاتورة','reason':f'document browsing mutated accounting/business counts: {before_counts} -> {after_counts}'})
    results.append({'scope':'customer','area':'documents','button':'real-invoice-print','ms':0})
    await page.evaluate('UI.closeModalAll(true)')

    # Regression: suspending a party from More must update both the restored More header
    # and the list behind it immediately; no manual refresh is allowed.
    await page.evaluate("""() => {
      UI.closeModalAll(true);
      const x=byId(DB.data.customers,'qa-customer');x.active=true;Party360.invalidate();
      UI.openPage('customers');Party360.openMore('customer','qa-customer');
    }""")
    await page.wait_for_timeout(40)
    await page.evaluate("Party360.toggleSuspended('customer','qa-customer')")
    await page.wait_for_timeout(20)
    await page.evaluate("document.getElementById('modalForm').requestSubmit()")
    await page.wait_for_timeout(160)
    live_state=await page.evaluate("""() => ({
      active:byId(DB.data.customers,'qa-customer')?.active,
      pageText:document.getElementById('pages')?.innerText||'',
      modalStatus:document.querySelector('#modal.show [data-party-more-status]')?.textContent||''
    })""")
    if live_state['active'] is not False: failed.append({'scope':'customer','button':'تعليق','reason':'data status did not change'})
    if 'موقوف' not in live_state['pageText']: failed.append({'scope':'customer','button':'تعليق','reason':'customer list did not refresh live'})
    if 'موقوف' not in live_state['modalStatus']: failed.append({'scope':'customer','button':'تعليق','reason':'More header did not refresh live'})
    results.append({'scope':'customer','area':'live-mutation','button':'تعليق','ms':0})
    await page.evaluate("UI.closeModalAll(true)")

    # A short event-loop freeze probe: repeated More open/close should not starve a 50ms timer badly.
    lag=await page.evaluate("""async()=>{let worst=0;for(const [t,id] of [['customer','qa-customer'],['supplier','qa-supplier'],['agent','qa-agent']]){for(let i=0;i<5;i++){const start=performance.now();const timer=new Promise(r=>setTimeout(()=>r(performance.now()-start),50));Party360.openMore(t,id);UI.closeModalAll(true);worst=Math.max(worst,await timer)}}return worst}""")
    if lag>350: failed.append({'scope':'all','button':'freeze-probe','reason':f'event-loop lag {lag:.1f}ms'})

    result={'ok':not failed and not errors and not console_errors,'failed':failed,'pageErrors':errors[:20],'consoleErrors':console_errors[:20],'results':results,'worstTimerMs':round(lag,1)}
    print(json.dumps(result,ensure_ascii=False,indent=2))
    await browser.close()
    if not result['ok']: sys.exit(1)

asyncio.run(main())
