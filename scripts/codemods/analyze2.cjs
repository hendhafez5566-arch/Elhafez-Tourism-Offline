const ts=require('/home/claude/.npm-global/lib/node_modules/typescript');
const path=require('path'),fs=require('fs');
const root=process.cwd();
const cfg=JSON.parse(fs.readFileSync('tsconfig.json','utf8'));
const files=cfg.files.map(f=>path.resolve(root,f));
const opts={target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.None,lib:['lib.es2020.d.ts','lib.dom.d.ts','lib.dom.iterable.d.ts'],strict:false,skipLibCheck:true,noEmit:true,ignoreDeprecations:'6.0',rootDir:'src',types:[]};
const prog=ts.createProgram(files,opts);const chk=prog.getTypeChecker();
const idx=new Map(files.map((f,i)=>[f,i]));
let fwd=0,bwd=0,typeRefs=0,assignCross=[],typeofCross=0;const fwdEdges=new Map(),fwdNames=new Set(),valueNames=new Set();
const topLevelStmt=(n)=>{while(n.parent&&!ts.isSourceFile(n.parent))n=n.parent;return n};
let fwdTop=[]; // forward refs executed at top level (not inside function)
const inFn=n=>{for(let p=n.parent;p;p=p.parent){if(ts.isFunctionLike(p)||ts.isClassDeclaration(p)||ts.isClassExpression(p))return true}return false};
for(const f of files){const sf=prog.getSourceFile(f);
 (function walk(n){
  if(ts.isIdentifier(n)){
   const par=n.parent;
   // skip declarations names / property names
   const isDeclName=(ts.isVariableDeclaration(par)||ts.isFunctionDeclaration(par)||ts.isParameter(par)||ts.isInterfaceDeclaration(par)||ts.isTypeAliasDeclaration(par)||ts.isBindingElement(par))&&par.name===n;
   const isProp=(ts.isPropertyAccessExpression(par)&&par.name===n)||(ts.isPropertyAssignment(par)&&par.name===n)||(ts.isPropertySignature(par)&&par.name===n)||(ts.isMethodDeclaration(par)&&par.name===n)||(ts.isQualifiedName(par)&&par.right===n)||(ts.isPropertyDeclaration(par)&&par.name===n)||(ts.isMethodSignature(par)&&par.name===n)||(ts.isLabeledStatement(par))||(ts.isBreakOrContinueStatement(par));
   if(!isDeclName&&!isProp){
    let sym=chk.getSymbolAtLocation(n);
    if(par&&ts.isShorthandPropertyAssignment(par)&&par.name===n)sym=chk.getShorthandAssignmentValueSymbol(par);
    if(sym&&sym.declarations&&sym.declarations.length){
      const d=sym.declarations[0];const df=d.getSourceFile().fileName;
      if(df!==f&&idx.has(df)){
        const isType=ts.isInterfaceDeclaration(d)||ts.isTypeAliasDeclaration(d);
        if(isType){typeRefs++;}
        else{
          const name=n.text;valueNames.add(name);
          if(idx.get(df)>idx.get(f)){fwd++;fwdNames.add(name);const k=path.relative(root,f)+' -> '+path.relative(root,df);fwdEdges.set(k,(fwdEdges.get(k)||0)+1);if(!inFn(n))fwdTop.push(path.relative(root,f)+':'+sf.getLineAndCharacterOfPosition(n.getStart()).line+' '+name)}else bwd++;
          // assignment?
          let isAssign=false;const p=par;
          if(ts.isBinaryExpression(p)&&p.left===n&&p.operatorToken.kind>=ts.SyntaxKind.FirstAssignment&&p.operatorToken.kind<=ts.SyntaxKind.LastAssignment)isAssign=true;
          if((ts.isPrefixUnaryExpression(p)||ts.isPostfixUnaryExpression(p))&&(p.operator===ts.SyntaxKind.PlusPlusToken||p.operator===ts.SyntaxKind.MinusMinusToken))isAssign=true;
          if(isAssign)assignCross.push(path.relative(root,f)+':'+(sf.getLineAndCharacterOfPosition(n.getStart()).line+1)+' '+name);
          if(ts.isTypeOfExpression(p))typeofCross++;
        }
      }
    }
   }
  }
  ts.forEachChild(n,walk)})(sf)}
console.log({fwd,bwd,typeRefs,distinctValueNamesCross:valueNames.size,distinctForwardNames:fwdNames.size,typeofCross});
console.log('cross-file ASSIGNMENTS to imported bindings:',assignCross.length);assignCross.slice(0,30).forEach(x=>console.log('  ',x));
console.log('forward refs executed at TOP LEVEL (not in function):',fwdTop.length);fwdTop.slice(0,40).forEach(x=>console.log('  ',x));
console.log('forward edges (file pairs):',fwdEdges.size);
const es=[...fwdEdges].sort((a,b)=>b[1]-a[1]).slice(0,15);es.forEach(([k,v])=>console.log('  ',v,k));
