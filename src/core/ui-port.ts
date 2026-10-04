/* UI notification port: lets persistence/domain code ask "show a toast / confirm / refresh" without importing or naming the UI layer.
   Leaf module (no imports). The presentation layer registers the real implementations when ui/ui.ts is evaluated (same moment __set_UI runs).
   Each method forwards its arguments unchanged and returns what the implementation returns; the implementation resolves UI lazily on every call. */
type Impl={showToast?(msg:any,type?:any):any;confirmAction?(...a:any[]):any;applyBrand?():any;renderCurrent?():any;renderNav?():any;openPage?(...a:any[]):any};
let impl:Impl={};
const UiPort={
 bind(p:Impl){impl={...impl,...p}},
 isBound(){return Object.keys(impl).length>0},
 toast(msg:any,type?:any){return type===undefined?impl.showToast?.(msg):impl.showToast?.(msg,type)},
 confirmAction(...a:any[]){return impl.confirmAction?.(...a)},
 applyBrand(){return impl.applyBrand?.()},
 renderCurrent(){return impl.renderCurrent?.()},
 renderNav(){return impl.renderNav?.()},
 openPage(...a:any[]){return impl.openPage?.(...a)}
};
export { UiPort };
