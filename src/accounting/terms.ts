/* One source for commercial credit terms. Keeps due-date logic out of forms. */
const paymentTermsAddDays=(date:string,days:number)=>{
  const value=S(date);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return value;
  const d=new Date(`${value}T00:00:00Z`);
  if(!Number.isFinite(d.getTime()))return value;
  d.setUTCDate(d.getUTCDate()+Math.trunc(N(days)));
  return d.toISOString().slice(0,10);
};

const PaymentTerms={
 days(type,id){const x=type==='supplier'?byId(DB.data.suppliers,id):type==='agent'?byId(DB.data.agents,id):byId(DB.data.customers,id);if(!x)return 0;const explicit=N(x.creditDays);if(explicit>=0&&S(x.creditDays)!=='')return Math.max(0,Math.floor(explicit));const text=S(x.paymentTerms||'');const m=text.match(/(\d{1,4})/);return m?Math.max(0,Number(m[1])):0},
 dueDate(type,id,date=today()){const d=this.days(type,id);return d>0?paymentTermsAddDays(date,d):date},
 label(type,id){const d=this.days(type,id);return d?`${d} يوم ائتمان`:'استحقاق فوري'}
};
