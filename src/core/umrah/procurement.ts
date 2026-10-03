import { UmrahCore_N, UmrahCore_S, UmrahCore_iid, UmrahCore_now, UmrahCore_today } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Inventory } from './contracts-inventory';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_Ops } from '../late-bindings';
import { __set_UmrahCore_Procurement } from '../late-bindings';
// Umrah supplier procurement lifecycle, split from contracts.ts without behavioral changes.
const UmrahCore_Procurement: any = {
    contractInfo(kind, id) { let x, total = 0, currency = '', supplierId = '', description = '', expectedDate = ''; if (kind === 'hotel') {
    x = UmrahCore_ContractCenter.get('hotel', id);
    if (!x)
        return null;
    total = UmrahCore_Inventory.hotelContractTotal(x);
    currency = x.currency;
    supplierId = x.supplierId;
    description = `عقد فندق ${x.hotelName}`;
    expectedDate = x.from;
    }
    else if (kind === 'flight') {
    x = UmrahCore_ContractCenter.get('flight', id);
    if (!x)
        return null;
    total = UmrahCore_N(x.seats) * UmrahCore_N(x.costPerSeat);
    currency = x.currency;
    supplierId = x.supplierId;
    description = `بلوك طيران ${x.name}`;
    expectedDate = (x.outDateTime || '').slice(0, 10);
    }
    else if (kind === 'transport') {
    x = UmrahCore_ContractCenter.get('transport', id);
    if (!x)
        return null;
    total = UmrahCore_N(x.cost);
    currency = x.currency;
    supplierId = x.supplierId;
    description = `عقد نقل ${x.provider}${x.route ? ' — ' + x.route : ''}`;
    expectedDate = x.from;
    }
    else if (kind === 'visa') {
    x = UmrahCore_ContractCenter.get('visa', id);
    if (!x)
        return null;
    total = UmrahCore_N(x.quota) * UmrahCore_N(x.costPerVisa);
    currency = x.currency;
    supplierId = x.supplierId;
    description = `اتفاقية تأشيرات ${x.serviceName}`;
    expectedDate = x.from;
    }
    else if (kind === 'service') {
    x = UmrahCore_ContractCenter.get('service', id); if (!x) return null;
    total = UmrahCore_N(x.quota) * UmrahCore_N(x.costPerUnit); currency = x.currency; supplierId = x.supplierId; description = `عقد خدمة ${x.serviceName}`; expectedDate = x.from;
    } return { x, total, currency, supplierId, description, expectedDate }; },
    findByKey(key) { return UmrahCore_Ops.scoped('supplierCommitments').find(x => x.key === key && x.status !== 'cancelled'); },
    create(o, automated = false) { if (!automated)
    UmrahCore_Bridge.require('umrah.procurement', 'add'); const p = UmrahCore_Ops.program(o.programId); if (!p)
    throw new Error('اختر البرنامج'); if (!o.supplierId)
    throw new Error('اختر المورد'); const total = UmrahCore_N(o.total); if (total <= 0)
    throw new Error('قيمة الالتزام غير صحيحة'); if (!(UmrahCore_Bridge.rate(o.currency || p.currency, o.date || p.departureDate || UmrahCore_today()) > 0))
    throw new Error(`سعر صرف ${o.currency || p.currency} غير موجود`); const key = o.key || `commit:${o.sourceType || 'manual'}:${o.sourceId || UmrahCore_iid()}:${p.id}`; let c = this.findByKey(key); if (c)
    return c; const payload = { id: key, commitmentKey: key, programId: p.id, programNo: p.no, supplierId: o.supplierId, currency: o.currency || p.currency, total, qty: UmrahCore_N(o.qty) || 1, unitPrice: UmrahCore_N(o.unitPrice) || total, description: o.description || 'شراء خدمة حج/عمرة', sourceType: o.sourceType || 'manual', sourceId: o.sourceId || '', costCenterId: p.costCenterId || '', date: o.date || UmrahCore_today(), expectedDate: o.expectedDate || p.departureDate, taxId: o.taxId || 'TAX0' }; const res = UmrahCore_Bridge.emit('umrah.supplier.commitment.requested', payload, key); c = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), key, programId: p.id, supplierId: o.supplierId, currency: payload.currency, total, qty: payload.qty, unitPrice: payload.unitPrice, description: payload.description, sourceType: payload.sourceType, sourceId: payload.sourceId, sourceCostId: o.sourceCostId || '', status: 'committed', hostPOId: res?.purchaseOrderId || '', hostPONo: res?.purchaseOrderNo || '', hostInvoiceId: '', hostInvoiceNo: '', createdAt: UmrahCore_now() }; UmrahCore_DB.data.supplierCommitments.unshift(c); UmrahCore_Bridge.audit('commit', 'umrahSupplier', c.id, `${p.no} ${c.description}`); return c; },
    fromContract(kind, id, programId, overrideAmount = 0, automated = false) { const i = this.contractInfo(kind, id); if (!i)
    throw new Error('التعاقد غير موجود'); const linked = UmrahCore_Ops.scoped('programCosts').find(x => x.programId === programId && x.sourceContractKind === kind && x.sourceContractId === id && x.active !== false); if (linked)
    return this.fromCost(linked.id, null, overrideAmount, automated); return this.create({ programId, supplierId: i.supplierId, currency: i.currency, total: UmrahCore_N(overrideAmount) || i.total, description: i.description, sourceType: `${kind}Contract`, sourceId: id, expectedDate: i.expectedDate, key: `contract:${kind}:${id}:${programId}` }, automated); },
    fromCost(costId, booking = null, overrideAmount = 0, automated = false) { const x = UmrahCore_Ops.scoped('programCosts').find(v => v.id === costId && v.active !== false); if (!x)
    throw new Error('بند التكلفة غير موجود'); const p = UmrahCore_Ops.program(x.programId); if (!p)
    throw new Error('البرنامج غير موجود'); let qty = booking ? UmrahCore_N(booking.persons) : 1; if (booking && x.category === 'flight')
    qty = Math.max(0, UmrahCore_N(booking.persons) - UmrahCore_N(booking.infants)); const calc = x.mode === 'perPax' ? UmrahCore_N(x.amount) * qty : UmrahCore_N(x.amount), total = UmrahCore_N(overrideAmount) || calc, key = booking ? `booking-cost:${booking.id}:${x.id}` : `program-cost:${p.id}:${x.id}`; if (total <= 0)
    return null; return this.create({ programId: p.id, supplierId: x.supplierId, currency: x.currency, total, qty: x.mode === 'perPax' ? qty : 1, unitPrice: UmrahCore_N(x.amount), description: x.description, sourceType: booking ? 'bookingCost' : (x.sourceContractId ? `${x.sourceContractKind}Contract` : 'programCost'), sourceId: booking?.id || x.sourceContractId || x.id, sourceCostId: x.id, taxId: x.taxId || 'TAX0', expectedDate: p.departureDate, key }, automated); },
    cancelCommitments(list, reason = 'إلغاء التزام مورد', context: any = {}, automated = false) { if (!automated)
    UmrahCore_Bridge.require('umrah.procurement', 'delete'); for (const c of list) {
    const snap = this.status(c) || {};
    if (c.status === 'invoiced' || c.hostInvoiceId || snap.invoiceId || snap.invoiceNo)
        throw new Error(`يوجد فاتورة مورد مرتبطة بالخدمة «${c.description}». عالج فاتورة/رصيد المورد قبل الإلغاء.`);
    if (snap.hasExecution)
        throw new Error(`تم تسجيل تنفيذ/استلام فعلي على أمر الشراء ${snap.poNo || ''} للخدمة «${c.description}». اعكس/سوِّ التنفيذ مع المورد أولًا قبل إلغاء البرنامج أو الحجز.`);
    } for (const c of list) {
    const res = UmrahCore_Bridge.emit('umrah.supplier.commitment.cancelled', { ...context, commitmentId: c.id, commitmentKey: c.key, hostPOId: c.hostPOId, reason }, `supplier-commitment-cancel:${c.key}`);
    if(res?.status==='invoice-exists')throw new Error(res.message||`تعذر إلغاء التزام المورد ${c.description}`);if(res?.status==='deleted-draft'){c.cancelledHostPOId=c.hostPOId||res.purchaseOrderId||'';c.cancelledHostPONo=c.hostPONo||res.purchaseOrderNo||'';c.hostPOId='';c.hostPONo=''}
    c.status = 'cancelled';
    c.active = false;
    c.cancelReason = reason;
    c.cancelledAt = UmrahCore_now();
    UmrahCore_Bridge.audit('cancel', 'umrahSupplier', c.id, reason);
    } return list.length; },
    cancelBookingCommitments(bookingId, reason = 'إلغاء حجز حج/عمرة') { const list = UmrahCore_Ops.scoped('supplierCommitments').filter(c => c.status !== 'cancelled' && (c.key || '').startsWith(`booking-cost:${bookingId}:`)); return this.cancelCommitments(list, reason, { bookingId }, true); },
    cancelCostCommitments(costId, reason = 'إلغاء بند تكلفة', automated = false) { const list = UmrahCore_Ops.scoped('supplierCommitments').filter(c => c.status !== 'cancelled' && c.sourceCostId === costId); return this.cancelCommitments(list, reason, { costId }, automated); },
    cancelProgramCommitments(programId, reason = 'إلغاء برنامج حج/عمرة') { const list = UmrahCore_Ops.scoped('supplierCommitments').filter(c => c.status !== 'cancelled' && c.programId === programId); return this.cancelCommitments(list, reason, { programId }, true); },
    syncCost(x, strict = false) { if (!x || x.active === false || x.procurementPolicy === 'budgetOnly' || !x.supplierId)
    return []; const p = UmrahCore_Ops.program(x.programId); if (!p)
    return []; const out = []; try {
    if (x.procurementPolicy === 'fixedOnOpen' && ['open', 'salesClosed', 'operating', 'traveling', 'returned'].includes(p.status)) {
        let c = this.fromCost(x.id, null, 0, true);
        if (c && ((x.actualizationPolicy === 'onTraveling' && ['traveling', 'returned'].includes(p.status)) || (x.actualizationPolicy === 'onReturned' && p.status === 'returned')) && c.status !== 'invoiced')
            c = this.invoice(c.id, '', true);
        if (c)
            out.push(c);
    }
    else if (x.procurementPolicy === 'perConfirmedPax') {
        for (const b of UmrahCore_Ops.scoped('bookings').filter(b => b.programId === p.id && UmrahCore_Ops.activeBookingStatuses.has(b.status))) {
            const c = this.fromCost(x.id, b, 0, true);
            if (c)
                out.push(c);
        }
        if (x.actualizationPolicy === 'onVisaIssued')
            this.actualizeBookingCategoryForExisting(p.id, 'visa');
        if (x.actualizationPolicy === 'onTicketIssued')
            this.actualizeBookingCategoryForExisting(p.id, 'flight');
        if (x.actualizationPolicy === 'onPermitIssued')
            this.actualizeBookingCategoryForExisting(p.id, 'permit');
        if (x.actualizationPolicy === 'onCampAssigned')
            this.actualizeBookingCategoryForExisting(p.id, 'camp');
    }
    x.procurementSyncStatus = 'synced';
    x.procurementSyncError = '';
    x.procurementSyncAt = UmrahCore_now();
    }
    catch (e) {
    x.procurementSyncStatus = 'error';
    x.procurementSyncError = UmrahCore_S(e.message || e);
    x.procurementSyncAt = UmrahCore_now();
    UmrahCore_Bridge.audit('automation-warning', 'supplierCommitment', x.id, x.procurementSyncError);
    if (strict)
        throw e;
    } return out; },
    actualizeBookingCategoryForExisting(programId, category) { const out = []; for (const b of UmrahCore_Ops.scoped('bookings').filter(b => b.programId === programId && UmrahCore_Ops.activeBookingStatuses.has(b.status))) {
    const ts = UmrahCore_Ops.scoped('travelers').filter(t => t.bookingId === b.id && t.active !== false);
    const complete = category === 'visa' ? ts.length && ts.every(t => t.visaStatus === 'issued') : category === 'flight' ? ts.length && ts.every(t => UmrahCore_Ops.travelerFlightReady(t)) : category === 'permit' ? ts.length && ts.every(t => t.hajjPermitStatus === 'issued') : category === 'camp' ? ts.length && ts.every(t => UmrahCore_S(t.campAssignment).trim()) : false;
    if (complete)
        out.push(...this.actualizeBookingCategory(b.id, category));
    } return out; },
    onBookingConfirmed(b) { for (const x of UmrahCore_DB.data.programCosts.filter(v => v.programId === b.programId && v.active !== false && v.procurementPolicy === 'perConfirmedPax' && v.supplierId && !['onVisaIssued', 'onTicketIssued', 'onPermitIssued', 'onCampAssigned'].includes(v.actualizationPolicy)))
    this.syncCost(x); },
    onProgramOpen(p) { for (const x of UmrahCore_DB.data.programCosts.filter(v => v.programId === p.id && v.active !== false && v.procurementPolicy === 'fixedOnOpen' && v.supplierId))
    this.syncCost(x); },
    commitmentsForCost(costId, bookingId = '') { const x = UmrahCore_Ops.scoped('programCosts').find(v => v.id === costId); if (!x)
    return []; const key = bookingId ? `booking-cost:${bookingId}:${x.id}` : `program-cost:${x.programId}:${x.id}`; return UmrahCore_Ops.scoped('supplierCommitments').filter(c => c.key === key && c.status !== 'cancelled'); },
    actualizeBookingItem(bookingId, category, travelerId) { const b = UmrahCore_Ops.booking(bookingId), t = UmrahCore_Ops.traveler(travelerId); if (!b || !t)
    return []; b.costActualization = b.costActualization || {}; b.costActualization[category] = b.costActualization[category] || {}; if (!b.costActualization[category][travelerId])
    b.costActualization[category][travelerId] = { travelerId, at: UmrahCore_now(), status: 'recognized-operationally' }; const expected = { visa: 'onVisaIssued', flight: 'onTicketIssued', permit: 'onPermitIssued', camp: 'onCampAssigned' }[category] || '', eligible = UmrahCore_Ops.scoped('travelers').filter(v => v.bookingId === b.id && v.active !== false), complete = category === 'visa' ? eligible.every(v => v.visaStatus === 'issued') : category === 'flight' ? eligible.every(v => UmrahCore_Ops.travelerFlightReady(v)) : category === 'permit' ? eligible.every(v => v.hajjPermitStatus === 'issued') : category === 'camp' ? eligible.every(v => UmrahCore_S(v.campAssignment).trim()) : false, out = []; if (!complete)
    return out; for (const x of UmrahCore_Ops.scoped('programCosts').filter(v => v.programId === b.programId && v.category === category && v.active !== false && v.procurementPolicy === 'perConfirmedPax' && v.supplierId && (!expected || v.actualizationPolicy === expected))) {
    let c = this.commitmentsForCost(x.id, b.id)[0] || this.fromCost(x.id, b, 0, true);
    if (!c)
        continue;
    c.travelerIds = eligible.map(v => v.id);
    c.itemTrace = eligible.map(v => ({ travelerId: v.id, name: v.nameAr || v.no, at: b.costActualization?.[category]?.[v.id]?.at || UmrahCore_now() }));
    if (c.status !== 'invoiced')
        c = this.invoice(c.id, '', true);
    if (c)
        out.push(c);
    } return out; },
    actualizeBookingCategory(bookingId, category) { const b = UmrahCore_Ops.booking(bookingId); if (!b)
    return []; const out = []; for (const x of UmrahCore_Ops.scoped('programCosts').filter(v => v.programId === b.programId && v.category === category && v.active !== false && v.procurementPolicy === 'perConfirmedPax' && v.supplierId && !['onVisaIssued', 'onTicketIssued', 'onPermitIssued', 'onCampAssigned'].includes(v.actualizationPolicy))) {
    let c = this.commitmentsForCost(x.id, b.id)[0] || this.fromCost(x.id, b, 0, true);
    if (c && c.status !== 'invoiced' && x.actualizationPolicy !== 'manual')
        c = this.invoice(c.id, '', true);
    if (c)
        out.push(c);
    } return out; },
    actualizeProgram(category, programId, policy) { const p = UmrahCore_Ops.program(programId); if (!p)
    return []; const out = []; for (const x of UmrahCore_Ops.scoped('programCosts').filter(v => v.programId === p.id && v.category === category && v.active !== false && v.procurementPolicy === 'fixedOnOpen' && v.supplierId && (!policy || v.actualizationPolicy === policy))) {
    let c = this.commitmentsForCost(x.id)[0] || this.fromCost(x.id, null, 0, true);
    if (c && c.status !== 'invoiced')
        c = this.invoice(c.id, '', true);
    if (c)
        out.push(c);
    } return out; },
    onVisaProgress(item) { if (!item || item.status !== 'issued' || !item.travelerId)
    return []; const r = this.actualizeBookingItem(item.bookingId, 'visa', item.travelerId); if (r.length)
    UmrahCore_Bridge.audit('auto-actualize', 'visa', item.travelerId, 'تم تتبع تكلفة التأشيرة للمسافر وتجميع مستند المورد على مستوى الحجز'); return r; },
    onTicketProgress(ticket) { if (!ticket || !['issued', 'reissued'].includes(ticket.status) || !ticket.travelerId)
    return []; const r = this.actualizeBookingItem(ticket.bookingId, 'flight', ticket.travelerId); if (r.length)
    UmrahCore_Bridge.audit('auto-actualize', 'flight', ticket.travelerId, 'تم تتبع تكلفة الطيران للمسافر وتجميع مستند المورد على مستوى الحجز'); return r; },
    onHajjServiceProgress(t, category) { if (!t || !['permit', 'camp'].includes(category))
    return []; const r = this.actualizeBookingItem(t.bookingId, category, t.id); if (r.length)
    UmrahCore_Bridge.audit('auto-actualize', category, t.id, category === 'permit' ? 'تم تتبع تكلفة التصريح/نسك وتجميع مستند المورد على مستوى الحجز' : 'تم تتبع تكلفة المخيم/المشاعر وتجميع مستند المورد على مستوى الحجز'); return r; },
    onProgramTraveling(p) { return this.actualizeProgram('flight', p.id, 'onTraveling'); }, onProgramReturned(p) { return [...this.actualizeProgram('hotel', p.id, 'onReturned'), ...this.actualizeProgram('transport', p.id, 'onReturned')]; },
    invoice(id, externalNo = '', automated = false) { if (!automated)
    UmrahCore_Bridge.require('umrah.procurement', 'approve'); const c = UmrahCore_Ops.scoped('supplierCommitments').find(x => x.id === id); if (!c)
    throw new Error('الالتزام غير موجود'); if (c.status === 'invoiced')
    return c; const res = UmrahCore_Bridge.emit('umrah.supplier.invoice.approved', { id: c.id, commitmentId: c.id, commitmentKey: c.key, hostPOId: c.hostPOId, programId: c.programId, supplierId: c.supplierId, currency: c.currency, total: c.total, externalNo: externalNo || '', description: c.description }, `supplier-invoice:${c.key}`); c.status = 'invoiced'; c.hostInvoiceId = res?.invoiceId || ''; c.hostInvoiceNo = res?.invoiceNo || ''; c.invoicedAt = UmrahCore_now(); UmrahCore_Bridge.audit('invoice', 'umrahSupplier', c.id, c.hostInvoiceNo || c.description); return c; },
    status(c) { const s = UmrahCore_Bridge.procurementSnapshot(c.hostPOId || c.hostInvoiceId); return s || { poNo: c.hostPONo, invoiceNo: c.hostInvoiceNo, status: c.status }; }
};
__set_UmrahCore_Procurement(UmrahCore_Procurement);
export { UmrahCore_Procurement };
