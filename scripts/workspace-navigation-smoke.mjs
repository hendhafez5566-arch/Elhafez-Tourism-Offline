import fs from 'node:fs';
import ts from 'typescript';

const file='src/ui/ui-workspace-nav.ts';/* UI is assembled from responsibility modules; openWorkspaceModule lives in UI_WorkspaceNav */
const source=fs.readFileSync(file,'utf8');
const delegated=fs.readFileSync('src/ui/delegated-actions.ts','utf8');
const tree=ts.createSourceFile(file,source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
let method;
function visit(node){
  if(ts.isVariableDeclaration(node)&&node.name.getText(tree)==='UI_WorkspaceNav'&&ts.isObjectLiteralExpression(node.initializer))method=node.initializer.properties.find(p=>p.name?.getText(tree)==='openWorkspaceModule');
  ts.forEachChild(node,visit);
}
visit(tree);
if(!method)throw new Error('openWorkspaceModule is missing');
const openWorkspaceModule=(0,eval)(`({${method.getText(tree)}}).openWorkspaceModule`);
const calls=[];
const ui={workspaceModules:()=>[['invoices'],['journals']],setSidebarOpen:value=>calls.push(['sidebar',value]),openPage:page=>{calls.push(['page',page]);return page}};
let prevented=0,stopped=0;
const event={preventDefault:()=>prevented++,stopPropagation:()=>stopped++};
const result=openWorkspaceModule.call(ui,'invoices',event);
const assert=(ok,message)=>{if(!ok)throw new Error(message)};
assert(result==='invoices','Workspace navigation did not return the selected page');
assert(prevented===1&&stopped===1,'Workspace navigation did not isolate the click event');
assert(calls.some(x=>x[0]==='page'&&x[1]==='invoices'),'Invoices route was not opened');
assert(!calls.some(x=>x[0]==='page'&&x[1]==='dashboard'),'Workspace click unexpectedly returned home');
assert(source.includes('data-workspace-page="${i[0]}"')&&delegated.includes("hit('[data-workspace-page]')")&&delegated.includes('ui.openWorkspaceModule(page,e)'),'Sidebar delegates workspace page with the browser event');
console.log('PASS workspace module navigation keeps the selected route');
