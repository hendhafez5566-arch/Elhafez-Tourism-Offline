// Splits one big object literal into focused modules (spread back into a facade object); every other statement stays in the facade, in order.
import ts from 'typescript'; import fs from 'fs'; import path from 'path';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const F=cfg.file,dir=path.dirname(F),src=fs.readFileSync(F,'utf8');
const sf=ts.createSourceFile(F,src,ts.ScriptTarget.ES2020,true);
const imports=[],stmts=[];let decl;
for(const n of sf.statements){
  if(ts.isImportDeclaration(n)){imports.push({names:n.importClause.namedBindings.elements.map(e=>e.getText()),from:n.moduleSpecifier.getText()});continue;}
  if(ts.isVariableStatement(n)&&n.declarationList.declarations[0].name.getText()===cfg.obj){decl=n.declarationList.declarations[0];stmts.push({obj:true,n});continue;}
  stmts.push({text:n.getText()});
}
const props=decl.initializer.properties,names=props.map(p=>p.name.getText().replace(/^['"]|['"]$/g,''));
const used=(text,id)=>new RegExp('(?<![\\w$])(?<![^.]\\.)'+id.replace(/\$/g,'\\$')+'(?![\\w$])').test(text);
const impLines=text=>[...imports.map(i=>{const ns=i.names.filter(x=>used(text,x.split(' as ').pop()));return ns.length?`import { ${ns.join(', ')} } from ${i.from};`:null}).filter(Boolean),
  ...(cfg.extraImports||[]).filter(e=>used(text,e.name)).map(e=>`import { ${e.name} } from '${e.from}';`)];
const localLines=text=>Object.entries(cfg.localConsts||{}).filter(([k])=>used(text,k)).map(([,v])=>v);
let cursor=0;const spreads=[],gi=[];
for(const g of cfg.groups){
  const a=names.indexOf(g.from),b=names.indexOf(g.to);
  if(a!==cursor||b<a)throw new Error(`group ${g.file}: expected ${names[cursor]} got ${g.from}`);
  cursor=b+1;
  const body=props.slice(a,b+1).map(p=>p.getText()).join(',\n    ');
  if(g.inline){spreads.push('    '+body);continue;}
  const text=`const ${g.name}${cfg.partType??': any'} = {\n    ${body}\n};\nexport { ${g.name} };\n`;
  fs.writeFileSync(path.join(dir,g.file+'.ts'),[...impLines(text),...localLines(text)].join('\n')+'\n'+text);
  spreads.push(`    ...${g.name}`);gi.push(`import { ${g.name} } from './${g.file}';`);
}
if(cursor!==names.length)throw new Error('ungrouped from '+names[cursor]);
const objText=`const ${cfg.obj}${decl.type?': '+decl.type.getText():''} = {\n${spreads.join(',\n')}\n};`;
const body=stmts.map(s=>s.obj?objText:s.text).join('\n');
const out=[...impLines(body),...gi].join('\n')+'\n'+body+'\n';
fs.writeFileSync(F,out);
for(const g of cfg.groups.filter(g=>!g.inline))console.log(g.file,fs.statSync(path.join(dir,g.file+'.ts')).size);
console.log('facade',fs.statSync(F).size);
