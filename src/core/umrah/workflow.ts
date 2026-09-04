// Hajj & Umrah workflow completion layer.
// Keeps the proven operational core intact while making package requirements configurable
// and binding readiness, tasks, traveler checks and bundled services to one source of truth.
const UmrahCore_RequirementLabels={hotel:'الإقامة',flight:'الطيران',transport:'النقل',visa:'التأشيرة',meal:'الإعاشة',visit:'الزيارات',guide:'المشرف / المرشد',rawda:'الروضة',insurance:'التأمين',health:'المتطلبات الصحية',camp:'المخيم/المشاعر',permit:'التصاريح/نسك'};
const UmrahCore_defaultRequirements=(programType='umrah',legacy=false)=>({
 hotel:true,
 flight:true,
 // Legacy programs keep the exact old opening behavior; new programs default to a complete transport flow.
 transport:legacy?false:true,
 visa:false,meal:false,visit:false,guide:false,rawda:false,insurance:false,health:false,
 camp:programType==='hajj',permit:programType==='hajj'
});
const UmrahCore_requirementsFromForm=(o,programType,existing=null)=>{
 const base={...UmrahCore_defaultRequirements(programType,false),...(existing||{})};
 if(o?.requirementsConfigured!=='1'&&o?.requirementsConfigured!==1)return base;
 const has=k=>o[`req${k[0].toUpperCase()+k.slice(1)}`]==='yes'||o[`req${k[0].toUpperCase()+k.slice(1)}`]==='on'||o[`req${k[0].toUpperCase()+k.slice(1)}`]===true;
 const out={};for(const k of Object.keys(UmrahCore_RequirementLabels))out[k]=has(k);
 // Hajj permit/camp are still configurable, but default checked in the UI.
 return out;
};
const UmrahCore_programReq=p=>({ ...UmrahCore_defaultRequirements(p?.programType||'umrah',!p?.requirements),...(p?.requirements||{}) });
const UmrahCore_reqSegmentType=k=>({hotel:'hotel',flight:'flight',transport:'transport',visa:'visa',meal:'meal',visit:'visit',guide:'guide',rawda:'rawda',insurance:'insurance',camp:'camp',permit:'permit'})[k]||'';
const UmrahCore_serviceCostCategory=t=>({hotel:'hotel',flight:'flight',transport:'transport',visa:'visa',camp:'camp',permit:'permit',meal:'meal',guide:'supervision',rawda:'other',insurance:'other',visit:'other',meeting:'other',custom:'other'})[t]||'other';

// Normalize persisted legacy state without destructive migration.
const UmrahCore_EnsureBase=UmrahCore_DB.ensure.bind(UmrahCore_DB);
UmrahCore_DB.ensure=function(){
 const r=UmrahCore_EnsureBase();
 for(const p of this.data.programs||[]){
  if(!p.requirements)p.requirements=UmrahCore_defaultRequirements(p.programType||'umrah',true);
  else p.requirements={...UmrahCore_defaultRequirements(p.programType||'umrah',true),...p.requirements};
  p.team={operationsManager:'',operationsPhone:'',groupLeader:'',groupLeaderPhone:'',guideName:'',guidePhone:'',...(p.team||{})};
  p.customerCancellationPolicy=p.customerCancellationPolicy||'';
 }
 for(const t of this.data.travelers||[]){
  t.healthStatus=t.healthStatus||'not_required';
  t.vaccinationStatus=t.vaccinationStatus||'';
  t.medicalNotes=t.medicalNotes||'';
 }
 return r;
};

const UmrahCore_CreateProgramBase=UmrahCore_Ops.createProgram.bind(UmrahCore_Ops);
const UmrahCore_UpdateProgramBase=UmrahCore_Ops.updateProgram.bind(UmrahCore_Ops);
const UmrahCore_UpdateTravelerBase=UmrahCore_Ops.updateTraveler.bind(UmrahCore_Ops);
Object.assign(UmrahCore_Ops,{
 programRequirements(pOrId){const p=typeof pOrId==='string'?this.program(pOrId):pOrId;return UmrahCore_programReq(p)},
 createProgram(o){const p=UmrahCore_CreateProgramBase(o);p.requirements=UmrahCore_requirementsFromForm(o,p.programType,null);p.team={operationsManager:o.operationsManager||'',operationsPhone:o.operationsPhone||'',groupLeader:o.groupLeader||'',groupLeaderPhone:o.groupLeaderPhone||'',guideName:o.guideName||'',guidePhone:o.guidePhone||''};p.customerCancellationPolicy=o.customerCancellationPolicy||'';this.rebuildSystemTasks(p);return p},
 updateProgram(id,o){const p=UmrahCore_UpdateProgramBase(id,o);p.requirements=UmrahCore_requirementsFromForm(o,p.programType,p.requirements);p.team={...(p.team||{}),operationsManager:o.operationsManager||'',operationsPhone:o.operationsPhone||'',groupLeader:o.groupLeader||'',groupLeaderPhone:o.groupLeaderPhone||'',guideName:o.guideName||'',guidePhone:o.guidePhone||''};p.customerCancellationPolicy=o.customerCancellationPolicy||'';this.rebuildSystemTasks(p);return p},
 updateTraveler(id,o){const r=UmrahCore_UpdateTravelerBase(id,o),t=this.traveler(id);if(t){t.healthStatus=o.healthStatus||t.healthStatus||'not_required';t.vaccinationStatus=o.vaccinationStatus||'';t.medicalNotes=o.medicalNotes||'';this.syncAutoTasks(t.programId)}return r},
 rebuildSystemTasks(p){
  const keep=(UmrahCore_DB.data.operationTasks||[]).filter(x=>x.programId!==p.id||String(x.code||'').startsWith('custom-'));
  UmrahCore_DB.data.operationTasks=keep;this.seedTasks(p);this.syncAutoTasks(p.id);
 },
 seedTasks(p){
  const r=this.programRequirements(p),defs=[['contracts','مراجعة التعاقدات والمخزون',-35,true],['pricing','اعتماد التكلفة والتسعير',-30,true]];
  if(r.visa)defs.push(['visa','استكمال التأشيرات المطلوبة',-18,true]);
  if(r.flight)defs.push(['tickets','إصدار التذاكر ومراجعة الأسماء',-7,true]);
  if(r.hotel)defs.push(['rooming','اعتماد قوائم توزيع الغرف',-5,true]);
  if(r.transport)defs.push(['transport','اعتماد توزيع المركبات',-3,true]);
  if(r.permit)defs.push(['permit','اعتماد التصاريح / نسك',-7,true]);
  if(r.camp)defs.push(['camp','اعتماد تسكين المخيم / المشاعر',-5,true]);
  if(r.health)defs.push(['health','اعتماد المتطلبات الصحية للمسافرين',-4,true]);
  defs.push(['financial','مراجعة الموقف المالي للحجوزات',-2,true],['manifest','إقفال كشف المسافرين النهائي',-1,true]);
  for(const [code,title,offset,critical] of defs)UmrahCore_DB.data.operationTasks.push({id:UmrahCore_iid(),branchId:p.branchId||UmrahCore_Bridge.branchId(),programId:p.id,code,title,dueDate:UmrahCore_dateAdd(p.departureDate,offset),critical,status:'pending',ownerId:'',notes:'',doneAt:'',createdAt:UmrahCore_now()});
 },
 syncAutoTasks(programId){
  const p=this.program(programId);if(!p)return;const r=this.programRequirements(p),activeBookings=UmrahCore_DB.data.bookings.filter(b=>b.programId===programId&&this.activeBookingStatuses.has(b.status)),trav=UmrahCore_DB.data.travelers.filter(t=>t.programId===programId&&t.active!==false&&activeBookings.some(b=>b.id===t.bookingId)),all=fn=>trav.length>0&&trav.every(fn);
  const conds={contracts:()=>this.financialSetupGaps(programId).length===0,pricing:()=>Object.values(p.pricing||{}).some(v=>UmrahCore_N(v)>0),visa:()=>!r.visa||all(t=>t.visaStatus==='issued'),tickets:()=>!r.flight||all(t=>this.travelerFlightReady(t)),rooming:()=>!r.hotel||all(t=>this.segments(programId,'hotel').every(s=>!!t.roomAssignments?.[s.id])),transport:()=>!r.transport||all(t=>this.transportAssigned(t.id)),permit:()=>!r.permit||all(t=>t.hajjPermitStatus==='issued'),camp:()=>!r.camp||all(t=>!!UmrahCore_S(t.campAssignment).trim()),health:()=>!r.health||all(t=>t.healthStatus==='cleared'),financial:()=>activeBookings.length>0&&activeBookings.every(b=>this.bookingReadiness(b).finance==='ok'),manifest:()=>all(t=>this.travelerReadiness(t).score===100)};
  for(const task of UmrahCore_DB.data.operationTasks.filter(x=>x.programId===programId&&conds[x.code])){const ok=!!conds[task.code]();if(ok&&task.status!=='done'){task.status='done';task.autoDone=true;task.doneAt=UmrahCore_now();task.doneBy='SYSTEM'}else if(!ok&&task.autoDone){task.status='pending';task.autoDone=false;task.doneAt='';task.doneBy=''}}
 },
 travelerReadiness(t){
  const p=this.program(t.programId),r=this.programRequirements(p),passport=!!(t.passportNo&&t.passportExpiry&&p&&t.passportExpiry>=UmrahCore_monthsAdd(p.departureDate,UmrahCore_DB.data.settings.passportValidityMonths)),name=!!UmrahCore_S(t.nameAr).trim();
  const visa=!r.visa||t.visaStatus==='issued',ticket=!r.flight||this.travelerFlightReady(t),hotel=!r.hotel||this.segments(t.programId,'hotel').every(s=>!!t.roomAssignments?.[s.id]),transport=!r.transport||this.transportAssigned(t.id),permit=!r.permit||t.hajjPermitStatus==='issued',camp=!r.camp||!!UmrahCore_S(t.campAssignment).trim(),health=!r.health||t.healthStatus==='cleared';
  const parts={name,passport,...(r.visa?{visa}:{}),...(r.flight?{ticket}:{}),...(r.hotel?{hotel}:{}),...(r.transport?{transport}:{}),...(r.permit?{permit}:{}),...(r.camp?{camp}:{}),...(r.health?{health}:{})},score=Math.round(Object.values(parts).filter(Boolean).length/Math.max(1,Object.keys(parts).length)*100);
  return {...parts,visa,visaRequired:r.visa,ticket,hotel,transport,permit,camp,health,permitRequired:r.permit,campRequired:r.camp,healthRequired:r.health,score}
 },
 programOpenGaps(id){
  const p=this.program(id);if(!p)return[{code:'program_missing',message:'البرنامج غير موجود'}];const r=this.programRequirements(p),gaps=[],hotels=this.segments(id,'hotel'),flights=this.segments(id,'flight'),trans=this.segments(id,'transport');
  const need=(key)=>{if(!r[key])return;const type=UmrahCore_reqSegmentType(key);if(type&&this.segments(id,type).length===0)gaps.push({code:`${key}_missing`,message:`الخدمة مطلوبة في تكوين الباقة: أضف ${UmrahCore_RequirementLabels[key]} قبل فتح البيع`,action:key==='flight'?'flightSetup':'program'})};
  for(const k of ['hotel','flight','transport','visa','meal','visit','rawda','insurance','camp','permit'])need(k);
  if(r.guide&&!UmrahCore_S(p.team?.guideName).trim()&&this.segments(id,'guide').length===0)gaps.push({code:'guide_missing',message:'الباقة تتطلب مشرف/مرشد؛ حدد المرشد في بيانات البرنامج أو أضف خدمة مرشد',action:'program'});
  if(r.flight&&flights.length){const outbound=flights.some(f=>f.start===p.departureDate||f.end===p.departureDate),returnLeg=flights.some(f=>f.start===p.returnDate||f.end===p.returnDate);if(!outbound||!returnLeg){const missing=[!outbound?`رحلة ذهاب بتاريخ ${p.departureDate}`:'',!returnLeg?`رحلة عودة بتاريخ ${p.returnDate}`:''].filter(Boolean).join(' و');gaps.push({code:'flight_schedule',message:`لا يمكن فتح البرنامج للبيع: أضف/صحح ${missing}.`,action:'flightSetup'})}}
  if(r.hotel&&hotels.length){const nights=hotels.reduce((z,h)=>z+(UmrahCore_N(h.nights)>0?UmrahCore_N(h.nights):Math.max(1,UmrahCore_daysBetween(h.start,UmrahCore_dateAdd(h.end,1)))),0),required=Math.max(0,UmrahCore_daysBetween(p.departureDate,p.returnDate));if(nights!==required)gaps.push({code:'hotel_nights',message:`إجمالي ليالي الإقامة ${nights} لا يطابق ليالي البرنامج ${required}`,action:'program'});for(const h of hotels){const beds=Object.entries(h.inventory||{}).reduce((z,[k,v])=>z+UmrahCore_N(v)*(UmrahCore_roomCap[k]||0),0);if(beds<UmrahCore_N(p.capacity))gaps.push({code:'hotel_capacity',message:`سعة ${h.title} (${beds}) أقل من سعة البرنامج (${p.capacity})`,action:'program'})}}
  if(r.flight)for(const f of flights)if(UmrahCore_N(f.seats)<UmrahCore_N(p.capacity))gaps.push({code:'flight_capacity',message:`مقاعد ${f.title} (${UmrahCore_N(f.seats)}) أقل من سعة البرنامج (${p.capacity})`,action:'flightSetup'});
  if(r.transport)for(const t of trans)if(UmrahCore_N(t.capacity)>0&&UmrahCore_N(t.capacity)<UmrahCore_N(p.capacity))gaps.push({code:'transport_capacity',message:`سعة النقل ${t.title} (${UmrahCore_N(t.capacity)}) أقل من سعة البرنامج (${p.capacity})`,action:'program'});
  const treasury=UmrahCore_Bridge.preferredTreasury(p.currency,p.defaultTreasuryId||'');if(!treasury)gaps.push({code:'treasury_missing',message:`لا توجد خزنة/حساب نشط بعملة ${p.currency} لتحصيل حجوزات البرنامج`,action:'program'});
  const financial=this.financialSetupGaps(id);if(financial.length)gaps.push({code:'financial_setup',message:`الربط المالي ناقص: ${financial.map(x=>x.title).join('، ')}`,action:'program'});
  return gaps
 },
 addServiceBundle(o){
  UmrahCore_Bridge.require('umrah.programs','edit');const p=this.program(o.programId);if(!p)throw new Error('البرنامج غير موجود');const type=o.type||'custom',supplierId=o.supplierId||'',amount=UmrahCore_N(o.amount),procurementPolicy=o.procurementPolicy||'budgetOnly';if(procurementPolicy!=='budgetOnly'&&!supplierId)throw new Error('اختر المورد عند إنشاء التزام شراء');
  const seg=this.addSegment({programId:p.id,type,title:o.title,start:o.start||p.departureDate,end:o.end||o.start||p.departureDate,sequence:o.sequence,supplierId,city:o.city,route:o.route,deadline:o.deadline,details:o.details},true);
  let cost=null;if(amount>0){cost=UmrahCore_Cost.add({programId:p.id,category:UmrahCore_serviceCostCategory(type),description:o.costDescription||o.title,amount,currency:o.currency||p.currency,fxToBase:o.fxToBase,mode:o.mode||'fixed',supplierId,procurementPolicy,actualizationPolicy:'manual',sourceSegmentId:seg.id,notes:o.notes||''},true);UmrahCore_Procurement.syncCost(cost)}
  this.syncAutoTasks(p.id);UmrahCore_Bridge.audit('create','umrahServiceBundle',seg.id,`${p.no} — ${seg.title}`);return{segment:seg,cost}
 }
});
