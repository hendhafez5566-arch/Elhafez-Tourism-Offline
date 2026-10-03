import { __set_VendorOwner } from '../core/late-bindings';
// Customer hardened build: no Vendor Center UI/code.
const VendorOwner={
 enabled:false,data:null,runtimeVersion:'',deploymentAutomation:false,autoRollout:false,section:'overview',
 applyStatus(..._args:any[]){this.enabled=false;return false},
 async init(..._args:any[]){this.enabled=false;return false},
 page(..._args:any[]){return''}
};
__set_VendorOwner(VendorOwner);
export { VendorOwner };
