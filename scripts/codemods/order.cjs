const ts=require('/home/claude/.npm-global/lib/node_modules/typescript');
const path=require('path'),fs=require('fs');
const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
const files=cfg.files.map(f=>path.resolve(root,f));
const opts={target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],strict:false,skipLibCheck:true,noEmit:true,ignoreDeprecations:'6.0',rootDir:'src',types:[]};
const prog=ts.createProgram(files,opts);const chk=prog.getTypeChecker();
const idx=new Map(files.map((f,i)=>[f,i]));
const deps=files.map(()=>new Set());
for(const f of files){const sf=prog.getSourceFile(f);
 (function walk(n){
  if(ts.isIdentifier(n)){const par=n.parent;
   const skip=((ts.isVariableDeclaration(par)||ts.isFunctionDeclaration(par)||ts.isParameter(par)||ts.isBindingElement(par))&&par.name===n)||(ts.isPropertyAccessExpression(par)&&par.name===n)||(ts.isPropertyAssignment(par)&&par.name===n)||(ts.isQualifiedName(par)&&par.right===n)||ts.isInterfaceDeclaration(par)||ts.isTypeAliasDeclaration(par)||(ts.isMethodDeclaration(par)&&par.name===n)||ts.isPropertySignature(par)||ts.isLabeledStatement(par)||ts.isBreakOrContinueStatement(par);
   if(!skip){
    // skip type positions
    let p=n,inType=false;while(p){if(ts.isTypeNode(p)&&!ts.isTypeQueryNode(p)&&!ts.isExpressionWithTypeArguments(p)){inType=true;break}if(ts.isTypeQueryNode(p)){inType=false;break}if(ts.isStatement(p))break;p=p.parent}
    if(!inType){let sym=chk.getSymbolAtLocation(n);if(par&&ts.isShorthandPropertyAssignment(par)&&par.name===n)sym=chk.getShorthandAssignmentValueSymbol(par);
     if(sym&&sym.declarations&&sym.declarations.length){const d=sym.declarations[0];if(ts.isInterfaceDeclaration(d)||ts.isTypeAliasDeclaration(d))return;const df=d.getSourceFile().fileName;if(df!==f&&idx.has(df))deps[idx.get(f)].add(idx.get(df))}}}}
  ts.forEachChild(n,walk)})(sf)}
// DFS in entry order (imports in numeric order of dep index)
const seen=new Set(),out=[];
function visit(i){if(seen.has(i))return;seen.add(i);for(const d of [...deps[i]].sort((a,b)=>a-b))visit(d);out.push(i)}
for(let i=0;i<files.length;i++)visit(i);
let moved=0,firstDiff=-1;out.forEach((v,pos)=>{if(v!==pos){moved++;if(firstDiff<0)firstDiff=pos}});
console.log('modules out of original position under plain-import DFS:',moved,'of',files.length,'first diff at',firstDiff);
const show=out.map((v,p)=>v!==p?`${p}:${path.relative(root,files[v]).replace('src/','')}(orig ${v})`:null).filter(Boolean);
console.log(show.slice(0,25).join('\n'));
fs.writeFileSync('/tmp/deps.json',JSON.stringify(deps.map(s=>[...s])));
// which modules are "late hubs"? number of forward deps per module
const fw=files.map((f,i)=>[...deps[i]].filter(d=>d>i).length);
console.log('modules having forward deps:',fw.filter(x=>x>0).length);
console.log(fw.map((c,i)=>c?`${i}:${path.relative(root,files[i]).replace('src/','')} ->${[...deps[i]].filter(d=>d>i).map(d=>d).join(',')}`:null).filter(Boolean).slice(0,40).join('\n'));
