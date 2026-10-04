import ts from 'typescript'; import fs from 'fs';
for(const f of process.argv.slice(2)){ const src=fs.readFileSync(f,'utf8'); const sf=ts.createSourceFile(f,src,ts.ScriptTarget.ES2020,true);
 const rows=[]; let imp=0; for(const n of sf.statements){ const sz=n.getEnd()-n.getStart(); if(ts.isImportDeclaration(n)){imp++;continue;}
  let name=''; let kind=ts.SyntaxKind[n.kind]; if(ts.isVariableStatement(n)){const d=n.declarationList.declarations[0]; name=d.name.getText(); kind+=':'+(d.initializer?ts.SyntaxKind[d.initializer.kind]:'');} else if(ts.isFunctionDeclaration(n)) name=n.name?.getText(); else if(ts.isExportDeclaration(n)) name='(export list)';
  rows.push([sz,kind,name]); }
 console.log('==',f,'imports',imp,'stmts',rows.length); rows.sort((a,b)=>b[0]-a[0]); console.log(rows.slice(0,8).map(r=>r.join(' ')).join('\n')); }
