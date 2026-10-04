const ts=require('/home/claude/.npm-global/lib/node_modules/typescript');
const path=require('path'),fs=require('fs');
const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
const files=cfg.files.map(f=>path.resolve(root,f));
const opts={target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],strict:false,skipLibCheck:true,noEmit:true,ignoreDeprecations:'6.0',rootDir:'src',types:[]};
const prog=ts.createProgram(files,opts);
const chk=prog.getTypeChecker();
const order=new Map(files.map((f,i)=>[f,i]));
const diags=ts.getPreEmitDiagnostics(prog);
console.log('diagnostics:',diags.length);
for(const d of diags.slice(0,8))console.log(' ',ts.flattenDiagnosticMessageText(d.messageText,'\n').slice(0,150),d.file&&d.file.fileName.replace(root,''));
// top-level decls
const decls=new Map(); // name -> [{file,kind,node}]
const kindOf=n=>ts.isVariableStatement(n)?'var':ts.isFunctionDeclaration(n)?'function':ts.isClassDeclaration(n)?'class':ts.isInterfaceDeclaration(n)?'interface':ts.isTypeAliasDeclaration(n)?'type':ts.isEnumDeclaration(n)?'enum':ts.isModuleDeclaration(n)?'namespace':'other';
const stat={};
for(const f of files){const sf=prog.getSourceFile(f);
 for(const st of sf.statements){const k=kindOf(st);stat[k]=(stat[k]||0)+1;
  const add=(name,extra)=>{(decls.get(name)||decls.set(name,[]).get(name)).push({file:f,kind:k,...extra})};
  if(ts.isVariableStatement(st)){const fl=st.declarationList.flags;const dk=(fl&ts.NodeFlags.Const)?'const':(fl&ts.NodeFlags.Let)?'let':'varkw';
    for(const d of st.declarationList.declarations){if(ts.isIdentifier(d.name))add(d.name.text,{dk});else{console.log('DESTRUCT top-level',f.replace(root,''),d.name.getText().slice(0,60));ts.forEachChild(d.name,function w(n){if(ts.isBindingElement(n)&&ts.isIdentifier(n.name))add(n.name.text,{dk,destruct:true});ts.forEachChild(n,w)})}}}
  else if(ts.isFunctionDeclaration(st)||ts.isClassDeclaration(st)||ts.isInterfaceDeclaration(st)||ts.isTypeAliasDeclaration(st)||ts.isEnumDeclaration(st)||ts.isModuleDeclaration(st)){if(st.name)add(st.name.text,{})}
  else if(k==='other'&&!ts.isExpressionStatement(st)&&!ts.isEmptyStatement(st))console.log('OTHER stmt',ts.SyntaxKind[st.kind],f.replace(root,''))
 }}
console.log('stmt kinds',stat);
console.log('distinct top-level names',decls.size);
const multi=[...decls].filter(([n,a])=>a.length>1);
console.log('multiply-declared names:',multi.length);
for(const [n,a] of multi.slice(0,40))console.log(' ',n,a.map(x=>x.kind+'@'+path.basename(x.file)).join(', '));
fs.writeFileSync('/tmp/decls.json',JSON.stringify([...decls].map(([n,a])=>[n,a.map(x=>({...x,file:path.relative(root,x.file)}))])));
