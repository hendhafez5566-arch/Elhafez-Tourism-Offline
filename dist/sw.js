const ERP_VERSION='32.5.59';
const CACHE_NAME=`erp-shell-${ERP_VERSION}`;
const PRECACHE=[
  './index.html',
  `./styles.css?v=${ERP_VERSION}`,
  `./app.js?v=${ERP_VERSION}`,
  `./manifest.webmanifest?v=${ERP_VERSION}`,
  `./icons/erp-192.png?v=${ERP_VERSION}`,
  `./icons/erp-512.png?v=${ERP_VERSION}`,
];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(PRECACHE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('erp-shell-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;

  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(res=>{
      if(res&&res.ok)caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',res.clone())).catch(()=>{});
      return res;
    }).catch(()=>caches.match('./index.html')));
    return;
  }

  if(['script','style','image','manifest'].includes(req.destination)){
    event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
      if(res&&res.ok)caches.open(CACHE_NAME).then(cache=>cache.put(req,res.clone())).catch(()=>{});
      return res;
    })));
  }
});
