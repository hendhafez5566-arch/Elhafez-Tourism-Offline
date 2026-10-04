// Generic splitter: moves contiguous method ranges of one big object literal into focused modules; the original file becomes a facade.
import ts from 'typescript'; import fs from 'fs'; import path from 'path';
const cfg=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const F=cfg.file, dir=path.dirname(F); const src=fs.readFileSync(F,'utf8');
const sf=ts.createSourceFile(F,src,ts.ScriptTarget.ES2020,true);
const imports=[]; const tail=[]; let decl;
for(const n of sf.statements){
  if(ts.isImportDeclaration(n)){ imports.push({names:n.importClause.namedBindings.elements.map(e=>e.getText()),from:n.moduleSpecifier.getText()}); continue; }
  if(ts.isVariableStatement(n)&&n.declarationList.declarations[0].name.getText()===cfg.obj){ decl=n.declarationList.declarations[0]; continue; }
  tail.push(n.getText());
}
const props=decl.initializer.properties; const names=props.map(p=>p.name.getText().replace(/^['"]|['"]$/g,''));
const used=(text,id)=>new RegExp('(?<![\\w$])(?<![^.]\\.)'+id.replace(/\$/g,'\\$')+'(?![\\w$])').test(text);
const impLines=text=>imports.map(i=>{const ns=i.names.filter(n=>used(text,n.split(' as ').pop()));return ns.length?`import { ${ns.join(', ')} } from ${i.from};`:null}).filter(Boolean);
const lbFrom=(imports.find(i=>/late-bindings/.test(i.from))||{}).from||null;
let cursor=0; const made=[];
for(const g of cfg.groups){
  const a=names.indexOf(g.from), b=names.indexOf(g.to);
  if(a!==cursor||b<a) throw new Error(`group ${g.file}: expected to start at ${names[cursor]} but got ${g.from}`);
  cursor=b+1;
  let body=props.slice(a,b+1).map(p=>p.getText()).join(',\n    ');
  let selfLines=[];
  const selfRe=new RegExp('(?<![\\w$.])'+cfg.obj+'(?=[.\\[])','g');
  if(selfRe.test(body)){
    if(cfg.selfViaThis) body=body.replace(new RegExp('(?<![\\w$.])'+cfg.obj+'\\.','g'),'this.');
    else selfLines.push(`import { ${cfg.obj} } from '${cfg.lateBindingsRel}';`);
  }
  const text=`const ${g.name}: any = {\n    ${body}\n};\nexport { ${g.name} };\n`;
  const lines=[...impLines(text),...selfLines];
  fs.writeFileSync(path.join(dir,g.file+'.ts'),lines.join('\n')+'\n'+text);
  made.push(g);
}
if(cursor!==names.length) throw new Error('ungrouped methods from '+names[cursor]);
const spread=cfg.groups.map(g=>`    ...${g.name}`).join(',\n');
const tailText=tail.join('\n');
const head=[...impLines(tailText),...cfg.groups.map(g=>`import { ${g.name} } from './${g.file}';`)];
const out=head.join('\n')+`\nconst ${cfg.obj}${decl.type?': '+decl.type.getText():''} = {\n${spread}\n};\n${tailText}\n`;
fs.writeFileSync(F,out);
for(const g of cfg.groups) console.log(g.file,fs.statSync(path.join(dir,g.file+'.ts')).size);
console.log('facade',fs.statSync(F).size);
