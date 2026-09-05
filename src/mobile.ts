/* Native Android shell integration. Kept dependency-free so the web/PWA build still works. */
(() => {
 const bridge=(window as any).Capacitor;
 const nativeShell=(window as any).NativeShell;
 const capacitorNative=bridge?.isNativePlatform?.()===true;
 let shellNative=false;try{shellNative=nativeShell?.isNative?.()===true}catch(_){}
 if(!capacitorNative&&!shellNative)return;
 document.documentElement.classList.add('native-android');
 const offlineEdition=APP.offlineEdition===true;
 if(offlineEdition)document.documentElement.classList.add('native-local-only');
 // Customer starts on a local resolver then navigates to its own Railway origin.
 // The WebView-level NativeShell interface survives that navigation even when
 // Capacitor's injected object is not present on the remote page.
 try{
  navigator.serviceWorker?.getRegistrations?.().then((rows:any[])=>rows.forEach(r=>r.unregister().catch?.(()=>{}))).catch(()=>{});
  if(typeof caches!=='undefined')caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('erp-shell-')).map(k=>caches.delete(k)))).catch(()=>{});
 }catch(_){}

 const FALLBACK_API_BASE=offlineEdition?'':'https://zonal-charm-production.up.railway.app';
 const API_BASE=offlineEdition?'':(/^https?:$/.test(location.protocol)&&location.hostname&&!/^(localhost|127(?:\.\d+){3}|\[::1\])$/i.test(location.hostname)?location.origin:FALLBACK_API_BASE);
 const nativeFetch=window.fetch.bind(window);
 const apiUrl=(input:any)=>{
  const raw=typeof input==='string'?input:input instanceof URL?input.href:input instanceof Request?input.url:'';
  if(!raw)return'';
  if(raw.startsWith('/api/'))return API_BASE+raw;
  try{const u=new URL(raw,location.href);if(u.origin===location.origin&&u.pathname.startsWith('/api/'))return API_BASE+u.pathname+u.search+u.hash}catch(_){}
  return'';
 };
 const mergeHeaders=(input:any,init:any)=>{
  const h=new Headers(input instanceof Request?input.headers:undefined);
  if(init?.headers)new Headers(init.headers).forEach((v,k)=>h.set(k,v));
  h.set('X-ERP-Mobile','android');
  h.set('X-ERP-Mobile-Version','32.5.46-OFFLINE');
  return h;
 };
 if(!offlineEdition)window.fetch=(async(input:any,init:any={})=>{
  const target=apiUrl(input);
  if(!target)return nativeFetch(input,init);
  const options:any={...init,headers:mergeHeaders(input,init),credentials:'include'};
  if(input instanceof Request){
   if(options.method==null)options.method=input.method;
   if(options.body==null&&input.method!=='GET'&&input.method!=='HEAD'){
    try{options.body=await input.clone().arrayBuffer()}catch(_){}
   }
  }
  const response=await nativeFetch(target,options);
  return response;
 }) as typeof window.fetch;

 (window as any).ERP_MOBILE={
  apiBase:API_BASE,
  clearSession:()=>{},
  isNative:true,
  shell:shellNative?'native-shell':'capacitor'
 };

 const nativePrint=(window as any).NativePrint;
 if(nativePrint?.printCurrent){
  const fallbackPrint=window.print.bind(window);
  window.print=(()=>{try{nativePrint.printCurrent(`${APP.name} — ${APP.product}`)}catch(e){console.error('[print] native current-view print failed',e);fallbackPrint()}}) as typeof window.print;
 }

 const plugins=bridge?.Plugins||{};
 const app=plugins.App;
 const network=plugins.Network;

 const clearSidebarLock=()=>{
  const sidebar=document.getElementById('sidebar');
  const backdrop=document.getElementById('mainSidebarBackdrop');
  sidebar?.classList.remove('open');
  backdrop?.classList.remove('show');
  document.body.classList.remove('main-sidebar-open');
 };
 // A stale sidebar lock can freeze document scrolling after Android's system
 // Back closes the drawer. Always normalize that state on native lifecycle entry.
 clearSidebarLock();
 window.addEventListener('pageshow',clearSidebarLock);
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&!document.querySelector('.sidebar.open'))clearSidebarLock()});

 const NAV_STATE_KEY='erp_native_nav_state_v1';
 const saveNativeUiState=()=>{
  try{
   if(typeof UI==='undefined'||typeof Auth==='undefined'||!Auth.user)return;
   localStorage.setItem(NAV_STATE_KEY,JSON.stringify({userId:Auth.user.id||'',location:UI.captureNavLocation?.()||null,history:(UI.navHistory||[]).slice(-30),scrollY:Math.max(0,Math.round(window.scrollY||0))}));
  }catch(_){}
 };
 const restoreNativeUiState=()=>{
  try{
   if(typeof UI==='undefined'||typeof Auth==='undefined'||!Auth.user)return;
   const raw=localStorage.getItem(NAV_STATE_KEY);if(!raw)return;
   const state=JSON.parse(raw);if(!state||state.userId!==Auth.user.id||!state.location)return;
   UI.navHistory=Array.isArray(state.history)?state.history.slice(-30):[];
   UI.restoreNavLocation?.(state.location);
   requestAnimationFrame(()=>requestAnimationFrame(()=>window.scrollTo(0,Math.max(0,Number(state.scrollY)||0))));
  }catch(_){}
 };
 if(typeof UI!=='undefined'&&typeof UI.init==='function'){
  const initUi=UI.init.bind(UI);
  UI.init=function(...args:any[]){const result=initUi(...args);setTimeout(restoreNativeUiState,0);return result};
 }
 window.addEventListener('pagehide',saveNativeUiState);
 const handleNativeState=(state:{isActive:boolean})=>{if(!state?.isActive){saveNativeUiState();ServerStore.invalidateConnection?.()}else clearSidebarLock()};
 app?.addListener?.('appStateChange',handleNativeState);
 window.addEventListener('erp:native-state',(e:any)=>handleNativeState(e?.detail||{isActive:document.visibilityState==='visible'}));

 let lastRootBack=0,lastBackEvent=0;
 const handleNativeBack=()=>{
  const stamp=Date.now();if(stamp-lastBackEvent<120)return;lastBackEvent=stamp;
  const quick=document.getElementById('quickModal');
  if(quick?.classList.contains('show')){try{UmrahCore_QuickCreate?.close?.()}catch(_){quick.classList.remove('show')}return}
  const print=document.getElementById('printModal');
  if(print?.classList.contains('show')){try{Print?.close?.()}catch(_){print.classList.remove('show')}return}
  const modal=document.getElementById('modal');
  if(modal?.classList.contains('show')){try{UI?.closeModal?.()}catch(_){modal.classList.remove('show')}return}
  const sidebar=document.querySelector('.sidebar.open');
  if(sidebar){try{UI?.closeMobileSidebar?.()}catch(_){clearSidebarLock()}return}
  const openMenu=[...document.querySelectorAll('.dropdown-panel:not(.hidden)')];
  if(openMenu.length){try{UI?.closeMenus?.()}catch(_){openMenu.forEach(x=>x.classList.add('hidden'))}return}
  const picker=[...document.querySelectorAll('.picker-results')].find((x:any)=>x.childElementCount>0);
  if(picker){document.querySelectorAll('.picker-results').forEach(x=>{x.innerHTML='';x.classList.remove('picker-mobile','picker-up')});return}
  if(typeof UI!=='undefined'){
   if(Array.isArray(UI.navHistory)&&UI.navHistory.length){UI.goBack?.();saveNativeUiState();return}
   if(UI.current!=='dashboard'||UI.workspaceId){UI.goUp?.();saveNativeUiState();return}
  }
  const now=Date.now();
  if(now-lastRootBack<1600){if(app?.exitApp)app.exitApp();else try{nativeShell?.exitApp?.()}catch(_){};return}
  lastRootBack=now;
  if(typeof toast==='function')toast('اضغط رجوع مرة أخرى للخروج من التطبيق','warning');
 };
 app?.addListener?.('backButton',handleNativeBack);
 window.addEventListener('erp:native-back',handleNativeBack);

 if(offlineEdition){
  (window as any).ERP_MOBILE.refresh=async()=>{try{await DataStore.localPut(DB.data);UI?.renderCurrent?.();CommercialUX?.saveState?.('saved','محفوظ على الجهاز');if(typeof toast==='function')toast('البيانات محفوظة على الجهاز','ok');return true}catch(_){return false}};
  (window as any).ERP_MOBILE.checkConnection=async()=>true;
  (window as any).ERP_MOBILE.checkAppRelease=async()=>false;
  (window as any).ERP_MOBILE.applyPendingRelease=()=>false;
  document.documentElement.classList.remove('native-offline');
  window.dispatchEvent(new CustomEvent('erp:native-network',{detail:{connected:true,localOnly:true}}));
  return;
 }

 let networkConnected=true,deviceNetworkHint=true,healthBusy=false,refreshBusy=false,lastHealthAt=0,offlineConfirmTimer:any=null;
 const setOnline=(connected:boolean)=>{
  networkConnected=connected!==false;
  document.documentElement.classList.toggle('native-offline',!networkConnected);
  window.dispatchEvent(new CustomEvent('erp:native-network',{detail:{connected:networkConnected}}));
 };
 const dirtyFormOpen=()=>typeof CommercialUX!=='undefined'&&CommercialUX.dirtyForm&&CommercialUX.dirtyForm.isConnected&&CommercialUX.dirtyForm.dataset.clean!=='1';
 const setRefreshBusy=(busy:boolean)=>{
  refreshBusy=busy;
  document.getElementById('nativeRefreshBtn')?.classList.toggle('refreshing',busy);
  const pull=document.getElementById('nativePullRefresh');
  pull?.classList.toggle('refreshing',busy);
  if(pull&&busy)pull.classList.add('show')
 };
 const ensureRefreshUi=()=>{
  let b=document.getElementById('nativeRefreshBtn') as HTMLButtonElement|null;
  const top=document.querySelector('.top-actions');
  if(!b&&top){b=document.createElement('button');b.id='nativeRefreshBtn';b.type='button';b.className='icon-btn native-refresh-btn';b.title='تحديث البيانات';b.setAttribute('aria-label','تحديث البيانات');b.innerHTML='<span class="native-refresh-icon">↻</span>';b.addEventListener('click',async()=>{const ok=await refreshFromServer('button');if(ok){try{await (window as any).ERP_MOBILE?.checkAppRelease?.();(window as any).ERP_MOBILE?.applyPendingRelease?.()}catch(_){}}});const save=document.getElementById('saveStatus');save?.insertAdjacentElement('afterend',b)||top.prepend(b)}
  let pull=document.getElementById('nativePullRefresh');
  if(!pull){pull=document.createElement('div');pull.id='nativePullRefresh';pull.className='native-pull-refresh';pull.setAttribute('role','status');pull.setAttribute('aria-label','تحديث البيانات');pull.innerHTML='<b class="native-pull-refresh-icon" aria-hidden="true">↻</b>';document.body.append(pull)}
 };
 const markConnection=(connected:boolean,message='',confirmedOffline=false)=>{
  // A slow/temporarily sleeping server is not the same as an offline phone.
  // Only the native/browser network events, confirmed by a failed probe, may
  // show the persistent native-offline badge. Any successful request clears it.
  if(connected)setOnline(true);
  else if(confirmedOffline)setOnline(false);
  if(typeof CommercialUX==='undefined'||typeof Auth==='undefined'||!Auth.user)return;
  if(!connected)CommercialUX.saveState('warning',message||'تعذر الوصول للخادم — سيعيد الاتصال تلقائيًا');
  else if(!ServerStore.lastConflict&&!DB.lastSaveError)CommercialUX.saveState('saved','متصل');
 };
 const checkServerHealth=async(source='heartbeat')=>{
  if(healthBusy||document.visibilityState==='hidden')return false;
  const now=Date.now();if(source==='heartbeat'&&now-lastHealthAt<45000)return ServerStore.available===true;
  lastHealthAt=now;
  healthBusy=true;
  try{
   const ok=await ServerStore.probe(true);
   if(!ok){markConnection(false,ServerStore.lastError||'تعذر الوصول للخادم — سيعيد الاتصال تلقائيًا',deviceNetworkHint===false);return false}
   markConnection(true);
   if(!ServerStore.authenticated){if(typeof Auth!=='undefined'&&Auth.user)ServerStore._requireLogin();return false}
   if((ServerStore._pendingData||ServerStore._drain)&&!ServerStore.lastConflict){
    const synced=await ServerStore.flushPending();
    if(synced){DB.syncBlocked=false;DB.lastSaveError='';markConnection(true);if(source!=='heartbeat'&&typeof toast==='function')toast('عاد الاتصال وتمت مزامنة التعديلات','ok')}
    else if(!ServerStore.lastConflict)markConnection(false,ServerStore.lastError||'تعذر المزامنة مؤقتًا — ستتم إعادة المحاولة تلقائيًا');
   }
   return true;
  }catch(e){markConnection(false,S((e as any)?.message||e),deviceNetworkHint===false);return false}finally{healthBusy=false}
 };
 const refreshFromServer=async(source='manual')=>{
  if(refreshBusy)return false;
  ensureRefreshUi();
  if(dirtyFormOpen()){if(typeof toast==='function')toast('احفظ أو أغلق النموذج المفتوح قبل تحديث الصفحة','warning');return false}
  if(!ServerStore.lastConflict&&(ServerStore._pendingData||ServerStore._drain)){const synced=await ServerStore.flushPending();if(!synced||ServerStore._pendingData){markConnection(false,ServerStore.lastError||'يوجد تعديل لم تتم مزامنته بعد');if(typeof toast==='function')toast('لن يتم التحديث الآن حفاظًا على التعديل المعلّق. سيعيد النظام مزامنته تلقائيًا عند استقرار الاتصال.','warning');return false}}
  if(ServerStore.lastConflict||DB.syncBlocked){const ok=confirm('يوجد تعديل محلي لم يُعتمد على الخادم. تحديث البيانات الآن سيعرض أحدث نسخة من الخادم ويلغي التعديل المتعارض. هل تريد المتابعة؟');if(!ok)return false;ServerStore.discardPending?.();DB.syncBlocked=false;DB.lastSaveError=''}
  if(!networkConnected&&deviceNetworkHint===false){markConnection(false,'لا يوجد اتصال بالإنترنت',true);if(typeof toast==='function')toast('لا يوجد اتصال بالإنترنت الآن','warning');return false}
  setRefreshBusy(true);
  try{
   const remote=await ServerStore.get();
   if(remote?.authRequired){ServerStore._requireLogin();return false}
   if(!remote?.available||!remote?.data){markConnection(false,ServerStore.lastError||'تعذر جلب أحدث البيانات');if(typeof toast==='function')toast('تعذر جلب أحدث البيانات من الخادم','warning');return false}
   const loc=typeof UI!=='undefined'?UI.captureNavLocation?.():null,uid=typeof Auth!=='undefined'?(Auth.user?.id||ServerStore.userId):ServerStore.userId;
   DB.data=remote.data;DB.ensure();DB.syncBlocked=false;DB.lastSaveError='';
   if(typeof Auth!=='undefined'&&uid)Auth.user=byId(DB.data.users||[],uid)||Auth.user;
   await DataStore.localPut(DB.data).catch(()=>false);
   if(loc&&typeof UI!=='undefined')UI.restoreNavLocation?.(loc);else if(typeof UI!=='undefined')UI.renderCurrent?.();
   if(typeof CommercialUX!=='undefined'){CommercialUX.enhance?.(document);CommercialUX.saveState?.('saved','محدّث')}markConnection(true);
   if(source!=='resume'&&typeof toast==='function')toast('تم تحديث البيانات','ok');
   return true;
  }catch(e){markConnection(false,S((e as any)?.message||e));if(typeof toast==='function')toast(`تعذر التحديث: ${S((e as any)?.message||e)}`,'warning');return false}finally{
   setRefreshBusy(false);setTimeout(()=>{const pull=document.getElementById('nativePullRefresh');pull?.classList.remove('show','ready','refreshing')},260)
  }
 };
 (window as any).ERP_MOBILE.refresh=()=>refreshFromServer('api');
 (window as any).ERP_MOBILE.checkConnection=()=>checkServerHealth('manual');
 const installPullToRefresh=()=>{
  ensureRefreshUi();let startY=0,startX=0,pulling=false,armed=false,scrollOwner:any=null;
  const SHOW_THRESHOLD=34,ARM_THRESHOLD=92,HORIZONTAL_TOLERANCE=1.15;
  const pullEl=()=>document.getElementById('nativePullRefresh');
  const resetPull=()=>{pulling=false;armed=false;scrollOwner=null;const pull=pullEl();if(!pull)return;pull.classList.remove('show','ready');pull.style.removeProperty('--pull-distance')};
  const blocked=(target:any)=>!!target?.closest?.('input,textarea,select,[contenteditable="true"],.quick-modal.show,.print-modal.show,.sidebar.open,.dropdown-panel:not(.hidden)');
  const findScrollOwner=(target:any)=>{
   let el=target?.nodeType===1?target:target?.parentElement;
   while(el&&el!==document.body&&el!==document.documentElement){
    try{const st=getComputedStyle(el),oy=st.overflowY;if((oy==='auto'||oy==='scroll')&&el.scrollHeight>el.clientHeight+2)return el}catch(_){}
    el=el.parentElement;
   }
   return document.scrollingElement||document.documentElement;
  };
  const atTop=(owner:any)=>{if(!owner||owner===document.scrollingElement||owner===document.documentElement||owner===document.body)return Math.max(window.scrollY||0,document.documentElement.scrollTop||0,document.body.scrollTop||0)<=1;return Number(owner.scrollTop||0)<=1};
  document.addEventListener('touchstart',(e:TouchEvent)=>{
   if(refreshBusy||e.touches.length!==1||blocked(e.target)){resetPull();return}
   // Editable modal forms keep their own scroll and must never be refreshed by a gesture.
   const modal=(e.target as any)?.closest?.('.modal.show');if(modal&&document.getElementById('modalFoot')?.dataset?.mode!=='view'){resetPull();return}
   scrollOwner=findScrollOwner(e.target);if(!atTop(scrollOwner)){resetPull();return}
   startY=e.touches[0].clientY;startX=e.touches[0].clientX;pulling=true;armed=false;
  },{passive:true,capture:true});
  document.addEventListener('touchmove',(e:TouchEvent)=>{
   if(!pulling||e.touches.length!==1)return;
   if(!atTop(scrollOwner)){resetPull();return}
   const dy=e.touches[0].clientY-startY,dx=Math.abs(e.touches[0].clientX-startX);
   if(dy<=0||dx>Math.max(16,dy*HORIZONTAL_TOLERANCE)){resetPull();return}
   const pull=pullEl();if(!pull)return;
   // Ignore small normal scrolling/touch jitter. The indicator appears only after a deliberate pull.
   if(dy<SHOW_THRESHOLD){pull.classList.remove('show','ready');pull.style.removeProperty('--pull-distance');return}
   const resisted=Math.min(112,SHOW_THRESHOLD+(dy-SHOW_THRESHOLD)*.58);
   if(e.cancelable)e.preventDefault();
   pull.classList.add('show');pull.style.setProperty('--pull-distance',`${Math.round(resisted)}px`);
   armed=dy>=ARM_THRESHOLD;pull.classList.toggle('ready',armed);
  },{passive:false,capture:true});
  const finish=()=>{
   const doRefresh=pulling&&armed;resetPull();
   if(!doRefresh)return;
   refreshFromServer('pull').then(async ok=>{if(ok){try{await (window as any).ERP_MOBILE?.checkAppRelease?.();(window as any).ERP_MOBILE?.applyPendingRelease?.()}catch(_){}}}).finally(()=>{if(!refreshBusy)resetPull()});
  };
  document.addEventListener('touchend',finish,{passive:true,capture:true});
  document.addEventListener('touchcancel',()=>resetPull(),{passive:true,capture:true});
 };
 setTimeout(installPullToRefresh,0);
 const updateNetworkHint=(connected:boolean,source:string)=>{
  deviceNetworkHint=connected!==false;
  if(offlineConfirmTimer){clearTimeout(offlineConfirmTimer);offlineConfirmTimer=null}
  if(deviceNetworkHint){ServerStore.invalidateConnection?.();setOnline(true);checkServerHealth(source);return}
  // Android can emit a brief false status while switching towers, SIMs or
  // Wi-Fi. Confirm it with the actual ERP server before displaying offline.
  offlineConfirmTimer=setTimeout(async()=>{
   offlineConfirmTimer=null;
   const reachable=await checkServerHealth('offline-confirm');
   if(!reachable&&deviceNetworkHint===false)markConnection(false,'لا يوجد اتصال بالإنترنت — سيعيد الاتصال تلقائيًا',true);
  },2500);
 };
 network?.getStatus?.().then((state:{connected:boolean})=>updateNetworkHint(state.connected,'startup')).catch(()=>checkServerHealth('startup'));
 network?.addListener?.('networkStatusChange',(state:{connected:boolean})=>updateNetworkHint(state.connected,'network-return'));
 window.addEventListener('online',()=>updateNetworkHint(true,'browser-online'));
 window.addEventListener('offline',()=>updateNetworkHint(false,'browser-offline'));
 const handleResumeHealth=(state:{isActive:boolean})=>{if(state?.isActive){ServerStore.invalidateConnection?.();clearSidebarLock();setTimeout(()=>checkServerHealth('resume'),0)}};
 app?.addListener?.('appStateChange',handleResumeHealth);
 window.addEventListener('erp:native-state',(e:any)=>handleResumeHealth(e?.detail||{isActive:document.visibilityState==='visible'}));
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'){ServerStore.invalidateConnection?.();checkServerHealth('visible')}});
 setInterval(()=>{if(document.visibilityState==='visible')checkServerHealth('heartbeat')},60000);

 // Live-shell release check. Never force a navigation while the operator is working.
 // A new Railway release is applied once, only after an explicit refresh gesture/button
 // or the next normal app launch. This prevents repeated exit/loading loops.
 const loadedRelease=(()=>{try{return String(APP?.version||'').match(/\d+\.\d+\.\d+/)?.[0]||''}catch(_){return''}})();
 const RELEASE_APPLY_KEY='erp_native_release_apply_v2';
 let releaseCheckBusy=false,lastReleaseCheck=0,pendingServerRelease='',releaseNotice='';
 const checkLiveRelease=async(source='timer')=>{
  const now=Date.now();if(releaseCheckBusy||(source==='timer'&&now-lastReleaseCheck<120000)||document.visibilityState==='hidden')return false;
  releaseCheckBusy=true;lastReleaseCheck=now;
  try{
   const response=await nativeFetch(`${API_BASE}/api/health?_=${now}`,{cache:'no-store',headers:{'Cache-Control':'no-cache','X-ERP-Mobile':'android','X-ERP-Mobile-Version':'32.5.46'}});
   if(!response.ok)return false;
   const payload=await response.json();const remote=String(payload?.version||'').match(/\d+\.\d+\.\d+/)?.[0]||'';
   if(!remote||!loadedRelease||remote===loadedRelease){pendingServerRelease='';releaseNotice='';return true}
   pendingServerRelease=remote;
   if(source!=='timer'&&releaseNotice!==remote&&!dirtyFormOpen()){releaseNotice=remote;if(typeof toast==='function')toast(`يتوفر تحديث للنظام ${remote}. اضغط زر التحديث لتطبيقه.`,'warning')}
   return true;
  }catch(_){return false}finally{releaseCheckBusy=false}
 };
 const applyPendingRelease=()=>{
  const remote=pendingServerRelease;if(!remote||remote===loadedRelease||dirtyFormOpen())return false;
  let last='';try{last=sessionStorage.getItem(RELEASE_APPLY_KEY)||''}catch(_){}
  if(last===remote)return false;
  try{sessionStorage.setItem(RELEASE_APPLY_KEY,remote);saveNativeUiState()}catch(_){}
  const u=new URL(API_BASE);u.searchParams.set('appv',remote);u.searchParams.set('source','android-refresh');u.searchParams.set('_r',String(Date.now()));
  try{if(shellNative&&nativeShell?.openRuntime){nativeShell.openRuntime(u.toString());return true}}catch(_){}
  location.replace(u.toString());return true;
 };
 (window as any).ERP_MOBILE.checkAppRelease=()=>checkLiveRelease('manual');
 (window as any).ERP_MOBILE.applyPendingRelease=applyPendingRelease;
 setTimeout(()=>checkLiveRelease('startup'),2500);
 const handleResumeRelease=(state:{isActive:boolean})=>{if(state?.isActive)setTimeout(()=>checkLiveRelease('resume'),900)};
 app?.addListener?.('appStateChange',handleResumeRelease);
 window.addEventListener('erp:native-state',(e:any)=>handleResumeRelease(e?.detail||{isActive:document.visibilityState==='visible'}));
 setInterval(()=>checkLiveRelease('timer'),180000);
})();
