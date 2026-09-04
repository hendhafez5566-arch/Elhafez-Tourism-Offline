/*
 * Central UI action policy.
 * The server remains the final authority; this layer prevents presenting
 * actions that the accounting / operational lifecycle will reject anyway.
 */
const ActionPolicy={
 status(x){return S(x?.status||'').trim().toLowerCase()},
 canEdit(kind,x){
  if(!x)return false;
  const s=this.status(x);
  switch(kind){
   case 'purchaseOrder': return s==='draft';
   case 'quotation': return !['accepted','converted','void','cancelled'].includes(s);
   case 'invoice':
   case 'receipt':
   case 'payment':
   case 'expense':
   case 'manualJournalDraft':
   case 'transfer': return s==='draft';
   case 'journal': return !['posted','reversed'].includes(s);
   case 'umrahBooking': return ['inquiry','quotation','hold','waitlist'].includes(s);
   case 'umrahProgram': return ['planning','contracting','pricing'].includes(s);
   case 'cashCount':
   case 'fxRevaluation':
   case 'cheque': return false;
   default: return true;
  }
 },
 reason(kind,x){
  if(this.canEdit(kind,x))return '';
  const labels={purchaseOrder:'أمر الشراء',quotation:'عرض السعر',invoice:'الفاتورة',receipt:'سند القبض',payment:'سند الصرف',expense:'المصروف',manualJournalDraft:'القيد',transfer:'التحويل',journal:'القيد',umrahBooking:'حجز الحج/العمرة',umrahProgram:'برنامج الحج/العمرة',cashCount:'الجرد النقدي',fxRevaluation:'إعادة تقييم العملة',cheque:'الشيك'};
  return `${labels[kind]||'المستند'} في حالته الحالية غير قابل للتعديل. استخدم الإجراء المحاسبي المتاح مثل الإلغاء أو العكس بدل تعديل السجل التاريخي.`
 },
 requireEditable(kind,x){if(!this.canEdit(kind,x))throw new Error(this.reason(kind,x));return true}
};
