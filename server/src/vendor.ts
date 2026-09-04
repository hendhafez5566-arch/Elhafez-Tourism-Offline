// Customer hardened build: Vendor/Owner administration is physically excluded.
export async function ensureVendorSchema(..._args:any[]){}
export function vendorPublicStatus(..._args:any[]){return{enabled:false,version:'',deploymentAutomation:false,provisioningAutomation:false,autoRollout:false,commit:''}}
export function vendorOwnerAllowed(..._args:any[]){return false}
export async function handleVendorApi(..._args:any[]){return false}
export async function handleVendorPublicApi(..._args:any[]){return false}
export async function vendorStartupSync(..._args:any[]){}
export async function vendorAutomaticRollout(..._args:any[]){return{ok:false,skipped:true,reason:'customer_build'}}
