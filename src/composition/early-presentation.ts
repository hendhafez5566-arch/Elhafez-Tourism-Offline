import { iid, now, toast } from '../core/runtime';
import { BrowserPlatform } from '../platform/browser-platform';
import { createPurchaseFulfillmentRules } from '../crm/purchase-fulfillment-rules';
import { Auth, DB, UI } from '../core/late-bindings';
import type { SessionPresentationEffects, StorePresentationEffects } from '../platform/platform-contracts';
// Composition functions that legacy top-level code calls while the stores are being created.
// They used to be hoisted function declarations in bootstrap.ts; they only build closures, so their
// late-bound dependencies (UI, Auth, toast, DB) are resolved at call time through core/late-bindings.
function composeLegacyPurchaseFulfillment() {
    return createPurchaseFulfillmentRules({
        id: iid, now
    }, (action, type, id, detail) => DB.log(action, type, id, detail));
}
function composeStorePresentation(): StorePresentationEffects {
    return {
        canRender: () => typeof UI !== 'undefined' && !!UI?.renderCurrent,
        render: () => UI.renderCurrent(), notify: (message, kind) => toast(message, kind),
        schedule: work => BrowserPlatform.renderFrame(work)
    };
}
function composeSessionPresentation(): SessionPresentationEffects {
    return {
        clear: key => BrowserPlatform.clearSession(key),
        expired: message => { if (typeof Auth !== 'undefined') Auth.expirePresentation(); if (typeof toast === 'function') toast(message, 'error'); }
    };
}
export { composeLegacyPurchaseFulfillment, composeSessionPresentation, composeStorePresentation };
