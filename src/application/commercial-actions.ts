import type { ApplicationFields, CommercialWorkflowDeps } from './contracts';
const CommercialWorkflows={
 async serverAudit(deps:CommercialWorkflowDeps){
  const result=await deps.audit.read();
  return (result.items||[]).map(entry=>({...entry,userName:deps.audit.userName(entry.user_id)||entry.user_id||'نظام'}));
 },
 setActivityRange(deps:CommercialWorkflowDeps,range:string){
  deps.activity.setRange(range);deps.persistence.save(false);
 },
 async clearActivity(deps:CommercialWorkflowDeps,range:string,cut:number){
  deps.activity.replace(deps.activity.entries().filter(x=>range!=='all'&&Date.parse(x.date)<cut));
  deps.activity.trimUmrah(range,cut);
  await deps.persistence.save(false);
  try{await deps.activity.clearRemote(range);}catch(error){deps.activity.warn(error);}
 },
 activityCut(deps:CommercialWorkflowDeps,range:string){
  const days:Record<string,number>={day:1,'7d':7,'30d':30,'365d':365};
  return range==='all'?Infinity:deps.nowMillis()-(days[range]||30)*86400000;
 },
 prepareBranch(deps:CommercialWorkflowDeps,id:string){
  deps.authorization.require('branches',id?'edit':'add');
  const branch=id?deps.branches.find(id):null;
  return {branch,save:(fields:ApplicationFields)=>deps.transactions.atomic('branch',()=>branch?deps.branches.update(id,fields):deps.branches.create(fields))};
 },
 prepareUserBranches(deps:CommercialWorkflowDeps,id:string){
  deps.authorization.require('users','edit');
  const user=deps.users.find(id);if(!user)throw new Error('المستخدم غير موجود');
  return {user,branches:()=>deps.branches.all(),save:(ids:string[])=>{
   if(!ids.length)throw new Error('اختر فرعًا واحدًا على الأقل');
   user.allowedBranchIds=ids;user.branchId=ids.includes(user.branchId)?user.branchId:ids[0];
   deps.persistence.log('branches','user',user.id,ids.join(','));deps.persistence.save();
  }};
 }
};
export { CommercialWorkflows };
