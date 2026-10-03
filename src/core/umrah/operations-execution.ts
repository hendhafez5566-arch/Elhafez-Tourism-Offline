import { UmrahCore_N, UmrahCore_S, UmrahCore_iid, UmrahCore_localDateTime, UmrahCore_money, UmrahCore_now, UmrahCore_today, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Bridge, UmrahCore_Cost, UmrahCore_DB } from './data';
import { UmrahCore_Procurement } from './procurement';
import { UmrahCore_Ops } from './operations';
import { UmrahCore_visaStatusLabel } from '../late-bindings';
// Visa, ticketing, transport execution and incident lifecycle split from operations.ts without behavioral changes.
const UmrahCore_OperationsExecution: any = {
    createVisaBatch(o) { UmrahCore_Bridge.require('umrah.visas', 'add'); const p = this.program(o.programId); if (!p)
        throw new Error('اختر البرنامج'); const eligible = this.eligibleVisaTravelers(p.id); if (!eligible.length)
        throw new Error('لا يمكن إنشاء دفعة مكررة: كل المسافرين المؤكدين موجودون بالفعل في دفعة تأشيرات نشطة. استخدم «إضافة المسافرين الجدد» داخل الدفعة الحالية.'); let vc = UmrahCore_DB.data.programCosts.find(c => c.programId === p.id && c.category === 'visa' && c.active !== false && UmrahCore_N(c.amount) > 0 && c.supplierId && c.procurementPolicy !== 'budgetOnly'); if (!vc) {
        const supplierId = o.providerId || '', amount = UmrahCore_N(o.costPerVisa), currency = o.currency || p.currency;
        if (!supplierId || amount <= 0)
            throw new Error('حدد تكلفة التأشيرة للفرد وموردها قبل إنشاء الدفعة حتى لا تصدر خدمة بدون مستحق مورد');
        vc = UmrahCore_Cost.add({ programId: p.id, category: 'visa', description: 'تكلفة التأشيرة للفرد', amount, currency, fxToBase: UmrahCore_Bridge.rate(currency, p.departureDate || UmrahCore_today()), mode: 'perPax', supplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onVisaIssued' });
    } if (o.providerId && o.providerId !== vc.supplierId)
        throw new Error('مورد دفعة التأشيرات مختلف عن المورد المحدد في تكلفة البرنامج'); const x = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), no: UmrahCore_DB.next('visa'), programId: p.id, providerId: vc.supplierId, submittedAt: o.submittedAt || '', deadline: o.deadline || '', status: o.status || 'draft', notes: o.notes || '', createdAt: UmrahCore_now() }; UmrahCore_DB.data.visaBatches.unshift(x); const added = this.syncVisaBatchTravelers(p.id, x.id); if (!added)
        throw new Error('لا يوجد مسافرون مؤكدون غير مضافين إلى دفعة تأشيرات نشطة'); UmrahCore_Bridge.audit('create', 'visaBatch', x.id, `${x.no} • ${UmrahCore_money(vc.amount, vc.currency)} للفرد • ${added} ملف`); return x; },
    syncVisaBatchTravelers(programId, batchId = '') { const batches = UmrahCore_DB.data.visaBatches.filter(v => v.programId === programId && !['cancelled', 'closed', 'completed'].includes(v.status)).sort((a, b) => UmrahCore_S(b.createdAt).localeCompare(UmrahCore_S(a.createdAt))), target = batchId ? UmrahCore_DB.data.visaBatches.find(v => v.id === batchId) : batches[0]; if (!target)
        return 0; let added = 0; for (const t of this.eligibleVisaTravelers(programId)) {
        const active = UmrahCore_DB.data.visaItems.find(v => v.travelerId === t.id && v.active !== false && UmrahCore_DB.data.visaBatches.some(b => b.id === v.batchId && !['cancelled', 'closed'].includes(b.status)));
        if (active)
            continue;
        UmrahCore_DB.data.visaItems.push({ id: UmrahCore_iid(), branchId: t.branchId || UmrahCore_Bridge.branchId(), batchId: target.id, programId, bookingId: t.bookingId, travelerId: t.id, status: t.visaStatus || 'not_started', visaNo: t.visaNo || '', notes: '', active: true, createdAt: UmrahCore_now() });
        added++;
    } return added; },
    updateVisaItem(id, status, visaNo = '') { UmrahCore_Bridge.require('umrah.visas', 'edit'); return UmrahCore_DB.atomic('updateVisaItem', () => { const x = this.scoped('visaItems').find(v => v.id === id); if (!x)
        throw new Error('ملف التأشيرة غير موجود'); const booking = this.booking(x.bookingId); if (booking && ['cancelRequested', 'cancelled', 'expired', 'refunded', 'noShow', 'closed'].includes(booking.status))
        throw new Error('الحجز غير متاح لتعديل التأشيرة في حالته الحالية'); const current = x.status || 'not_started', allowed = { not_started: ['documents_received', 'rejected'], documents_received: ['reviewed', 'more_info', 'rejected'], reviewed: ['ready', 'more_info', 'rejected'], more_info: ['documents_received', 'reviewed', 'rejected'], ready: ['submitted', 'issued', 'rejected'], submitted: ['processing', 'issued', 'more_info', 'rejected'], processing: ['issued', 'more_info', 'rejected'], issued: ['issued'], rejected: ['documents_received'] }; if (status !== current && !(allowed[current] || []).includes(status))
        throw new Error(`لا يمكن نقل التأشيرة مباشرة من ${UmrahCore_visaStatusLabel(current)} إلى ${UmrahCore_visaStatusLabel(status)}`); const no = UmrahCore_S(visaNo || x.visaNo || '').trim(); if (status === 'issued' && !no)
        throw new Error('رقم التأشيرة مطلوب عند الإصدار'); if (status === 'issued' && this.financialSetupGaps(x.programId).some(g => g.category === 'visa'))
        throw new Error('لا يمكن إصدار التأشيرة قبل تحديد تكلفتها وموردها وسياسة إثباتها'); x.status = status; x.visaNo = no; x.updatedAt = UmrahCore_now(); const t = this.traveler(x.travelerId); if (t) {
        t.visaStatus = status;
        t.visaNo = no;
    } if (status === 'issued')
        UmrahCore_Procurement.onVisaProgress(x); const items = UmrahCore_DB.data.visaItems.filter(v => v.batchId === x.batchId && v.active !== false), batch = UmrahCore_DB.data.visaBatches.find(v => v.id === x.batchId); if (batch) {
        batch.status = items.length && items.every(v => v.status === 'issued') ? 'completed' : items.some(v => ['submitted', 'processing'].includes(v.status)) ? 'processing' : 'draft';
        batch.updatedAt = UmrahCore_now();
    } UmrahCore_Bridge.audit('status', 'visaItem', id, status); return x; }); },
    upsertTicket(o) { UmrahCore_Bridge.require('umrah.flights', 'edit'); return UmrahCore_DB.atomic('upsertTicket', () => { const t = this.traveler(o.travelerId); if (!t)
        throw new Error('اختر المسافر'); const booking = this.booking(t.bookingId); if (booking && ['cancelRequested', 'cancelled', 'expired', 'refunded', 'noShow', 'closed'].includes(booking.status))
        throw new Error('الحجز غير متاح لإصدار/تعديل التذاكر في حالته الحالية'); const seg = this.segment(o.segmentId); if (!seg || seg.active === false || seg.type !== 'flight' || seg.programId !== t.programId)
        throw new Error('اختر قطاع طيران حقيقيًا ونشطًا تابعًا لنفس البرنامج'); const status = o.status || 'reserved', pnr = UmrahCore_S(o.pnr || '').trim().toUpperCase(), ticketNo = UmrahCore_S(o.ticketNo || '').trim(); if (['reserved', 'issued', 'reissued'].includes(status) && !pnr)
        throw new Error('PNR مطلوب لهذه الحالة'); if (['issued', 'reissued'].includes(status) && !ticketNo)
        throw new Error('رقم التذكرة مطلوب عند الإصدار'); if (ticketNo && UmrahCore_DB.data.tickets.some(v => v.active !== false && v.travelerId !== t.id && UmrahCore_S(v.ticketNo).trim() === ticketNo))
        throw new Error('رقم التذكرة مستخدم لمسافر آخر'); if (['issued', 'reissued'].includes(status) && this.financialSetupGaps(t.programId).some(g => g.category === 'flight'))
        throw new Error('لا يمكن إصدار التذكرة قبل تحديد تكلفة الطيران ومورده وسياسة إثباتها'); let x = UmrahCore_DB.data.tickets.find(v => v.travelerId === t.id && v.segmentId === seg.id); if (!x) {
        x = { id: UmrahCore_iid(), branchId: t.branchId || UmrahCore_Bridge.branchId(), travelerId: t.id, bookingId: t.bookingId, programId: t.programId, segmentId: seg.id, active: true, createdAt: UmrahCore_now() };
        UmrahCore_DB.data.tickets.push(x);
    } Object.assign(x, { pnr, ticketNo, seat: o.seat || '', baggage: o.baggage || '', fareClass: o.fareClass || '', status, issueDate: o.issueDate || UmrahCore_today(), notes: o.notes || '', active: status !== 'cancelled', updatedAt: UmrahCore_now() }); const all = UmrahCore_DB.data.tickets.filter(k => k.travelerId === t.id && k.active !== false), legs = this.segments(t.programId, 'flight').filter(s => s.active !== false), issuedLegs = legs.filter(leg => all.some(k => k.segmentId === leg.id && ['issued', 'reissued'].includes(k.status))); t.pnr = [...new Set(all.map(k => k.pnr).filter(Boolean))].join(' / '); t.ticketNo = [...new Set(all.map(k => k.ticketNo).filter(Boolean))].join(' / '); t.seat = [...new Set(all.map(k => k.seat).filter(Boolean))].join(' / '); t.baggage = [...new Set(all.map(k => k.baggage).filter(Boolean))].join(' / '); t.ticketStatus = legs.length && issuedLegs.length === legs.length ? (all.some(k => k.status === 'reissued') ? 'reissued' : 'issued') : issuedLegs.length ? 'reserved' : 'not_issued'; if (['issued', 'reissued'].includes(status))
        UmrahCore_Procurement.onTicketProgress(x); UmrahCore_Bridge.audit('update', 'ticket', x.id, `${t.no} • ${seg.title}`); return x; }); },
    createBusRun(o) { UmrahCore_Bridge.require('umrah.transport', 'add'); const p = this.program(o.programId); if (!p)
        throw new Error('اختر البرنامج'); if (['cancelled', 'closed'].includes(p.status))
        throw new Error('البرنامج مغلق ولا يقبل رحلات نقل جديدة'); const seg = this.segment(o.segmentId); if (!seg || seg.type !== 'transport' || seg.programId !== p.id || seg.active === false)
        throw new Error('اختر خدمة النقل التابعة للبرنامج'); const supplierId = o.supplierId || seg.supplierId || ''; if (!supplierId)
        throw new Error('حدد مورد خدمة النقل قبل إنشاء رحلة التشغيل'); const vt = o.vehicleType || 'bus', route = UmrahCore_S(o.route || seg.route || seg.title).trim(); if (!route)
        throw new Error('مسار رحلة النقل مطلوب'); const x = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), no: UmrahCore_DB.next('bus'), programId: p.id, segmentId: seg.id, date: o.date || seg.start || p.departureDate, route, supplierId, vehicleNo: o.vehicleNo || '', driver: o.driver || '', driverPhone: o.driverPhone || '', supervisorId: o.supervisorId || '', vehicleType: vt, capacity: UmrahCore_vehicleCaps[vt] || Math.max(1, UmrahCore_N(o.capacity) || 50), travelerIds: [], notes: o.notes || '', createdAt: UmrahCore_now() }; UmrahCore_DB.data.busRuns.push(x); UmrahCore_Bridge.audit('create', 'busRun', x.id, `${x.no} • ${seg.title}`); return x; },
    autoAssignBuses(programId, segmentId = '') { UmrahCore_Bridge.require('umrah.transport', 'edit'); const segs = this.segments(programId, 'transport'), seg = segmentId ? segs.find(s => s.id === segmentId) : (segs.length === 1 ? segs[0] : null); if (!seg)
        throw new Error(segs.length > 1 ? 'اختر خدمة النقل التي تريد توزيعها' : 'لا توجد خدمة نقل صالحة'); const runs = this.scoped('busRuns').filter(x => x.programId === programId && x.segmentId === seg.id), trav = this.activeTravelers(programId); if (!runs.length)
        throw new Error(`أنشئ مركبة واحدة على الأقل لخدمة ${seg.title}`); for (const r of runs)
        r.travelerIds = []; let idx = 0; for (const t of trav) {
        let placed = false;
        for (let k = 0; k < runs.length; k++) {
            const r = runs[(idx + k) % runs.length];
            if (r.travelerIds.length < r.capacity) {
                r.travelerIds.push(t.id);
                idx = (idx + k + 1) % runs.length;
                placed = true;
                break;
            }
        }
        if (!placed)
            throw new Error(`سعة مركبات ${seg.title} لا تكفي كل المسافرين`);
    } UmrahCore_Bridge.audit('assign', 'busRun', programId, `${seg.title} • ${trav.length} مسافر`); },
    addIncident(o) { UmrahCore_Bridge.require('umrah.incidents', 'add'); const p = this.program(o.programId), t = o.travelerId ? this.traveler(o.travelerId) : null; if (!p)
        throw new Error('اختر البرنامج'); if (t && t.programId !== p.id)
        throw new Error('المسافر المحدد لا يتبع هذا البرنامج'); const x = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), no: UmrahCore_DB.next('incident'), programId: p.id, travelerId: t?.id || '', dateTime: o.dateTime || UmrahCore_localDateTime(), type: o.type || 'other', severity: o.severity || 'medium', title: UmrahCore_S(o.title).trim(), details: o.details || '', action: o.action || '', status: o.status || 'open', ownerId: o.ownerId || '', createdAt: UmrahCore_now() }; if (!x.title)
        throw new Error('عنوان الواقعة مطلوب'); UmrahCore_DB.data.incidents.unshift(x); UmrahCore_Bridge.audit('create', 'incident', x.id, x.no); return x; },
    setIncidentStatus(id, status) { UmrahCore_Bridge.require('umrah.incidents', 'edit'); const x = this.scoped('incidents').find(i => i.id === id); if (!x)
        return; x.status = status; x.closedAt = status === 'closed' ? UmrahCore_now() : ''; UmrahCore_Bridge.audit('status', 'incident', id, status); },
};
Object.assign(UmrahCore_Ops, UmrahCore_OperationsExecution);
export { UmrahCore_OperationsExecution };
