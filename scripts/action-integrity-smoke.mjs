import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const root=process.cwd();
const sourceFiles=[];
const walk=(dir)=>{for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(/\.ts$/i.test(ent.name))sourceFiles.push(p)}};
walk(path.join(root,'src'));
const htmlFiles=[path.join(root,'index.html')];
const globals=new Map();
const assignEdges=[];

function add(rootName,method){if(!rootName||!method)return;if(!globals.has(rootName))globals.set(rootName,new Set());globals.get(rootName).add(method)}
function propName(n){if(!n)return'';if(ts.isIdentifier(n)||ts.isStringLiteral(n)||ts.isNumericLiteral(n))return String(n.text);return''}

for(const file of sourceFiles){
  const text=fs.readFileSync(file,'utf8');
  const sf=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TS);
  const visit=(node)=>{
    if(ts.isVariableDeclaration(node)&&ts.isIdentifier(node.name)&&node.initializer&&ts.isObjectLiteralExpression(node.initializer)){
      const rn=node.name.text;
      for(const p of node.initializer.properties){
        if(ts.isMethodDeclaration(p)||ts.isPropertyAssignment(p)||ts.isShorthandPropertyAssignment(p)||ts.isGetAccessorDeclaration(p)||ts.isSetAccessorDeclaration(p)) add(rn,propName(p.name));
      }
    }
    if(ts.isBinaryExpression(node)&&node.operatorToken.kind===ts.SyntaxKind.EqualsToken&&ts.isPropertyAccessExpression(node.left)&&ts.isIdentifier(node.left.expression)){
      add(node.left.expression.text,node.left.name.text);
    }
    if(ts.isCallExpression(node)&&ts.isPropertyAccessExpression(node.expression)&&ts.isIdentifier(node.expression.expression)&&node.expression.expression.text==='Object'&&node.expression.name.text==='assign'&&node.arguments.length>=2&&ts.isIdentifier(node.arguments[0])){
      const target=node.arguments[0].text;
      for(const arg of node.arguments.slice(1)){
        if(ts.isObjectLiteralExpression(arg)){
          for(const p of arg.properties){
            if(ts.isMethodDeclaration(p)||ts.isPropertyAssignment(p)||ts.isShorthandPropertyAssignment(p)||ts.isGetAccessorDeclaration(p)||ts.isSetAccessorDeclaration(p)) add(target,propName(p.name));
          }
        } else if(ts.isIdentifier(arg)) assignEdges.push([target,arg.text]);
      }
    }
    ts.forEachChild(node,visit);
  };
  visit(sf);
}

// Propagate Object.assign(Target, Source) aliases after every source object is known.
for(let pass=0;pass<8;pass++){
  let changed=false;
  for(const [target,source] of assignEdges){
    const src=globals.get(source); if(!src) continue;
    const before=globals.get(target)?.size||0;
    for(const m of src) add(target,m);
    if((globals.get(target)?.size||0)>before) changed=true;
  }
  if(!changed) break;
}

const eventRe=/on(?:click|change|input|submit|keydown|keyup|blur|focus)\s*=\s*"([^"]*)"/g;
const callRe=/\b([A-Z][A-Za-z0-9_]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/g;
const refs=[];
for(const file of [...sourceFiles,...htmlFiles]){
  const text=fs.readFileSync(file,'utf8');
  let m;
  while((m=eventRe.exec(text))){
    const handler=m[1];
    let c;
    while((c=callRe.exec(handler))) refs.push({file:path.relative(root,file),root:c[1],method:c[2],handler});
  }
}
const builtin=new Set(['Math','Date','JSON','Object','Array','String','Number','Promise','URL']);
const unresolved=[];
for(const r of refs){
  if(builtin.has(r.root))continue;
  if(!globals.get(r.root)?.has(r.method)) unresolved.push(r);
}
const uniq=new Map();
for(const x of unresolved) uniq.set(`${x.root}.${x.method}`,x);

const allText=[...sourceFiles,...htmlFiles].map(f=>fs.readFileSync(f,'utf8')).join('\n');
const buttonCount=(allText.match(/<button\b/gi)||[]).length;
const onclickCount=(allText.match(/onclick\s*=/gi)||[]).length;
const formSubmitCount=(allText.match(/onsubmit\s*=/gi)||[]).length;

if(uniq.size){
  console.error('ACTION INTEGRITY FAILED');
  for(const [key,x] of uniq) console.error(`- unresolved ${key} in ${x.file}: ${x.handler.slice(0,180)}`);
  process.exit(1);
}

console.log(JSON.stringify({
  ok:true,
  buttonDefinitions:buttonCount,
  inlineOnclickHandlers:onclickCount,
  inlineFormSubmitHandlers:formSubmitCount,
  callableReferences:refs.length,
  uniqueCallableReferences:new Set(refs.map(x=>`${x.root}.${x.method}`)).size,
  actionRoots:[...new Set(refs.map(x=>x.root))].filter(x=>!builtin.has(x)).sort(),
  unresolved:0
},null,2));
