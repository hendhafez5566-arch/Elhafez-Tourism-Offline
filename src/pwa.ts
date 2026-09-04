const PWA={
 register(){
  let native=(window as any).Capacitor?.isNativePlatform?.()===true;try{native=native||(window as any).NativeShell?.isNative?.()===true}catch(_){};if(native)return;
  if(!('serviceWorker' in navigator))return;
  const local=/^(localhost|127(?:\.\d+){3}|\[::1\])$/i.test(location.hostname);
  if(location.protocol!=='https:'&&!local)return;
  window.addEventListener('load',()=>{
   navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'}).then(reg=>{setTimeout(()=>reg.update().catch(()=>{}),5000)}).catch(()=>{});
  },{once:true});
 }
};
PWA.register();
