(async()=>{
  // Never leave credentials in the address bar/history, even if an older
  // login form previously fell back to a native GET submission.
  try{
    if(typeof location!=='undefined'&&typeof location.href==='string'&&location.href){
      const url=new URL(location.href);
      if(url.searchParams.has('username')||url.searchParams.has('password')){
        url.searchParams.delete('username');
        url.searchParams.delete('password');
        history.replaceState(null,'',url.pathname+(url.search||'')+(url.hash||''));
      }
    }
  }catch(e){console.error('[bootstrap] failed to sanitize login URL',e)}

  const showOfflineBoot=(title='لا يوجد اتصال بالإنترنت',detail='يحتاج النظام للاتصال بخادم الشركة لحماية ومزامنة البيانات.')=>{
    try{
      document.getElementById('login')?.classList.remove('hidden');
      document.getElementById('app')?.classList.add('hidden');
      document.getElementById('loginForm')?.classList.add('hidden');
      const boot=document.getElementById('authBootBrand'),box=document.getElementById('authBootOffline');
      boot?.classList.remove('hidden');boot?.classList.add('offline');box?.classList.remove('hidden');
      const h=document.getElementById('authBootOfflineTitle'),t=document.getElementById('authBootOfflineText');
      if(h)h.textContent=title;if(t)t.textContent=detail;
    }catch(e){console.error('[bootstrap] offline screen failed',e)}
  };

  const remoteRequired=ServerStore.remoteRequired?.()===true;
  if(remoteRequired&&typeof navigator!=='undefined'&&navigator.onLine===false){
    showOfflineBoot();
    window.addEventListener('online',()=>location.reload(),{once:true});
    return;
  }

  // Block any native form submission immediately, but do not render a login
  // card until /api/bootstrap tells us whether this is Login or First Setup.
  // This guarantees that refresh/first-run never flashes the wrong auth UI.
  try{
    const loginForm=document.getElementById('loginForm');
    loginForm?.addEventListener('submit',e=>e.preventDefault());
  }catch(e){console.error('[bootstrap] early auth guard failed',e)}

  try{
    await DB.init();
  }catch(e){
    console.error('[bootstrap] DB.init failed',e);
    try{await Auth.init()}catch(authError){console.error('[bootstrap] Auth.init after DB failure failed',authError)}
    if(typeof Auth!=='undefined'&&!Auth.user)Auth.showServerUnavailable?.(e?.message||'تعذر تهيئة بيانات النظام');
    return;
  }

  // Keep the permanent login DOM branded immediately after /api/bootstrap.
  // This avoids a second visual login state during refresh.
  try{UI.applyBrand(true)}catch(e){console.error('[bootstrap] login branding failed',e)}

  // Apply the synchronous commercial data normalization first, but never let
  // auxiliary vendor networking sit in front of authentication/ERP entry.
  try{await Commercial.afterInit()}catch(e){console.error('[bootstrap] Commercial.afterInit failed',e)}
  try{VendorOwner.applyStatus(ServerStore.vendor,false)}catch(e){console.error('[bootstrap] vendor status apply failed',e)}
  try{const w=DB.data.settings?.workspaces?.find(x=>x.id==='admin');if(w){let changed=false;if(!w.pages.includes('backup-center')){w.pages.splice(Math.min(1,w.pages.length),0,'backup-center');changed=true}if(!w.pages.includes('period-archiving')){w.pages.splice(Math.min(2,w.pages.length),0,'period-archiving');changed=true}if(changed){DB.data.meta.dataProtectionV2=true;DB.save(false)}}}catch(e){console.error('[bootstrap] data protection navigation migration failed',e)}

  try{
    await Auth.init();
  }catch(e){
    console.error('[bootstrap] Auth.init failed',e);
    const message='تعذر إكمال تهيئة واجهة النظام بعد التحقق من الجلسة: '+(e?.message||e);
    if(typeof Auth!=='undefined')Auth.showLogin?.(message);
    else if(typeof toast==='function')toast(message,'error');
  }

  // Vendor center discovery is optional and must never block login. Run it
  // only after Auth.init has had the opportunity to enter the ERP.
  try{Promise.resolve(VendorOwner.init()).catch(e=>console.error('[bootstrap] VendorOwner.init failed',e))}catch(e){console.error('[bootstrap] VendorOwner.init start failed',e)}
})();
