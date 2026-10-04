import { __set_UI, __set_UiBaseMethods } from '../core/late-bindings';
import { UI_Shell } from './ui-shell';
import { UI_WorkspaceNav } from './ui-workspace-nav';
import { UI_MenusSearch } from './ui-menus-search';
import { UI_Tables } from './ui-tables';
import { UI_ModalSettings } from './ui-modal-settings';
import { SystemFontCatalog, UIDocument, ensureSystemFontAsset, systemFontEntry } from './ui-fonts';
import { createUiBaseMethods } from './ui-base-methods';
import { installUiModalStack } from './ui-modal-stack';
import { UiPort } from '../core/ui-port';
import { toast } from '../core/runtime';

const UI: any = {
    ...UI_Shell,
    ...UI_WorkspaceNav,
    ...UI_MenusSearch,
    ...UI_Tables,
    ...UI_ModalSettings
};
__set_UI(UI);
UiPort.bind({showToast:(msg:any,type?:any)=>type===undefined?toast(msg):toast(msg,type),confirmAction:(...a:any[])=>UI.confirmAction(...a),applyBrand:()=>UI.applyBrand(),renderCurrent:()=>UI.renderCurrent(),renderNav:()=>UI.renderNav(),openPage:(...a:any[])=>UI.openPage(...a)});
const UiBaseMethods = createUiBaseMethods(UI);
__set_UiBaseMethods(UiBaseMethods);
installUiModalStack(UI);
export { SystemFontCatalog, UI, UIDocument, UiBaseMethods, ensureSystemFontAsset, systemFontEntry };
