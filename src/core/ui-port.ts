/* UI notification port: lets persistence/domain code ask "show a toast / confirm / refresh" without importing or naming the UI layer.
   Leaf module (no imports). The presentation layer registers the real implementations when ui/ui.ts is evaluated (same moment __set_UI runs).
   Each method forwards its arguments unchanged and returns what the implementation returns; the implementation resolves UI lazily on every call. */
type UiArgument=unknown;
type Impl={showToast?(msg:UiArgument,type?:UiArgument):void;confirmAction?(...a:UiArgument[]):unknown;applyBrand?():unknown;renderCurrent?():unknown;renderNav?():unknown;openPage?(...a:UiArgument[]):unknown};
let impl:Impl={};
const UiPort={
 bind(p:Impl){impl={...impl,...p}},
 isBound(){return Object.keys(impl).length>0},
 toast(msg:UiArgument,type?:UiArgument){return type===undefined?impl.showToast?.(msg):impl.showToast?.(msg,type)},
 confirmAction(...a:UiArgument[]){return impl.confirmAction?.(...a)},
 applyBrand(){return impl.applyBrand?.()},
 renderCurrent(){return impl.renderCurrent?.()},
 renderNav(){return impl.renderNav?.()},
 openPage(...a:UiArgument[]){return impl.openPage?.(...a)}
};
export { UiPort };
