/* Central expense-category registry. Keeps expense classification configurable without changing posted history. */
const ExpenseCategories={
 defaults:[
  {id:'EXP-RENT',name:'إيجار ومقر',expenseAccountId:'5210',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-MKT',name:'تسويق وإعلان',expenseAccountId:'5230',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-PROG',name:'تشغيل برامج',expenseAccountId:'5110',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-COMM',name:'اتصالات وإنترنت',expenseAccountId:'5220',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-PAYROLL',name:'رواتب وأجور',expenseAccountId:'5240',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-LOCAL-TRANSPORT',name:'نقل وانتقالات',expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-GOV',name:'رسوم حكومية',expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-MAINT',name:'صيانة',expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-HOSP',name:'ضيافة',expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-BANK',name:'مصروفات بنكية',expenseAccountId:'5260',taxId:'TAX0',costCenterId:'',active:true},
  {id:'EXP-OTHER',name:'أخرى',expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true}
 ],
 ensure(){const s=DB.data.settings||(DB.data.settings={}),legacy=Array.isArray(s.expenseCategories)?s.expenseCategories.filter(Boolean):[],raw=Array.isArray(s.expenseCategoryDefs)?s.expenseCategoryDefs:[];let defs=raw.map(x=>({id:S(x.id)||`EXP-${iid()}`,name:S(x.name).trim(),expenseAccountId:S(x.expenseAccountId||'5200'),taxId:S(x.taxId||'TAX0'),costCenterId:S(x.costCenterId||''),active:x.active!==false})).filter(x=>x.name);if(!defs.length)defs=deep(this.defaults);for(const name of legacy)if(!defs.some(x=>x.name===name))defs.push({id:`EXP-${iid()}`,name:S(name),expenseAccountId:'5200',taxId:'TAX0',costCenterId:'',active:true});s.expenseCategoryDefs=defs;s.expenseCategories=defs.map(x=>x.name);return defs},
 all(){return this.ensure()},
 active(current=''){return this.ensure().filter(x=>x.active!==false||x.name===current)},
 get(id){return this.ensure().find(x=>x.id===id)},
 byName(name){return this.ensure().find(x=>x.name===name)},
 add(o){Auth.require('expenses','edit');const defs=this.ensure(),name=S(o.name).trim();if(!name)throw new Error('اكتب اسم تصنيف المصروف');if(defs.some(x=>x.name.toLowerCase()===name.toLowerCase()))throw new Error('يوجد تصنيف مصروف بنفس الاسم');const x={id:`EXP-${iid()}`,name,expenseAccountId:S(o.expenseAccountId||'5200'),taxId:S(o.taxId||'TAX0'),costCenterId:S(o.costCenterId||''),active:true};defs.push(x);DB.data.settings.expenseCategoryDefs=defs;DB.data.settings.expenseCategories=defs.map(v=>v.name);DB.log('add','expense-category',x.id,`إضافة تصنيف مصروف: ${name}`);return x},
 update(id,o){Auth.require('expenses','edit');const defs=this.ensure(),x=defs.find(v=>v.id===id);if(!x)throw new Error('تصنيف المصروف غير موجود');const name=S(o.name).trim();if(!name)throw new Error('اكتب اسم تصنيف المصروف');if(defs.some(v=>v.id!==id&&v.name.toLowerCase()===name.toLowerCase()))throw new Error('يوجد تصنيف مصروف بنفس الاسم');x.name=name;x.expenseAccountId=S(o.expenseAccountId||'5200');x.taxId=S(o.taxId||'TAX0');x.costCenterId=S(o.costCenterId||'');DB.data.settings.expenseCategoryDefs=defs;DB.data.settings.expenseCategories=defs.map(v=>v.name);DB.log('edit','expense-category',x.id,`تعديل تصنيف مصروف: ${name}`);return x},
 toggle(id){Auth.require('expenses','edit');const defs=this.ensure(),x=defs.find(v=>v.id===id);if(!x)throw new Error('تصنيف المصروف غير موجود');x.active=x.active===false;DB.data.settings.expenseCategoryDefs=defs;DB.log('edit','expense-category',x.id,`${x.active?'تشغيل':'إيقاف'} تصنيف مصروف: ${x.name}`);return x},
 items(current=''){const a=this.active(current).map(x=>({value:x.name,label:x.active===false?`${x.name} — موقوف`:x.name}));if(current&&!a.some(x=>x.value===current))a.unshift({value:current,label:`${current} — تصنيف تاريخي`});return a}
};
