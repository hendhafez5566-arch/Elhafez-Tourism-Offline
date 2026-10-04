import ts from 'typescript'; import fs from 'fs';
const F='src/core/umrah/operations.ts'; const src=fs.readFileSync(F,'utf8');
const sf=ts.createSourceFile(F,src,ts.ScriptTarget.ES2020,true);
const imports=[]; let helperStmts=[]; let opsDecl, tailStmts=[];
for(const n of sf.statements){
  if(ts.isImportDeclaration(n)){ const names=n.importClause.namedBindings.elements.map(e=>e.getText()); imports.push({names,from:n.moduleSpecifier.getText()}); }
  else if(ts.isVariableStatement(n)){ const d=n.declarationList.declarations[0]; const nm=d.name.getText();
    if(nm==='UmrahCore_Ops') opsDecl=d; else if(nm==='UmrahCore_AdvancedPages') tailStmts.push(n); else helperStmts.push(n); }
}
const props=opsDecl.initializer.properties.map(p=>({name:p.name.getText(),text:p.getText()}));
const groups={
 'operations-queries':['activeBookingStatuses','resourceBookingStatuses','season','program','booking','traveler','segment','scoped','activeTravelers'],
 'operations-contract-setup':['addSeason','updateSeason','addHotelContract','updateHotelContract','addFlightBlock','updateFlightBlock','addTransportContract','updateTransportContract','addVisaContract','updateVisaContract'],
 'operations-program-lifecycle':['createProgram','updateProgram','programOpenGaps','assertProgramOpenReady','saveSimpleFlightSchedule','setProgramStatus','programCancellationBlockers','cancelProgram','programCloseBlockers','closeProgram','addSegment','removeSegment','segments'],
 'operations-tasks-holds':['seedTasks','refreshTaskDates','addTask','toggleTask','syncAutoTasks','expireHolds','holdsExpiring','syncTimedStatuses','reservedPersons','availablePersons','hotelInventoryAvailable','flightSeatsAvailable'],
 'operations-bookings':['bookingGross','bookingPrice','bookingDiscountLimit','validateBookingDiscount','assertNewBookingSaleAllowed','validateBooking','createBooking','buildDefaultRoomPlan','normalizeRoomPlan','setBookingRoomPlan','updateBooking','confirmBooking','setBookingStatus','requestCancel','completeCancel','transferBooking'],
 'operations-travelers-readiness':['syncTravelers','updateTraveler','updateHajjService','ensureHotelRooms','autoAssignRooms','releaseBookingResources','travelerFlightReady','travelerReadiness','transportAssigned','syncPaymentStatus','bookingReadiness','financialSetupGaps','blockers','programReadiness','eligibleVisaTravelers'],
};
const all=Object.values(groups).flat(); const names=props.map(p=>p.name);
if(all.length!==names.length||names.some(n=>!all.includes(n))||new Set(all).size!==all.length) throw new Error('grouping mismatch '+names.filter(n=>!all.includes(n)));
const helperNames=['UmrahCore_travelerIdentityKey','UmrahCore_duplicateTravelerGroups','UmrahCore_duplicateTravelerIds'];
const helperText=helperStmts.map(s=>s.getText()).join('\n');
const used=(text,id)=>new RegExp('(?<![\\w$])(?<![^.]\\.)'+id.replace(/\$/g,'\\$')+'(?![\\w$])').test(text);
const pascal=g=>'UmrahOps_'+g.replace('operations-','').split('-').map(w=>w[0].toUpperCase()+w.slice(1)).join('');
const impLines=(text,skip=[])=>imports.map(i=>{const ns=i.names.filter(n=>!skip.includes(n)&&used(text,n.split(' as ').pop()));return ns.length?`import { ${ns.join(', ')} } from ${i.from};`:null}).filter(Boolean);
// identity helpers module
const idBody=helperText+`\nexport { ${helperNames.join(', ')} };\n`;
fs.writeFileSync('src/core/umrah/operations-identity.ts',[...impLines(helperText),idBody].join('\n'));
const groupNames=[];
for(const [g,list] of Object.entries(groups)){
  const body=list.map(n=>props.find(p=>p.name===n).text.replace(/UmrahCore_Ops\./g,'this.')).join(',\n    ');
  const decl=`const ${pascal(g)}: any = {\n    ${body}\n};\nexport { ${pascal(g)} };\n`;
  const lines=impLines(decl);
  const usesHelpers=helperNames.filter(h=>used(decl,h));
  if(usesHelpers.length) lines.push(`import { ${usesHelpers.join(', ')} } from './operations-identity';`);
  fs.writeFileSync(`src/core/umrah/${g}.ts`,lines.join('\n')+'\n'+decl); groupNames.push([g,pascal(g)]);
}
const tail=tailStmts.map(s=>s.getText()).join('\n');
const head=[`import { __set_UmrahCore_Ops } from '../late-bindings';`,...groupNames.map(([g,p])=>`import { ${p} } from './${g}';`),`import { ${helperNames.join(', ')} } from './operations-identity';`];
const out=head.join('\n')+`\nconst UmrahCore_Ops: any = {\n${groupNames.map(([,p])=>`    ...${p}`).join(',\n')}\n};\n__set_UmrahCore_Ops(UmrahCore_Ops);\n${tail}\nexport { UmrahCore_AdvancedPages, UmrahCore_Ops, ${helperNames.join(', ')} };\n`;
fs.writeFileSync(F,out);
console.log(groupNames.map(([g])=>g+' '+fs.statSync(`src/core/umrah/${g}.ts`).size).join('\n'),'\nops',fs.statSync(F).size);
