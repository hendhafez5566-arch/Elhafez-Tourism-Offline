import ts from 'typescript'; import fs from 'fs';
const [f,obj]=process.argv.slice(2);const src=fs.readFileSync(f,'utf8');const sf=ts.createSourceFile(f,src,ts.ScriptTarget.ES2020,true);
let acc=0,out=[];
sf.forEachChild(n=>{if(ts.isVariableStatement(n))for(const d of n.declarationList.declarations)if(d.name.getText()===obj)for(const p of d.initializer.properties){const b=Buffer.byteLength(p.getText());acc+=b;out.push(p.name.getText()+':'+b+'('+acc+')');}});
console.log(out.join(' '));
