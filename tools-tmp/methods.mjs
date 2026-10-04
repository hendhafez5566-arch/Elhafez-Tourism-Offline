import ts from 'typescript'; import fs from 'fs';
const f=process.argv[2]; const src=fs.readFileSync(f,'utf8');
const sf=ts.createSourceFile(f,src,ts.ScriptTarget.ES2020,true);
let out=[];
sf.forEachChild(n=>{ if(ts.isVariableStatement(n)) for(const d of n.declarationList.declarations){ if(d.initializer&&ts.isObjectLiteralExpression(d.initializer)&&process.argv[3]===d.name.getText()){ for(const p of d.initializer.properties){ out.push([p.name?.getText(),p.getEnd()-p.getStart(),sf.getLineAndCharacterOfPosition(p.getStart()).line+1, (p.getText().match(/this\./g)||[]).length]); } } } });
console.log(out.length); for(const o of out) console.log(o.join('\t'));
