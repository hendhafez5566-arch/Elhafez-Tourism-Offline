import { readFile, writeFile } from 'node:fs/promises';

const serverStub=`// Customer hardened build: Vendor/Owner administration is physically excluded.\nexport async function ensureVendorSchema(..._args:any[]){}\nexport function vendorPublicStatus(..._args:any[]){return{enabled:false,version:'',deploymentAutomation:false,provisioningAutomation:false,autoRollout:false,commit:''}}\nexport function vendorOwnerAllowed(..._args:any[]){return false}\nexport async function handleVendorApi(..._args:any[]){return false}\nexport async function handleVendorPublicApi(..._args:any[]){return false}\nexport async function vendorStartupSync(..._args:any[]){}\nexport async function vendorAutomaticRollout(..._args:any[]){return{ok:false,skipped:true,reason:'customer_build'}}\n`;

const uiStub=`// Customer hardened build: no Vendor Center UI/code.\nconst VendorOwner={\n enabled:false,data:null,runtimeVersion:'',deploymentAutomation:false,autoRollout:false,section:'overview',\n applyStatus(..._args:any[]){this.enabled=false;return false},\n async init(..._args:any[]){this.enabled=false;return false},\n page(..._args:any[]){return''}\n};\n`;

await writeFile(new URL('../server/src/vendor.ts', import.meta.url),serverStub,'utf8');
await writeFile(new URL('../src/commercial/vendor-owner.ts', import.meta.url),uiStub,'utf8');
console.log('Customer hardened build prepared: Vendor admin server/UI removed before compilation.');


const serverUrl=new URL('../server/src/server.ts',import.meta.url);
let serverSource=await readFile(serverUrl,'utf8');
serverSource=serverSource.replace(/const vendorMode = \['1','true','yes','on'\]\.includes\([\s\S]*?\);/,`const vendorMode = false; // Customer build: owner mode is physically disabled.`);
await writeFile(serverUrl,serverSource,'utf8');

const contextUrl=new URL('../server/src/context.ts',import.meta.url);
let contextSource=await readFile(contextUrl,'utf8');
contextSource=contextSource.replace(/export const vendorMode=.*?;\n/,`export const vendorMode=false; // Customer build: cannot bypass licensing via environment.\n`);
for(const name of ['vendorPrivateKeyB64','railwayApiToken','railwayProjectToken','customerGithubRepo','customerGithubBranch','customerRailwayProjectId','vendorAutoRollout']){
 contextSource=contextSource.replace(new RegExp(`export const ${name}=.*?;\n`),'');
}
await writeFile(contextUrl,contextSource,'utf8');
