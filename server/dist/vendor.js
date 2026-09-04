export async function ensureVendorSchema(..._args) { }
export function vendorPublicStatus(..._args) { return { enabled: false, version: '', deploymentAutomation: false, provisioningAutomation: false, autoRollout: false, commit: '' }; }
export function vendorOwnerAllowed(..._args) { return false; }
export async function handleVendorApi(..._args) { return false; }
export async function handleVendorPublicApi(..._args) { return false; }
export async function vendorStartupSync(..._args) { }
export async function vendorAutomaticRollout(..._args) { return { ok: false, skipped: true, reason: 'customer_build' }; }
