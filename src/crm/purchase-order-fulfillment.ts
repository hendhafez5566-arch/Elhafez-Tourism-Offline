import { composeLegacyPurchaseFulfillment } from '../composition/early-presentation';
import { __set_PurchaseOrderFulfillment } from '../core/late-bindings';
// Compatibility facade. Record transitions are owned by the injected domain rules.
const PurchaseOrderFulfillment=composeLegacyPurchaseFulfillment();
__set_PurchaseOrderFulfillment(PurchaseOrderFulfillment);
export { PurchaseOrderFulfillment };
