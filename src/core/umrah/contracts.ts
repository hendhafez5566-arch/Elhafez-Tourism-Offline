import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_deep, UmrahCore_esc, UmrahCore_iid, UmrahCore_now, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_today, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Bridge, UmrahCore_Cost, UmrahCore_DB } from './data';
import { UmrahCore_Inventory } from './contracts-inventory';
import { UmrahCore_Ops, UmrahCore_Procurement, UmrahCore_ProgramWizard, UmrahCore_UI } from '../late-bindings';
import { __set_UmrahCore_ContractCenter } from '../late-bindings';
const UmrahCore_ContractCenter: any = {
    rawArr(kind) { return kind === 'hotel' ? UmrahCore_DB.data.hotelContracts : kind === 'flight' ? UmrahCore_DB.data.flightBlocks : kind === 'visa' ? UmrahCore_DB.data.visaContracts : kind === 'service' ? UmrahCore_DB.data.serviceContracts : UmrahCore_DB.data.transportContracts; },
    arr(kind) { return (this.rawArr(kind) || []).filter(x => UmrahCore_Bridge.branchMatch(x)); },
    get(kind, id) { return this.arr(kind).find(x => x.id === id); }, kindLabel(kind) { return { hotel: 'فندق', flight: 'طيران', transport: 'نقل', visa: 'تأشيرات', service: 'خدمة تعاقدية' }[kind] || kind; },
    statusLabel(s) { return { draft: 'مسودة', negotiating: 'قيد التفاوض', confirmed: 'مؤكد', active: 'فعال', expired: 'منتهي', cancelled: 'ملغي', superseded: 'مستبدل بملحق' }[s] || s || '-'; }, statusTone(s) { return { draft: 'gray', negotiating: 'orange', confirmed: 'blue', active: 'green', expired: 'gray', cancelled: 'red', superseded: 'gray' }[s] || 'gray'; },
    endDate(kind, c) { return kind === 'flight' ? (c.returnDateTime || c.outDateTime || '').slice(0, 10) : c.to || ''; }, startDate(kind, c) { return kind === 'flight' ? (c.outDateTime || '').slice(0, 10) : c.from || ''; },
    effectiveStatus(kind, c) { if (!c)
    return 'cancelled'; if (c.status === 'cancelled')
    return 'cancelled'; const end = this.endDate(kind, c), start = this.startDate(kind, c), t = UmrahCore_today(); if (end && end < t)
    return 'expired'; if (['confirmed', 'active'].includes(c.status) && (!start || start <= t) && (!end || end >= t))
    return 'active'; return c.status || 'draft'; },
    usable(kind, c) { return ['confirmed', 'active'].includes(this.effectiveStatus(kind, c)); },
    nextNo(kind) { const p = { hotel: 'HC', flight: 'FB', transport: 'TC', visa: 'VC', service: 'SC' }[kind] || 'CT', year = UmrahCore_today().slice(0, 4), arr = this.arr(kind), mx = arr.reduce((m, x) => Math.max(m, UmrahCore_N(UmrahCore_S(x.contractNo).match(/(\d+)$/)?.[1])), 0); return `${p}-${year}-${String(mx + 1).padStart(4, '0')}`; },
    normalizeMeta(kind, o, old: any = {}) { return { contractNo: old.contractNo || o.contractNo || this.nextNo(kind), supplierRef: UmrahCore_S(o.supplierRef || old.supplierRef).trim(), status: o.status || old.status || 'draft', contactName: UmrahCore_S(o.contactName || old.contactName).trim(), contactPhone: UmrahCore_S(o.contactPhone || old.contactPhone).trim(), signedDate: o.signedDate || old.signedDate || UmrahCore_today(), freeCancelUntil: o.freeCancelUntil || old.freeCancelUntil || '', releaseDeadline: o.releaseDeadline || old.releaseDeadline || '', ...UmrahCore_Inventory.normalizeRules(o, old), paymentSchedule: Array.isArray(o.paymentSchedule) ? UmrahCore_deep(o.paymentSchedule) : UmrahCore_deep(old.paymentSchedule || []), advancePct: Math.max(0, Math.min(100, UmrahCore_N(o.advancePct ?? old.advancePct))), advanceDue: o.advanceDue || old.advanceDue || '', balanceDue: o.balanceDue || old.balanceDue || '', paymentTerms: UmrahCore_S(o.paymentTerms || old.paymentTerms).trim(), documentRef: UmrahCore_S(o.documentRef || old.documentRef).trim(), notes: UmrahCore_S(o.notes || old.notes).trim() }; },
    activeReservations(kind, id, excludeReservationId = '', from = '', to = '') { const programRows=UmrahCore_DB.data.contractReservations.filter(r => { const p = UmrahCore_Ops.program(r.programId); if (!UmrahCore_Bridge.branchMatch(r) || r.kind !== kind || r.contractId !== id || r.active === false || r.id === excludeReservationId || !p || p.status === 'cancelled')
    return false; if (from && to && r.from && r.to)
    return r.from < to && r.to > from; return true; }); return [...programRows,...UmrahCore_Inventory.directReservations(kind,id,excludeReservationId,from,to)]; },
    reservation(kind, id, programId, segmentId = '') { return UmrahCore_DB.data.contractReservations.find(r => UmrahCore_Bridge.branchMatch(r) && r.kind === kind && r.contractId === id && r.programId === programId && (!segmentId || r.segmentId === segmentId) && r.active !== false); },
    peakReserved(kind, id, field, excludeReservationId = '', from = '', to = '') { const c = this.get(kind, id), rs = this.activeReservations(kind, id, excludeReservationId, from, to); if (!rs.length)
    return 0; if (kind === 'flight' || kind === 'visa')
    return rs.reduce((z, r) => z + UmrahCore_N(r.allocation?.[field]), 0); const start = from || this.startDate(kind, c) || UmrahCore_today(), end = to || UmrahCore_dateAdd(this.endDate(kind, c) || start, 1); if (!start || !end || end <= start)
    return rs.reduce((z, r) => z + UmrahCore_N(field === 'vehicles' ? r.allocation?.vehicles : r.allocation?.rooms?.[field]), 0); let peak = 0; for (let d = start; d < end; d = UmrahCore_dateAdd(d, 1)) {
    let n = 0;
    for (const r of rs)
        if ((!r.from || r.from <= d) && (!r.to || r.to > d))
            n += UmrahCore_N(field === 'vehicles' ? r.allocation?.vehicles : r.allocation?.rooms?.[field]);
    peak = Math.max(peak, n);
    } return peak; },
    hotelStats(id, type, excludeReservationId = '', from = '', to = '') { return UmrahCore_Inventory.hotelRange(id, type, from, to, excludeReservationId); },
    flightStats(id, excludeReservationId = '') { const c = this.get('flight', id), total = UmrahCore_N(c?.seats), reserved = this.activeReservations('flight', id, excludeReservationId).reduce((z,r)=>z+UmrahCore_N(r.allocation?.seats),0), used = UmrahCore_Inventory.flightSold(id), blocked = c ? (UmrahCore_Inventory.released(c, this.startDate('flight', c)) || !!UmrahCore_Inventory.stopSaleOverlap(c, this.startDate('flight', c), this.endDate('flight', c))) : false; return { total, reserved, used, available: blocked ? 0 : Math.max(0, total - reserved), released: blocked ? Math.max(0,total-reserved) : 0 }; },
    transportStats(id, excludeReservationId = '', from = '', to = '') { const c=this.get('transport',id), totalVehicles=UmrahCore_N(c?.vehicles), reservedVehicles=this.peakReserved('transport',id,'vehicles',excludeReservationId,from,to), cap=UmrahCore_N(c?.capacityPerVehicle)||UmrahCore_vehicleCaps[c?.vehicleType]||0, totalCapacity=totalVehicles*cap, reservedCapacity=reservedVehicles*cap, used=UmrahCore_Inventory.transportSold(id,from,to), blocked=c ? (UmrahCore_Inventory.released(c, from||c.from||UmrahCore_today()) || !!UmrahCore_Inventory.stopSaleOverlap(c, from||c.from||UmrahCore_today(), to||c.to||from||c.from||UmrahCore_today())) : false; return { totalVehicles, reservedVehicles, availableVehicles: blocked?0:Math.max(0,totalVehicles-reservedVehicles), capacityPerVehicle:cap,totalCapacity,reservedCapacity,used,availableCapacity:blocked?0:Math.max(0,totalCapacity-reservedCapacity),released:blocked?Math.max(0,totalCapacity-reservedCapacity):0 }; },
    visaStats(id, excludeReservationId = '', from = '', to = '') { const c=this.get('visa',id), total=UmrahCore_N(c?.quota), reserved=this.activeReservations('visa',id,excludeReservationId).reduce((z,r)=>z+UmrahCore_N(r.allocation?.visas),0), v=UmrahCore_Inventory.visaUsed(id), blocked=!!(c&&from&&(UmrahCore_Inventory.released(c,from)||UmrahCore_Inventory.stopSaleOverlap(c,from,to||from))); return { total,reserved,used:v.issued,inProcess:v.inProcess,available:blocked?0:Math.max(0,total-reserved),released:blocked?Math.max(0,total-reserved):0 }; },
    serviceStats(id, excludeReservationId = '', from = '', to = '') { return UmrahCore_Inventory.serviceStats(id, excludeReservationId, from, to); },
    contractTotal(kind, c) { if (!c)
    return 0; if (kind === 'hotel') return UmrahCore_Inventory.hotelContractTotal(c); if (kind === 'flight')
    return UmrahCore_N(c.seats) * UmrahCore_N(c.costPerSeat); if (kind === 'visa') return UmrahCore_N(c.quota) * UmrahCore_N(c.costPerVisa); if (kind === 'service') return UmrahCore_N(c.quota) * UmrahCore_N(c.costPerUnit); return UmrahCore_N(c.cost); },
    paymentSource(kind) { return `umrah-${kind}-contract-payment`; },
    paymentSchedule(kind, c) { const total = this.contractTotal(kind, c), rows = []; if (Array.isArray(c?.paymentSchedule) && c.paymentSchedule.length) {
    for (const r of c.paymentSchedule) {
        const mode = r.mode === 'fixed' ? 'fixed' : 'percent', value = Math.max(0, UmrahCore_N(r.value)), amount = mode === 'fixed' ? value : total * value / 100;
        if (amount > 0 && r.due)
            rows.push({ id: r.id || UmrahCore_iid(), label: UmrahCore_S(r.label || 'دفعة تعاقدية').trim() || 'دفعة تعاقدية', mode, value, percent: mode === 'percent' ? value : 0, due: r.due, amount });
    }
    return rows;
    } const pct = Math.max(0, Math.min(100, UmrahCore_N(c?.advancePct))); if (pct > 0 && c?.advanceDue)
    rows.push({ id: 'legacy-advance', label: 'دفعة مقدمة', mode: 'percent', value: pct, percent: pct, due: c.advanceDue, amount: total * pct / 100 }); if (pct < 100 && c?.balanceDue)
    rows.push({ id: 'legacy-balance', label: pct ? 'الرصيد' : 'القيمة التعاقدية', mode: 'percent', value: 100 - pct, percent: 100 - pct, due: c.balanceDue, amount: total * (100 - pct) / 100 }); return rows.filter(x => x.amount > 0); },
    paymentCoverage(kind, c) { const fin = this.financial(kind, c.id), src = UmrahCore_Bridge.contractPayments(this.paymentSource(kind), c.id), adv = src.filter(x => !(x.allocations || []).length).reduce((z, x) => z + UmrahCore_N(x.amount), 0); return Math.max(0, UmrahCore_N(fin.paid) + adv); },
    scheduleState(kind, c, row) { const schedule = this.paymentSchedule(kind, c), idx = schedule.findIndex(x => x.id === row.id), before = schedule.slice(0, Math.max(0, idx)).reduce((z, x) => z + UmrahCore_N(x.amount), 0), coverage = this.paymentCoverage(kind, c), paid = Math.min(UmrahCore_N(row.amount), Math.max(0, coverage - before)); return { paid, outstanding: Math.max(0, UmrahCore_N(row.amount) - paid), status: paid + 0.01 >= UmrahCore_N(row.amount) ? 'paid' : paid > 0 ? 'partial' : 'due' }; },
    formData(fd) { const o = Object.fromEntries(fd), ids = fd.getAll('payId'), labels = fd.getAll('payLabel'), modes = fd.getAll('payMode'), values = fd.getAll('payValue'), dues = fd.getAll('payDue'), rows = []; for (let i = 0; i < Math.max(labels.length, values.length, dues.length); i++) {
    const label = UmrahCore_S(labels[i]).trim(), value = UmrahCore_N(values[i]), due = UmrahCore_S(dues[i]).trim(), mode = modes[i] === 'fixed' ? 'fixed' : 'percent';
    if (!label && !value && !due)
        continue;
    if (!label || !(value > 0) || !due)
        throw new Error(`أكمل اسم وقيمة وتاريخ الدفعة رقم ${i + 1}`);
    if (mode === 'percent' && value > 100)
        throw new Error(`نسبة الدفعة رقم ${i + 1} لا يمكن أن تتجاوز 100%`);
    rows.push({ id: UmrahCore_S(ids[i]).trim() || UmrahCore_iid(), label, mode, value, due });
    } o.paymentSchedule = rows;
    const stopIds=fd.getAll('stopId'),stopFrom=fd.getAll('stopFrom'),stopTo=fd.getAll('stopTo'),stopReason=fd.getAll('stopReason'); o.stopSales=[]; for(let i=0;i<Math.max(stopFrom.length,stopTo.length);i++){const from=UmrahCore_S(stopFrom[i]).trim(),to=UmrahCore_S(stopTo[i]).trim(),reason=UmrahCore_S(stopReason[i]).trim(); if(!from&&!to&&!reason) continue; if(!from||!to) throw new Error(`أكمل فترة إيقاف البيع رقم ${i+1}`); if(to<from) throw new Error(`نهاية إيقاف البيع رقم ${i+1} قبل بدايته`); o.stopSales.push({id:UmrahCore_S(stopIds[i]).trim()||UmrahCore_iid(),from,to,reason});}
    const invIds=fd.getAll('invId'),invFrom=fd.getAll('invFrom'),invTo=fd.getAll('invTo'),invType=fd.getAll('invRoomType'),invQty=fd.getAll('invQty'),invRate=fd.getAll('invRate'); o.inventoryPeriods=[]; for(let i=0;i<Math.max(invFrom.length,invTo.length,invType.length);i++){const from=UmrahCore_S(invFrom[i]).trim(),to=UmrahCore_S(invTo[i]).trim(),roomType=UmrahCore_S(invType[i]).trim(),qty=UmrahCore_N(invQty[i]),rate=UmrahCore_N(invRate[i]); if(!from&&!to&&!roomType&&!qty&&!rate) continue; if(!from||!to||!roomType) throw new Error(`أكمل فترة المخزون الموسمية رقم ${i+1}`); if(to<from) throw new Error(`نهاية فترة المخزون الموسمية رقم ${i+1} قبل بدايتها`); o.inventoryPeriods.push({id:UmrahCore_S(invIds[i]).trim()||UmrahCore_iid(),from,to,roomType,qty,rate});}
    for (const k of ['payId','payLabel','payMode','payValue','payDue','stopId','stopFrom','stopTo','stopReason','invId','invFrom','invTo','invRoomType','invQty','invRate']) delete o[k]; return o; },
    paymentRowsHtml(c: any = {}) { let rows = Array.isArray(c.paymentSchedule) ? UmrahCore_deep(c.paymentSchedule) : []; if (!rows.length && UmrahCore_N(c.advancePct) > 0 && c.advanceDue)
    rows.push({ id: 'legacy-advance', label: 'دفعة مقدمة', mode: 'percent', value: UmrahCore_N(c.advancePct), due: c.advanceDue }); if (!rows.length && c.balanceDue)
    rows.push({ id: 'legacy-balance', label: UmrahCore_N(c.advancePct) > 0 ? 'الرصيد' : 'القيمة التعاقدية', mode: 'percent', value: Math.max(0, 100 - UmrahCore_N(c.advancePct)), due: c.balanceDue }); const list = rows.length ? rows : [{ id: '', label: '', mode: 'percent', value: '', due: '' }]; return `<div class="contract-payment-rows">${list.map(r => `<div class="contract-payment-row form-grid four"><input type="hidden" name="payId" value="${UmrahCore_esc(r.id || '')}"><div class="field"><label>اسم الدفعة</label><input name="payLabel" value="${UmrahCore_esc(r.label || '')}" placeholder="مثال: عربون عند التوقيع"></div><div class="field"><label>طريقة القيمة</label><select name="payMode"><option value="percent" ${r.mode !== 'fixed' ? 'selected' : ''}>نسبة % من العقد</option><option value="fixed" ${r.mode === 'fixed' ? 'selected' : ''}>مبلغ ثابت</option></select></div><div class="field"><label>النسبة / المبلغ</label><input name="payValue" type="number" min="0" step="0.01" value="${UmrahCore_N(r.value) || ''}"></div><div class="field"><label>تاريخ الاستحقاق</label><input name="payDue" type="date" value="${r.due || ''}"></div></div>`).join('')}</div>`; },
    addPaymentRow() { const box = document.querySelector('#modalForm .contract-payment-rows'); if (!box)
    return; const d = document.createElement('div'); d.className = 'contract-payment-row form-grid four'; d.innerHTML = `<input type="hidden" name="payId" value=""><div class="field"><label>اسم الدفعة</label><input name="payLabel" placeholder="مثال: رصيد قبل الوصول"></div><div class="field"><label>طريقة القيمة</label><select name="payMode"><option value="percent">نسبة % من العقد</option><option value="fixed">مبلغ ثابت</option></select></div><div class="field"><label>النسبة / المبلغ</label><input name="payValue" type="number" min="0" step="0.01"></div><div class="field"><label>تاريخ الاستحقاق</label><input name="payDue" type="date"></div>`; box.appendChild(d); },
    preparePayment(kind, id, scheduleId) { const c = this.get(kind, id); if (!c)
    throw new Error('التعاقد غير موجود'); const row = this.paymentSchedule(kind, c).find(x => x.id === scheduleId); if (!row)
    throw new Error('دفعة العقد غير موجودة'); const st = this.scheduleState(kind, c, row); if (st.outstanding <= 0.01) {
    UmrahCore_UI.toast('هذه الدفعة مغطاة بالكامل');
    return;
    } const fin = this.financial(kind, id), candidates = fin.rows.map(r => ({ r, s: UmrahCore_Procurement.status(r) || {} })).filter(x => UmrahCore_N(x.s.remaining) > 0.01), hit = candidates.find(x => UmrahCore_N(x.s.remaining) + .01 >= st.outstanding) || candidates[0], invoiceId = hit?.s?.invoiceId || hit?.r?.hostInvoiceId || '', invoiceRemaining = hit ? UmrahCore_N(hit.s.remaining) : 0, amount = invoiceId ? Math.min(st.outstanding, invoiceRemaining) : st.outstanding, treasury = UmrahCore_Bridge.preferredTreasury(c.currency) || UmrahCore_Bridge.treasuries()[0]; if (!treasury)
    throw new Error('لا توجد خزنة/بنك نشط. أنشئ خزنة أولًا ثم أعد الضغط على التنبيه.'); const supplier = UmrahCore_Bridge.supplier(c.supplierId); UmrahCore_Bridge.openERPForm('payment', { title: `سداد ${row.label} — ${c.contractNo}`, subtitle: `${supplier?.name || 'المورد'} • ${this.name(kind, c)}`, formNote: invoiceId ? 'تم ربط السداد بفاتورة المورد المرتبطة بالعقد. راجع البيانات واضغط تأكيد فقط.' : 'لا توجد فاتورة مورد معتمدة لهذا الاستحقاق؛ سيُسجل المبلغ كدفعة مقدمة للمورد مرتبطة بالعقد حتى ورود الفاتورة.', submitLabel: 'تأكيد السداد', date: UmrahCore_today(), partyType: 'supplier', partyId: c.supplierId, treasuryId: treasury.id, amount, currency: c.currency, invoiceId, paymentMethod: treasury.type === 'bank' ? 'bank' : 'cash', note: `${row.label} — عقد ${c.contractNo} — ${this.name(kind, c)}`, forceSupplierAdvance: !invoiceId, sourceType: this.paymentSource(kind), sourceId: c.id, sourceScheduleId: row.id, sourceLabel: row.label }); },
    retryProcurement(kind, id) { const c = this.get(kind, id); if (!c)
    throw new Error('التعاقد غير موجود'); const costs = this.financial(kind, id).costs; let n = 0; for (const x of costs)
    n += UmrahCore_Procurement.syncCost(x, true).length; UmrahCore_DB.save(); UmrahCore_UI.render(); UmrahCore_UI.toast(n ? `تمت إعادة مزامنة ${n} التزام شراء` : 'لا توجد التزامات جديدة مطلوبة'); },
    allocate(kind, id, o) {
    UmrahCore_Bridge.require('umrah.contracts', 'edit');
    UmrahCore_Bridge.require('umrah.programs', 'edit');
    return UmrahCore_DB.atomic('contractAllocate', () => {
        const c = this.get(kind, id), p = UmrahCore_Ops.program(o.programId);
        if (!c || !p)
            throw new Error('العقد أو البرنامج غير موجود');
        if (!this.usable(kind, c))
            throw new Error('العقد غير مؤكد/فعال');
        const allocFrom = kind === 'flight' ? this.startDate(kind,c) : (o.from || p.departureDate), allocTo = kind === 'flight' ? this.endDate(kind,c) : (o.to || p.returnDate);
        UmrahCore_Inventory.assertOpenForAllocation(c, allocFrom, allocTo);
        if (['traveling', 'returned', 'closed', 'cancelled'].includes(p.status))
            throw new Error('لا يمكن إضافة مخزون جديد بعد بدء السفر أو إقفال البرنامج');
        if (kind === 'flight' && ((c.outDateTime || '').slice(0, 10) !== p.departureDate || (c.returnDateTime || '').slice(0, 10) !== p.returnDate))
            throw new Error('تواريخ بلوك الطيران لا تطابق تاريخ ذهاب وعودة البرنامج');
        let cost = null, resv = null, segmentIds = [];
        if (kind === 'hotel') {
            const from = o.from || p.departureDate, to = o.to || UmrahCore_dateAdd(p.returnDate, 1);
            if (from < p.departureDate || to > UmrahCore_dateAdd(p.returnDate, 1))
                throw new Error('فترة الإقامة يجب أن تقع داخل تواريخ سفر البرنامج');
            const rooms = o.autoAllocation === 'yes' ? this.suggestHotelAllocation(id, UmrahCore_N(p.capacity), from, to) : Object.fromEntries(Object.keys(UmrahCore_roomCap).map(t => [t, UmrahCore_N(o[`${t}Qty`])]));
            if (!(from && to && to > from))
                throw new Error('فترة الإقامة غير صحيحة');
            if (!Object.values(rooms).some(v => UmrahCore_N(v) > 0))
                throw new Error('لا يوجد مخزون غرف كافٍ للتخصيص المطلوب');
            this.assertHotel(id, rooms, from, to);
            const beds = Object.entries(rooms).reduce((z, [t, n]) => z + UmrahCore_N(n) * (UmrahCore_roomCap[t] || 0), 0);
            if (['open', 'salesClosed', 'operating'].includes(p.status) && beds < UmrahCore_N(p.capacity))
                throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ تخصيص الفندق يغطي ${beds} سريرًا فقط`);
            const nights = UmrahCore_daysBetween(from, to), seg = UmrahCore_Ops.addSegment({ programId: p.id, type: 'hotel', title: `إقامة — ${c.hotelName}`, start: from, end: UmrahCore_dateAdd(to, -1), nights, sequence: UmrahCore_Ops.segments(p.id).length + 1, supplierId: c.supplierId, contractId: c.id, city: c.city, inventory: rooms }, true);
            segmentIds = [seg.id];
            resv = this.reserve('hotel', id, p.id, { rooms }, seg.id, from, to, true);
            resv.segmentIds = segmentIds;
            const amount = UmrahCore_Inventory.hotelAllocationCost(c, rooms, from, to);
            cost = UmrahCore_Cost.add({ programId: p.id, category: 'hotel', description: `إقامة ${c.hotelName} — ${from} إلى ${to}`, amount, currency: c.currency, mode: 'fixed', supplierId: c.supplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onReturned', sourceContractKind: 'hotel', sourceContractId: c.id, sourceReservationId: resv.id, sourceSegmentId: seg.id }, true);
        }
        else if (kind === 'flight') {
            if (this.activeReservations('flight', id).some(r => r.programId === p.id))
                throw new Error('بلوك الطيران مخصص بالفعل لهذا البرنامج');
            const seats = Math.max(1, o.autoAllocation === 'yes' ? UmrahCore_N(p.capacity) : UmrahCore_N(o.seats));
            this.assertFlight(id, seats);
            if (['open', 'salesClosed', 'operating'].includes(p.status) && seats < UmrahCore_N(p.capacity))
                throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ لا يمكن إضافة بلوك أقل من سعة البرنامج`);
            const out = UmrahCore_Ops.addSegment({ programId: p.id, type: 'flight', title: `ذهاب ${c.airline} ${c.outFlight}`, start: c.outDateTime.slice(0, 10), end: c.outDateTime.slice(0, 10), sequence: UmrahCore_Ops.segments(p.id).length + 1, supplierId: c.supplierId, contractId: c.id, route: `${c.outFrom} → ${c.outTo}`, details: c.outDateTime, seats }, true), ret = UmrahCore_Ops.addSegment({ programId: p.id, type: 'flight', title: `عودة ${c.airline} ${c.returnFlight}`, start: c.returnDateTime.slice(0, 10), end: c.returnDateTime.slice(0, 10), sequence: UmrahCore_Ops.segments(p.id).length + 1, supplierId: c.supplierId, contractId: c.id, route: `${c.returnFrom} → ${c.returnTo}`, details: c.returnDateTime, seats }, true);
            segmentIds = [out.id, ret.id];
            resv = this.reserve('flight', id, p.id, { seats }, out.id, '', '', true);
            resv.segmentIds = segmentIds;
            cost = UmrahCore_Cost.add({ programId: p.id, category: 'flight', description: `بلوك طيران ${c.name}`, amount: seats * UmrahCore_N(c.costPerSeat), currency: c.currency, mode: 'fixed', supplierId: c.supplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onTraveling', sourceContractKind: 'flight', sourceContractId: c.id, sourceReservationId: resv.id, sourceSegmentId: out.id }, true);
        }
        else if (kind === 'visa') {
            if (this.activeReservations('visa', id).some(r => r.programId === p.id))
                throw new Error('اتفاقية التأشيرات مخصصة بالفعل لهذا البرنامج');
            if (c.programType && c.programType !== 'all' && c.programType !== p.programType)
                throw new Error('نوع البرنامج لا يتوافق مع اتفاقية التأشيرات');
            if ((c.from && c.from > p.departureDate) || (c.to && c.to < p.returnDate))
                throw new Error('اتفاقية التأشيرات لا تغطي كامل فترة البرنامج');
            const visas = Math.max(1, o.autoAllocation === 'yes' ? UmrahCore_N(p.capacity) : UmrahCore_N(o.visas));
            this.assertVisa(id, visas, '', p.departureDate, UmrahCore_dateAdd(p.returnDate,1));
            if (['open', 'salesClosed', 'operating'].includes(p.status) && visas < UmrahCore_N(p.capacity))
                throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ لا يمكن تخصيص حصة تأشيرات أقل من سعة البرنامج`);
            const seg = UmrahCore_Ops.addSegment({ programId: p.id, type: 'visa', title: c.serviceName || 'التأشيرات', start: p.departureDate, end: p.departureDate, sequence: UmrahCore_Ops.segments(p.id).length + 1, supplierId: c.supplierId, contractId: c.id, deadline: UmrahCore_dateAdd(p.departureDate, -Math.max(1, UmrahCore_N(c.processingDays) || 14)) }, true);
            segmentIds = [seg.id];
            resv = this.reserve('visa', id, p.id, { visas }, seg.id, p.departureDate, UmrahCore_dateAdd(p.returnDate,1), true);
            resv.segmentIds = segmentIds;
            cost = UmrahCore_Cost.add({ programId: p.id, category: 'visa', description: `${c.serviceName} لكل مسافر مؤكد`, amount: UmrahCore_N(c.costPerVisa), currency: c.currency, mode: 'perPax', supplierId: c.supplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onVisaIssued', sourceContractKind: 'visa', sourceContractId: c.id, sourceReservationId: resv.id, sourceSegmentId: seg.id }, true);
        }
        else if (kind === 'service') {
            if (this.activeReservations('service', id).some(r => r.programId === p.id)) throw new Error('الخدمة التعاقدية مخصصة بالفعل لهذا البرنامج');
            if (c.programType && c.programType !== 'all' && c.programType !== p.programType) throw new Error('نوع البرنامج لا يتوافق مع الخدمة التعاقدية');
            const from=o.from||p.departureDate,to=o.to||p.returnDate; if((c.from&&c.from>from)||(c.to&&c.to<to)) throw new Error('فترة عقد الخدمة لا تغطي البرنامج');
            const units=Math.max(1,o.autoAllocation==='yes'?(c.unit==='pax'?UmrahCore_N(p.capacity):1):UmrahCore_N(o.units)); this.assertService(id,units,'',from,UmrahCore_dateAdd(to,1));
            if(c.unit==='pax'&&['open','salesClosed','operating'].includes(p.status)&&units<UmrahCore_N(p.capacity)) throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ تخصيص الخدمة يغطي ${units} فرد فقط`);
            const seg=UmrahCore_Ops.addSegment({programId:p.id,type:c.serviceCategory||'service',title:c.serviceName,start:from,end:to,sequence:UmrahCore_Ops.segments(p.id).length+1,supplierId:c.supplierId,contractId:c.id,details:`${units} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}`},true); segmentIds=[seg.id]; resv=this.reserve('service',id,p.id,{units},seg.id,from,UmrahCore_dateAdd(to,1),true);resv.segmentIds=segmentIds;
            const category={camp:'camp',permit:'permit',meal:'meal',guide:'supervision'}[c.serviceCategory]||'other',perPax=c.unit==='pax'; cost=UmrahCore_Cost.add({programId:p.id,category,description:`${c.serviceName} — ${units} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}`,amount:perPax?UmrahCore_N(c.costPerUnit):UmrahCore_N(c.costPerUnit)*units,currency:c.currency,mode:perPax?'perPax':'fixed',supplierId:c.supplierId,procurementPolicy:perPax?'perConfirmedPax':'fixedOnOpen',actualizationPolicy:c.serviceCategory==='camp'?'onCampAssigned':c.serviceCategory==='permit'?'onPermitIssued':'manual',sourceContractKind:'service',sourceContractId:c.id,sourceReservationId:resv.id,sourceSegmentId:seg.id},true);
        }
        else {
            const from = o.from || p.departureDate, to = o.to || p.returnDate;
            if (from < p.departureDate || to > p.returnDate || to < from)
                throw new Error('فترة النقل يجب أن تقع داخل تواريخ سفر البرنامج');
            const vehicles = Math.max(1, o.autoAllocation === 'yes' ? Math.ceil(UmrahCore_N(p.capacity) / Math.max(1, UmrahCore_N(c.capacityPerVehicle) || UmrahCore_vehicleCaps[c.vehicleType] || 1)) : UmrahCore_N(o.vehicles));
            this.assertTransport(id, vehicles, '', from, UmrahCore_dateAdd(to, 1));
            const cap = vehicles * (UmrahCore_N(c.capacityPerVehicle) || UmrahCore_vehicleCaps[c.vehicleType] || 0);
            if (['open', 'salesClosed', 'operating'].includes(p.status) && cap < UmrahCore_N(p.capacity))
                throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ تخصيص النقل يغطي ${cap} راكبًا فقط`);
            const seg = UmrahCore_Ops.addSegment({ programId: p.id, type: 'transport', title: `النقل — ${c.provider}`, start: from, end: to, sequence: UmrahCore_Ops.segments(p.id).length + 1, supplierId: c.supplierId, contractId: c.id, route: c.route, capacity: cap }, true);
            segmentIds = [seg.id];
            resv = this.reserve('transport', id, p.id, { vehicles, capacity: cap }, seg.id, from, UmrahCore_dateAdd(to, 1), true);
            resv.segmentIds = segmentIds;
            cost = UmrahCore_Cost.add({ programId: p.id, category: 'transport', description: `نقل — ${c.provider} — ${c.route || ''}`, amount: (UmrahCore_N(c.cost) / Math.max(1, UmrahCore_N(c.vehicles))) * vehicles, currency: c.currency, mode: 'fixed', supplierId: c.supplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onReturned', sourceContractKind: 'transport', sourceContractId: c.id, sourceReservationId: resv.id, sourceSegmentId: seg.id }, true);
        }
        if (cost)
            UmrahCore_Procurement.syncCost(cost);
        UmrahCore_Ops.syncAutoTasks(p.id);
        UmrahCore_Bridge.audit('allocate', `${kind}Contract`, id, `${p.no} • ${cost?.description || ''}`);
        return resv;
    }, { save: true, render: false });
    },
    unallocate(kind, reservationId, reason = 'تحرير تخصيص عقد') {
    UmrahCore_Bridge.require('umrah.contracts', 'edit');
    return UmrahCore_DB.atomic('contractUnallocate', () => {
        const r = UmrahCore_Ops.scoped('contractReservations').find(x => x.id === reservationId && x.kind === kind && x.active !== false), c = r && this.get(kind, r.contractId), p = r && UmrahCore_Ops.program(r.programId);
        if (!r || !c || !p)
            throw new Error('تخصيص العقد غير موجود');
        if (['traveling', 'returned', 'closed'].includes(p.status))
            throw new Error('لا يمكن تحرير مخزون عقد بعد بدء السفر أو إقفال البرنامج');
        if (!UmrahCore_S(reason).trim())
            throw new Error('سبب تحرير التخصيص مطلوب');
        const segmentIds = [...new Set([...(r.segmentIds || []), r.segmentId].filter(Boolean))];
        if (kind === 'hotel' && UmrahCore_DB.data.hotelRooms.some(x => segmentIds.includes(x.segmentId)))
            throw new Error('تم إنشاء/توزيع غرف على هذا التخصيص؛ ألغِ التوزيع التشغيلي أولًا');
        if (kind === 'flight' && UmrahCore_DB.data.tickets.some(x => segmentIds.includes(x.segmentId) && x.active !== false))
            throw new Error('توجد تذاكر/حجوزات طيران تشغيلية على هذا التخصيص؛ عالجها أولًا');
        if (kind === 'transport' && UmrahCore_DB.data.busRuns.some(x => segmentIds.includes(x.segmentId)))
            throw new Error('توجد رحلات نقل تشغيلية على هذا التخصيص؛ عالجها أولًا');
        let costs = UmrahCore_Ops.scoped('programCosts').filter(x => x.active !== false && x.sourceReservationId === r.id);
        if (!costs.length) {
            const candidates = UmrahCore_Ops.scoped('programCosts').filter(x => x.active !== false && x.programId === p.id && x.sourceContractKind === kind && x.sourceContractId === c.id);
            if (candidates.length === 1 && this.activeReservations(kind, c.id).filter(x => x.programId === p.id).length === 1)
                costs = candidates;
        }
        const commitments = costs.flatMap(x => UmrahCore_Procurement.commitmentsForCost(x.id));
        for (const com of commitments) {
            const snap = UmrahCore_Procurement.status(com) || {};
            if (com.status === 'invoiced' || com.hostInvoiceId || snap.invoiceId || snap.invoiceNo)
                throw new Error(`لا يمكن تحرير التخصيص لأن فاتورة مورد مرتبطة بـ «${com.description}». عالج فاتورة المورد/التسوية أولًا.`);
        }
        for (const x of costs) {
            UmrahCore_Procurement.cancelCostCommitments(x.id, reason, true);
            x.active = false;
            x.releasedAt = UmrahCore_now();
            x.releaseReason = reason;
        }
        r.active = false;
        r.releasedAt = UmrahCore_now();
        r.releaseReason = reason;
        UmrahCore_DB.data.programSegments = UmrahCore_DB.data.programSegments.filter(x => !segmentIds.includes(x.id));
        UmrahCore_Ops.refreshTaskDates(p);
        UmrahCore_Ops.syncAutoTasks(p.id);
        UmrahCore_Bridge.audit('release', `${kind}Contract`, c.id, `${p.no} • ${reason}`);
        return true;
    }, { save: true, render: false });
    },
    reserve(kind, id, programId, allocation, segmentId = '', from = '', to = '', automated = false) { if (!automated)
    UmrahCore_Bridge.require('umrah.contracts', 'edit'); const c = this.get(kind, id), p = UmrahCore_Ops.program(programId); if (!p)
    throw new Error('البرنامج غير موجود'); if (!c || !this.usable(kind, c))
    throw new Error(`التعاقد ${c?.contractNo || ''} غير متاح للاستخدام`); UmrahCore_Inventory.assertOpenForAllocation(c, from || this.startDate(kind,c) || p.departureDate, to || this.endDate(kind,c) || p.returnDate); let r = this.reservation(kind, id, programId, segmentId), exclude = r?.id || ''; if (kind === 'hotel') {
    for (const t of Object.keys(UmrahCore_roomCap)) {
        const q = UmrahCore_N(allocation?.rooms?.[t]), a = this.hotelStats(id, t, exclude, from, to).available;
        if (q > a)
            throw new Error(`المتاح من ${UmrahCore_roomLabel(t)} في ${c.hotelName} خلال الفترة المطلوبة هو ${a} غرفة فقط`);
    }
    }
    else if (kind === 'flight') {
    const q = UmrahCore_N(allocation?.seats), a = this.flightStats(id, exclude).available;
    if (q > a)
        throw new Error(`المتاح من مقاعد ${c.name} هو ${a} فقط`);
    }
    else if (kind === 'visa') {
    const q = UmrahCore_N(allocation?.visas), a = this.visaStats(id, exclude, from, to).available;
    if (q > a) throw new Error(`المتاح من ${c.serviceName} هو ${a} تأشيرة فقط`);
    }
    else if (kind === 'service') {
    const q=UmrahCore_N(allocation?.units),a=this.serviceStats(id,exclude,from,to).available; if(q>a) throw new Error(`المتاح من ${c.serviceName} هو ${a} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)} فقط`);
    }
    else {
    const q = UmrahCore_N(allocation?.vehicles), a = this.transportStats(id, exclude, from, to).availableVehicles;
    if (q > a)
        throw new Error(`المتاح من مركبات ${c.provider} خلال الفترة المطلوبة هو ${a} فقط`);
    } const ownedSegments = kind === 'flight' ? UmrahCore_Ops.segments(programId, 'flight').filter(s => s.contractId === id && s.active !== false).map(s => s.id) : [segmentId].filter(Boolean); if (r) {
    r.allocation = UmrahCore_deep(allocation);
    r.from = from || r.from || '';
    r.to = to || r.to || '';
    r.segmentIds = ownedSegments.length ? ownedSegments : (r.segmentIds || []);
    r.updatedAt = UmrahCore_now();
    return r;
    } r = { id: UmrahCore_iid(), branchId: p.branchId || UmrahCore_Bridge.branchId(), kind, contractId: id, programId, segmentId, segmentIds: ownedSegments, from: from || '', to: to || '', allocation: UmrahCore_deep(allocation), active: true, createdAt: UmrahCore_now() }; UmrahCore_DB.data.contractReservations.push(r); UmrahCore_Bridge.audit('reserve', `${kind}Contract`, id, `${p.no} • ${segmentId || 'تخصيص'}`); return r; },
    releaseProgram(programId) { for (const r of UmrahCore_DB.data.contractReservations.filter(x => x.programId === programId && x.active !== false)) {
    r.active = false;
    r.releasedAt = UmrahCore_now();
    } }, releaseSegment(segmentId) { for (const r of UmrahCore_DB.data.contractReservations.filter(x => x.active !== false && (x.segmentId === segmentId || (x.segmentIds || []).includes(segmentId)))) {
    r.active = false;
    r.releasedAt = UmrahCore_now();
    } },
    assertHotel(id, rooms, from, to, excludeReservationId = '') { const c=this.get('hotel',id); if(!c||!this.usable('hotel',c)) throw new Error('عقد الفندق غير فعال'); if(c.from>from||c.to<to) throw new Error(`عقد ${c.hotelName} لا يغطي كامل فترة الإقامة`); UmrahCore_Inventory.assertOpenForAllocation(c,from,to); for(const t of Object.keys(UmrahCore_roomCap)) { const q=UmrahCore_N(rooms?.[t]); if(!q) continue; for(let d=from;d<to;d=UmrahCore_dateAdd(d,1)){const terms=UmrahCore_Inventory.hotelTermsAt(c,t,d),reserved=UmrahCore_Inventory.hotelReservedOn(id,t,d,excludeReservationId); if(q>Math.max(0,UmrahCore_N(terms.qty)-reserved)) throw new Error(`مخزون ${UmrahCore_roomLabel(t)} غير كاف يوم ${d} في ${c.hotelName}`);} } return true; },
    assertFlight(id, seats, excludeReservationId = '') { const c = this.get('flight', id); if (!c || !this.usable('flight', c))
    throw new Error('بلوك الطيران غير فعال'); if (UmrahCore_N(seats) > this.flightStats(id, excludeReservationId).available)
    throw new Error(`مقاعد البلوك ${c.name} غير كافية`); return true; }, assertVisa(id, visas, excludeReservationId = '', from = '', to = '') { const c = this.get('visa', id); if (!c || !this.usable('visa', c))
    throw new Error('اتفاقية التأشيرات غير فعالة'); if(from) UmrahCore_Inventory.assertOpenForAllocation(c,from,to||from); if (UmrahCore_N(visas) > this.visaStats(id, excludeReservationId, from, to).available)
    throw new Error(`حصة التأشيرات المتاحة في ${c.serviceName} غير كافية`); return true; }, assertTransport(id, vehicles, excludeReservationId = '', from = '', to = '') { const c = this.get('transport', id); if (!c || !this.usable('transport', c))
    throw new Error('عقد النقل غير فعال'); if (c.from && from && c.from > from)
    throw new Error(`عقد ${c.provider} يبدأ ${c.from} ولا يغطي بداية الخدمة المطلوبة`); if (c.to && to && c.to < UmrahCore_dateAdd(to, -1))
    throw new Error(`عقد ${c.provider} ينتهي ${c.to} ولا يغطي نهاية الخدمة المطلوبة`); if (UmrahCore_N(vehicles) > this.transportStats(id, excludeReservationId, from, to).availableVehicles)
    throw new Error(`عدد المركبات المتاح في ${c.provider} غير كاف خلال الفترة المطلوبة`); return true; },
    assertService(id, units, excludeReservationId = '', from = '', to = '') { const c=this.get('service',id); if(!c||!this.usable('service',c)) throw new Error('عقد الخدمة غير فعال'); if(from) UmrahCore_Inventory.assertOpenForAllocation(c,from,to||from); if(UmrahCore_N(units)>this.serviceStats(id,excludeReservationId,from,to).available) throw new Error(`كمية ${c.serviceName} المتاحة غير كافية`); return true; },
    suggestHotelAllocation(id, capacity, from = '', to = '') { capacity = Math.max(1, UmrahCore_N(capacity)); const c = this.get('hotel', id), types = Object.keys(UmrahCore_roomCap).filter(t => this.hotelStats(id, t, '', from, to).available > 0 && UmrahCore_N(c?.rooms?.[t]?.rate) > 0), alloc = Object.fromEntries(Object.keys(UmrahCore_roomCap).map(t => [t, 0])); if (!types.length)
    return alloc; const totalBeds = types.reduce((z, t) => z + this.hotelStats(id, t, '', from, to).available * UmrahCore_roomCap[t], 0); if (totalBeds < capacity)
    return alloc; for (const t of types) {
    const a = this.hotelStats(id, t, '', from, to).available, targetBeds = capacity * (a * UmrahCore_roomCap[t]) / totalBeds;
    alloc[t] = Math.min(a, Math.floor(targetBeds / UmrahCore_roomCap[t]));
    } if (capacity >= types.reduce((z, t) => z + UmrahCore_roomCap[t], 0))
    for (const t of types)
        if (alloc[t] === 0)
            alloc[t] = 1; let beds = types.reduce((z, t) => z + alloc[t] * UmrahCore_roomCap[t], 0); const ranked = [...types].sort((a, b) => (UmrahCore_N(c.rooms[a].rate) / UmrahCore_roomCap[a]) - (UmrahCore_N(c.rooms[b].rate) / UmrahCore_roomCap[b]) || UmrahCore_roomCap[b] - UmrahCore_roomCap[a]); while (beds < capacity) {
    const t = ranked.find(k => alloc[k] < this.hotelStats(id, k, '', from, to).available);
    if (!t)
        break;
    alloc[t]++;
    beds += UmrahCore_roomCap[t];
    } return alloc; },
    matchHotels(city, from, to, capacity = 0) { return this.arr('hotel').filter(c => this.usable('hotel', c) && (!city || UmrahCore_S(c.city).toLowerCase() === UmrahCore_S(city).toLowerCase()) && c.from <= from && c.to >= to).map(c => { const beds = Object.keys(UmrahCore_roomCap).reduce((z, t) => z + this.hotelStats(c.id, t, '', from, to).available * UmrahCore_roomCap[t], 0); return { c, beds, total: this.contractTotal('hotel', c) }; }).filter(x => !capacity || x.beds >= capacity).sort((a, b) => a.total - b.total || b.beds - a.beds); },
    matchFlights(outDate, returnDate, seats = 0) { return this.arr('flight').filter(c => this.usable('flight', c) && (c.outDateTime || '').slice(0, 10) === outDate && (c.returnDateTime || '').slice(0, 10) === returnDate).map(c => ({ c, available: this.flightStats(c.id).available })).filter(x => x.available >= seats).sort((a, b) => UmrahCore_N(a.c.costPerSeat) - UmrahCore_N(b.c.costPerSeat)); },
    matchVisas(programType, from, to, qty = 0) { return this.arr('visa').filter(c => this.usable('visa', c) && (!c.programType || c.programType === 'all' || c.programType === programType) && (!c.from || c.from <= from) && (!c.to || c.to >= to)).map(c => ({ c, available: this.visaStats(c.id).available })).filter(x => x.available >= qty).sort((a, b) => UmrahCore_N(a.c.costPerVisa) - UmrahCore_N(b.c.costPerVisa)); },
    matchTransports(from, to, capacity = 0) { const end = UmrahCore_dateAdd(to, 1); return this.arr('transport').filter(c => this.usable('transport', c) && (!c.from || c.from <= from) && (!c.to || c.to >= to)).map(c => ({ c, stats: this.transportStats(c.id, '', from, end) })).filter(x => x.stats.availableCapacity >= capacity).sort((a, b) => UmrahCore_N(a.c.cost) / Math.max(1, UmrahCore_N(a.c.vehicles)) - UmrahCore_N(b.c.cost) / Math.max(1, UmrahCore_N(b.c.vehicles))); },
    saveService(id = '', o: any = {}) {
    UmrahCore_Bridge.require('umrah.contracts', id ? 'edit' : 'add');
    return UmrahCore_DB.atomic('serviceContractSave', () => {
        const old=id?this.get('service',id):null; if(id&&!old) throw new Error('عقد الخدمة غير موجود');
        if(old&&this.activeReservations('service',id).length){ const protectedFields=['supplierId','currency','unit','quota','costPerUnit','from','to','serviceCategory']; for(const k of protectedFields) if(o[k]!==undefined&&String(o[k])!==String(old[k]??'')) throw new Error('العقد مستخدم في برنامج. أنشئ ملحقًا تعاقديًا بدل تغيير الكمية/السعر/الفترة/المورد مباشرة.'); }
        const x={...(old||{}),...this.normalizeMeta('service',o,old||{}),id:old?.id||UmrahCore_iid(),branchId:old?.branchId||UmrahCore_Bridge.branchId(),supplierId:o.supplierId||old?.supplierId||'',serviceName:UmrahCore_S(o.serviceName||old?.serviceName).trim(),serviceCategory:o.serviceCategory||old?.serviceCategory||'custom',programType:o.programType||old?.programType||'all',unit:o.unit||old?.unit||'pax',quota:Math.max(0,UmrahCore_N(o.quota??old?.quota)),costPerUnit:Math.max(0,UmrahCore_N(o.costPerUnit??old?.costPerUnit)),currency:o.currency||old?.currency||UmrahCore_DB.data.settings.defaultCurrency,from:o.from||old?.from||'',to:o.to||old?.to||'',active:(o.status||old?.status||'draft')!=='cancelled',createdAt:old?.createdAt||UmrahCore_now(),updatedAt:UmrahCore_now()};
        const issues=this.issues('service',x); if(['confirmed','active'].includes(x.status)&&issues.errors.length) throw new Error(`لا يمكن تأكيد التعاقد: ${issues.errors.join(' • ')}`);
        if(old) Object.assign(old,x); else this.rawArr('service').unshift(x); UmrahCore_Bridge.audit(old?'update':'create','serviceContract',x.id,`${x.contractNo} • ${x.serviceName}`); return x;
    },{save:true,render:false});
    },
    createAmendment(kind, id, reason = '') {
    UmrahCore_Bridge.require('umrah.contracts','add'); const c=this.get(kind,id); if(!c) throw new Error('التعاقد غير موجود'); if(!UmrahCore_S(reason).trim()) throw new Error('سبب الملحق مطلوب');
    return UmrahCore_DB.atomic('contractAmendment',()=>{ const root=c.amendmentOf||c.id,siblings=this.arr(kind).filter(x=>(x.amendmentOf||x.id)===root),no=Math.max(0,...siblings.map(x=>UmrahCore_N(x.amendmentNo)))+1,x=UmrahCore_deep(c); x.id=UmrahCore_iid(); x.contractNo=this.nextNo(kind); x.supplierRef=''; x.status='draft'; x.amendmentOf=root; x.amendmentNo=no; x.amendmentReason=UmrahCore_S(reason).trim(); x.createdAt=UmrahCore_now(); x.updatedAt=''; x.documentRef=''; this.rawArr(kind).unshift(x); UmrahCore_Bridge.audit('amend',`${kind}Contract`,x.id,`${c.contractNo} → ${x.contractNo} • ${x.amendmentReason}`); return x; },{save:true,render:false});
    },
    adjustAllocation(kind, reservationId, o: any = {}) {
    UmrahCore_Bridge.require('umrah.contracts','edit'); UmrahCore_Bridge.require('umrah.programs','edit');
    return UmrahCore_DB.atomic('contractAllocationAdjust',()=>{ const r=UmrahCore_Ops.scoped('contractReservations').find(x=>x.id===reservationId&&x.kind===kind&&x.active!==false),c=r&&this.get(kind,r.contractId),p=r&&UmrahCore_Ops.program(r.programId); if(!r||!c||!p) throw new Error('التخصيص غير موجود'); if(['traveling','returned','closed','cancelled'].includes(p.status)) throw new Error('لا يمكن تعديل التخصيص بعد بدء السفر أو الإقفال');
        let costs=UmrahCore_Ops.scoped('programCosts').filter(x=>x.active!==false&&x.sourceReservationId===r.id),commitments=costs.flatMap(x=>UmrahCore_Procurement.commitmentsForCost(x.id)); for(const com of commitments){const st=UmrahCore_Procurement.status(com)||{};if(com.status==='invoiced'||com.hostInvoiceId||st.invoiceId||st.invoiceNo) throw new Error('يوجد فاتورة مورد مرتبطة بالتخصيص. استخدم إشعار المورد/التسوية بدل تغيير المخزون بأثر رجعي.');}
        const floor:any=UmrahCore_Inventory.allocationFloor(kind,r),segIds=[...(r.segmentIds||[]),r.segmentId].filter(Boolean),segs=UmrahCore_DB.data.programSegments.filter(x=>segIds.includes(x.id)); let allocation:any={};
        let reduced=false;
        if(kind==='hotel'){ const rooms=Object.fromEntries(Object.keys(UmrahCore_roomCap).map(t=>[t,Math.max(0,UmrahCore_N(o[`${t}Qty`]??o.rooms?.[t]))])); for(const t of Object.keys(rooms)){if(rooms[t]<UmrahCore_N(floor.rooms?.[t])) throw new Error(`لا يمكن خفض ${UmrahCore_roomLabel(t)} عن المستخدم فعليًا (${floor.rooms?.[t]||0})`);if(rooms[t]>UmrahCore_N(r.allocation?.rooms?.[t]))this.assertHotel(c.id,rooms,r.from,r.to,r.id);if(rooms[t]<UmrahCore_N(r.allocation?.rooms?.[t]))reduced=true;} allocation={rooms}; for(const seg of segs) seg.inventory=UmrahCore_deep(rooms); for(const x of costs) x.amount=UmrahCore_Inventory.hotelAllocationCost(c,rooms,r.from,r.to); }
        else if(kind==='flight'){const seats=Math.max(0,UmrahCore_N(o.seats)),old=UmrahCore_N(r.allocation?.seats);if(seats<UmrahCore_N(floor.seats))throw new Error(`لا يمكن خفض المقاعد عن المستخدم فعليًا (${floor.seats})`);if(seats>old)this.assertFlight(c.id,seats,r.id);reduced=seats<old;allocation={seats};for(const seg of segs)seg.seats=seats;for(const x of costs)x.amount=seats*UmrahCore_N(c.costPerSeat);}
        else if(kind==='visa'){const visas=Math.max(0,UmrahCore_N(o.visas)),old=UmrahCore_N(r.allocation?.visas);if(visas<UmrahCore_N(floor.visas))throw new Error(`لا يمكن خفض حصة التأشيرات عن الملفات المستخدمة (${floor.visas})`);if(visas>old)this.assertVisa(c.id,visas,r.id,r.from,r.to);reduced=visas<old;allocation={visas};}
        else if(kind==='service'){const units=Math.max(0,UmrahCore_N(o.units)),old=UmrahCore_N(r.allocation?.units);if(units<UmrahCore_N(floor.units))throw new Error(`لا يمكن خفض الخدمة عن المستخدم فعليًا (${floor.units})`);if(units>old)this.assertService(c.id,units,r.id,r.from,r.to);reduced=units<old;allocation={units};for(const x of costs)if(x.mode!=='perPax')x.amount=units*UmrahCore_N(c.costPerUnit);}
        else {const vehicles=Math.max(0,UmrahCore_N(o.vehicles)),old=UmrahCore_N(r.allocation?.vehicles),capPer=Math.max(1,UmrahCore_N(c.capacityPerVehicle)||UmrahCore_vehicleCaps[c.vehicleType]||1);if(vehicles<UmrahCore_N(floor.vehicles))throw new Error(`لا يمكن خفض المركبات عن الحد التشغيلي (${floor.vehicles})`);if(vehicles>old)this.assertTransport(c.id,vehicles,r.id,r.from,r.to);reduced=vehicles<old;allocation={vehicles,capacity:vehicles*capPer};for(const seg of segs)seg.capacity=allocation.capacity;for(const x of costs)x.amount=(UmrahCore_N(c.cost)/Math.max(1,UmrahCore_N(c.vehicles)))*vehicles;}
        if(reduced&&c.freeCancelUntil&&UmrahCore_today()>c.freeCancelUntil)throw new Error('انتهت مهلة الإلغاء المجاني لهذا التعاقد؛ سجل تسوية/رسوم إلغاء المورد بدل خفض المخزون بصمت.');
        if(['open','salesClosed','operating'].includes(p.status)){const covered=kind==='hotel'?Object.entries((allocation.rooms||{}) as Record<string, any>).reduce((z,[t,n])=>z+UmrahCore_N(n)*(UmrahCore_roomCap[t]||0),0):kind==='flight'?UmrahCore_N(allocation.seats):kind==='visa'?UmrahCore_N(allocation.visas):kind==='service'&&c.unit==='pax'?UmrahCore_N(allocation.units):kind==='transport'?UmrahCore_N(allocation.capacity):UmrahCore_N(p.capacity);if(covered<UmrahCore_N(p.capacity))throw new Error(`البرنامج مفتوح وسعته ${p.capacity}؛ لا يمكن خفض التخصيص ليغطي ${covered} فقط`);}
        for(const x of costs){UmrahCore_Procurement.cancelCostCommitments(x.id,'تعديل تخصيص تعاقدي',true);} r.allocation=UmrahCore_deep(allocation);r.updatedAt=UmrahCore_now();for(const x of costs)UmrahCore_Procurement.syncCost(x,true);UmrahCore_Bridge.audit('adjust-allocation',`${kind}Contract`,c.id,`${p.no} • ${this.allocationText(kind,r)}`);return r;
    },{save:true,render:false});
    },
    setStatus(kind, id, status, reason = '') { try {
    UmrahCore_Bridge.require('umrah.contracts', 'edit');
    const c = this.get(kind, id);
    if (!c)
        throw new Error('التعاقد غير موجود');
    const allocations = this.activeReservations(kind, id);
    if (['confirmed', 'active'].includes(status)) {
        this.assertReady(kind, c);
        const end = this.endDate(kind, c);
        if (end && end < UmrahCore_today())
            throw new Error('لا يمكن تأكيد عقد انتهت فترة خدمته؛ أنشئ عقدًا/تعديلًا جديدًا بالفترة الصحيحة.');
    }
    if (status === 'cancelled' && !UmrahCore_S(reason).trim())
        throw new Error('سبب إلغاء التعاقد مطلوب');
    if (status === 'cancelled' && allocations.length)
        throw new Error('لا يمكن إلغاء عقد محجوز لبرنامج نشط. حرر التخصيص أو ألغِ البرنامج أولًا.');
    if (allocations.length && !['confirmed', 'active'].includes(status))
        throw new Error('لا يمكن إعادة عقد مستخدم في برامج إلى مسودة/تفاوض؛ حرر تخصيصاته أولًا.');
    c.status = status;
    c.active = status !== 'cancelled';
    c.updatedAt = UmrahCore_now();
    if (status === 'cancelled') {
        c.cancelReason = UmrahCore_S(reason).trim();
        c.cancelledAt = UmrahCore_now();
    }
    UmrahCore_Bridge.audit('status', `${kind}Contract`, id, `${status}${reason ? ' • ' + reason : ''}`);
    UmrahCore_DB.save();
    UmrahCore_UI.toast('تم تحديث حالة التعاقد');
    UmrahCore_UI.render();
    }
    catch (e) {
    UmrahCore_UI.toast(e.message);
    } },
    duplicate(kind, id) { UmrahCore_Bridge.require('umrah.contracts', 'add'); const c = this.get(kind, id); if (!c)
    return; const x = UmrahCore_deep(c); x.id = UmrahCore_iid(); x.contractNo = this.nextNo(kind); x.supplierRef = ''; x.status = 'draft'; x.createdAt = UmrahCore_now(); x.updatedAt = ''; this.rawArr(kind).unshift(x); UmrahCore_Bridge.audit('copy', `${kind}Contract`, x.id, `${c.contractNo} -> ${x.contractNo}`); UmrahCore_DB.save(); },
    startProgramFrom(kind, id) { const c = this.get(kind, id); if (!c)
    return; UmrahCore_ProgramWizard.newDraft(true); if (kind === 'hotel')
    UmrahCore_ProgramWizard.applyHotelContract('stay1', id);
    else if (kind === 'flight')
    UmrahCore_ProgramWizard.applyFlightContract(id);
    else if (kind === 'visa')
    UmrahCore_ProgramWizard.applyVisaContract(id);
    else
    UmrahCore_ProgramWizard.applyTransportContract(id); },

};
__set_UmrahCore_ContractCenter(UmrahCore_ContractCenter);
export { UmrahCore_ContractCenter };
