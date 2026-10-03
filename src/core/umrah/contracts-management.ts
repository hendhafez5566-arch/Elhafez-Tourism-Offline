import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_esc, UmrahCore_money, UmrahCore_programDisplay, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_today } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Inventory } from './contracts-inventory';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_Forms, UmrahCore_Ops, UmrahCore_Procurement, UmrahCore_UI } from '../late-bindings';
const UmrahCore_ContractManagement: any = {
    edit(kind, id) { const f = kind === 'hotel' ? 'hotelContract' : kind === 'flight' ? 'flightBlock' : kind === 'visa' ? 'visaContract' : kind === 'service' ? 'serviceContract' : 'transportContract'; UmrahCore_Forms[f](id); },
    handleAlert(kind, id, action = 'details', ref = '') { try {
    if (action === 'pay')
        return this.preparePayment(kind, id, ref);
    if (action === 'edit')
        return this.edit(kind, id);
    if (action === 'sync')
        return this.retryProcurement(kind, id);
    return this.details(kind, id);
    }
    catch (e) {
    UmrahCore_UI.toast(e.message);
    } },
    warnings() { const days = Math.max(1, UmrahCore_N(UmrahCore_DB.data.settings.contractWarnDays) || 14), limit = UmrahCore_dateAdd(UmrahCore_today(), days), out = [], t = UmrahCore_today(); for (const kind of ['hotel', 'flight', 'transport', 'visa', 'service'])
    for (const c of this.arr(kind)) {
        const st = this.effectiveStatus(kind, c);
        if (st === 'cancelled')
            continue;
        const current = ['confirmed', 'active'].includes(st), issues = this.issues(kind, c);
        if (current && issues.errors.length)
            out.push({ kind, id: c.id, tone: 'red', action: 'edit', title: `تعاقد غير مكتمل — ${c.contractNo}`, desc: `${issues.errors[0]} • اضغط للإصلاح` });
        if (current && !this.paymentSchedule(kind, c).length)
            out.push({ kind, id: c.id, tone: 'orange', action: 'edit', title: `شروط السداد غير محددة — ${c.contractNo}`, desc: 'لن يفترض النظام أي قيمة أو تاريخ استحقاق. اضغط لإضافة جدول السداد.' });
        if (current) {
            const available = this.availableText(kind, c);
            if (c.releaseDeadline && available) {
                const d = c.releaseDeadline, label = 'آخر موعد لإرجاع المخزون غير المستخدم';
                if (d < t)
                    out.push({ kind, id: c.id, tone: 'red', action: 'details', title: `متأخر: ${label} — ${c.contractNo}`, desc: `كان ${d} • متاح للإرجاع: ${available}` });
                else if (d <= limit)
                    out.push({ kind, id: c.id, tone: d <= UmrahCore_dateAdd(t, 3) ? 'red' : 'orange', action: 'details', title: `${label} — ${c.contractNo}`, desc: `${d} • متاح للإرجاع: ${available}` });
            }
            if (c.freeCancelUntil) {
                const d = c.freeCancelUntil, label = 'نهاية الإلغاء المجاني';
                if (d < t && d >= UmrahCore_dateAdd(t, -days))
                    out.push({ kind, id: c.id, tone: 'orange', action: 'details', title: `انتهى: ${label} — ${c.contractNo}`, desc: `كان ${d} • ${this.name(kind, c)}` });
                else if (d >= t && d <= limit)
                    out.push({ kind, id: c.id, tone: d <= UmrahCore_dateAdd(t, 3) ? 'red' : 'orange', action: 'details', title: `${label} — ${c.contractNo}`, desc: `${d} • ${this.name(kind, c)}` });
            }
        }
        for (const p of this.paymentSchedule(kind, c)) {
            const x = this.scheduleState(kind, c, p);
            if (x.outstanding <= .01)
                continue;
            if (p.due < t)
                out.push({ kind, id: c.id, tone: 'red', action: 'pay', ref: p.id, title: `متأخر: ${p.label} — ${c.contractNo}`, desc: `كان ${p.due} • مستحق ${UmrahCore_money(x.outstanding, c.currency)} • اضغط لإنشاء سند الصرف` });
            else if (p.due <= limit)
                out.push({ kind, id: c.id, tone: p.due <= UmrahCore_dateAdd(t, 3) ? 'red' : 'orange', action: 'pay', ref: p.id, title: `${p.label} مستحقة — ${c.contractNo}`, desc: `${p.due} • مستحق ${UmrahCore_money(x.outstanding, c.currency)} • اضغط لتجهيز السداد` });
        }
        const fin = this.financial(kind, c.id), syncErr = fin.costs.find(x => x.procurementSyncStatus === 'error');
        if (syncErr && current)
            out.push({ kind, id: c.id, tone: 'red', action: 'sync', title: `فشل ربط المشتريات — ${c.contractNo}`, desc: `${syncErr.procurementSyncError || 'تعذر إنشاء أمر الشراء'} • اضغط لإعادة المحاولة` });
        if (fin.uncommitted > 0.01 && current && this.activeReservations(kind, c.id).length)
            out.push({ kind, id: c.id, tone: 'red', action: 'sync', title: `تخصيص بدون أمر شراء كامل — ${c.contractNo}`, desc: `فرق ${UmrahCore_money(fin.uncommitted, c.currency)} • اضغط لإعادة المزامنة` });
    } return out.sort((a, b) => (a.tone === 'red' ? 0 : 1) - (b.tone === 'red' ? 0 : 1) || UmrahCore_S(a.desc).localeCompare(UmrahCore_S(b.desc))); },
    name(kind, c) { return kind === 'hotel' ? c.hotelName : kind === 'flight' ? c.name : kind === 'visa' ? c.serviceName : kind === 'service' ? c.serviceName : c.provider; },
    issues(kind, c) { const errors = [], warnings = []; if (!c)
    return { errors: ['التعاقد غير موجود'], warnings }; const supplier = UmrahCore_Bridge.supplier(c.supplierId); if (!c.supplierId || !supplier)
    errors.push('المورد غير موجود في سجل الموردين المركزي'); if (!c.currency)
    errors.push('عملة التعاقد غير محددة');
    else if (!(UmrahCore_Bridge.rate(c.currency, c.signedDate || this.startDate(kind, c) || UmrahCore_today()) > 0))
    errors.push(`لا يوجد سعر صرف صالح للعملة ${c.currency}`); const start = this.startDate(kind, c), end = this.endDate(kind, c); if (!start || !end)
    errors.push('فترة التعاقد غير مكتملة');
    else if (end < start)
    errors.push('نهاية التعاقد قبل بدايته'); if (kind === 'hotel') {
    if (!UmrahCore_S(c.hotelName).trim())
        errors.push('اسم الفندق مطلوب');
    if (!Object.values((c.rooms || {}) as Record<string, any>).some((r: any) => UmrahCore_N(r.qty) > 0 && UmrahCore_N(r.rate) > 0))
        errors.push('لا يوجد مخزون غرف صالح');
    for (const [t, r] of Object.entries((c.rooms || {}) as Record<string, any>))
        if ((UmrahCore_N(r.qty) > 0) != (UmrahCore_N(r.rate) > 0))
            errors.push(`أكمل عدد وسعر ${UmrahCore_roomLabel(t)} معًا`);
    }
    else if (kind === 'flight') {
    if (!UmrahCore_S(c.airline).trim() || !c.outFlight || !c.returnFlight)
        errors.push('بيانات رحلات الطيران غير مكتملة');
    if (UmrahCore_N(c.seats) <= 0 || UmrahCore_N(c.costPerSeat) <= 0)
        errors.push('عدد المقاعد وتكلفة المقعد غير صحيحين');
    if (c.returnDateTime && c.outDateTime && c.returnDateTime <= c.outDateTime)
        errors.push('موعد العودة يجب أن يكون بعد الذهاب');
    }
    else if (kind === 'visa') {
    if (!UmrahCore_S(c.serviceName).trim())
        errors.push('اسم خدمة التأشيرة مطلوب');
    if (!['all', 'hajj', 'umrah'].includes(c.programType || 'all'))
        errors.push('نوع البرامج في اتفاقية التأشيرات غير صحيح');
    if (UmrahCore_N(c.quota) <= 0 || UmrahCore_N(c.costPerVisa) <= 0)
        errors.push('حصة التأشيرات وتكلفة التأشيرة غير مكتملتين');
    }
    else if (kind === 'service') {
    if (!UmrahCore_S(c.serviceName).trim()) errors.push('اسم الخدمة التعاقدية مطلوب');
    if (!UmrahCore_Inventory.serviceCategories.includes(c.serviceCategory || 'custom')) errors.push('تصنيف الخدمة غير صحيح');
    if (!['all','hajj','umrah'].includes(c.programType || 'all')) errors.push('نوع البرامج للخدمة غير صحيح');
    if (UmrahCore_N(c.quota) <= 0 || UmrahCore_N(c.costPerUnit) <= 0) errors.push('كمية الخدمة وتكلفة الوحدة مطلوبتان');
    if (!['pax','group','day','service'].includes(c.unit || 'pax')) errors.push('وحدة قياس الخدمة غير صحيحة');
    }
    else {
    if (!UmrahCore_S(c.provider).trim()) errors.push('شركة النقل مطلوبة');
    if (UmrahCore_N(c.vehicles) <= 0 || UmrahCore_N(c.capacityPerVehicle) <= 0 || UmrahCore_N(c.cost) <= 0) errors.push('عدد المركبات والسعة والتكلفة غير مكتملة');
    }
    if (c.releaseMode === 'rolling' && UmrahCore_N(c.releaseDays) < 0) errors.push('أيام تحرير المخزون غير صحيحة');
    if (c.releaseMode === 'absolute' && !c.releaseDeadline) errors.push('حدد تاريخ التحرير الثابت');
    for (const [i,x] of (c.stopSales||[]).entries()) { if(!x.from||!x.to) errors.push(`فترة إيقاف البيع رقم ${i+1} غير مكتملة`); else if(x.to<x.from) errors.push(`فترة إيقاف البيع رقم ${i+1} غير صحيحة`); }
    if (kind === 'hotel') {
    const periods=(c.inventoryPeriods||[]); for(const [i,x] of periods.entries()) { if(!x.from||!x.to||!x.roomType) errors.push(`فترة مخزون الفندق رقم ${i+1} غير مكتملة`); else { if(x.to<=x.from) errors.push(`فترة مخزون الفندق رقم ${i+1} غير صحيحة`); if(c.from&&x.from<c.from||c.to&&x.to>c.to) errors.push(`فترة مخزون الفندق رقم ${i+1} خارج مدة العقد`); } if((UmrahCore_N(x.qty)>0)!=(UmrahCore_N(x.rate)>0)) errors.push(`أكمل العدد والسعر في فترة مخزون الفندق رقم ${i+1}`); }
    for(const t of Object.keys(UmrahCore_roomCap)) for(let d=c.from; c.from&&c.to&&d<c.to; d=UmrahCore_dateAdd(d,1)) { const q=UmrahCore_Inventory.hotelTermsAt(c,t,d).qty, reserved=UmrahCore_Inventory.hotelReservedOn(c.id,t,d); if(reserved>q) errors.push(`المخزون في ${d} — ${UmrahCore_roomLabel(t)} أقل من التخصيص الحالي (${reserved}/${q})`); }
    }
    const schedule = this.paymentSchedule(kind, c), total = this.contractTotal(kind, c), scheduled = schedule.reduce((z, x) => z + UmrahCore_N(x.amount), 0); if (!schedule.length)
    warnings.push('شروط السداد غير محددة؛ لن ينشئ النظام استحقاقًا افتراضيًا');
    else {
    if (scheduled > total + .01)
        errors.push(`إجمالي جدول السداد ${UmrahCore_money(scheduled, c.currency)} يتجاوز قيمة العقد ${UmrahCore_money(total, c.currency)}`);
    if (total > 0 && scheduled + .01 < total)
        warnings.push(`جدول السداد يغطي ${UmrahCore_money(scheduled, c.currency)} فقط من قيمة العقد ${UmrahCore_money(total, c.currency)}`);
    } if (!c.documentRef && !UmrahCore_Bridge.attachments(`${kind}Contract`, c.id).length)
    warnings.push('لا توجد صورة/مرجع للعقد'); if (c.releaseDeadline && start && c.releaseDeadline > start)
    warnings.push('موعد إرجاع المخزون بعد بداية الخدمة؛ راجع الشرط'); return { errors: [...new Set(errors)], warnings: [...new Set(warnings)] }; },
    assertReady(kind, c) { const x = this.issues(kind, c); if (x.errors.length)
    throw new Error(`لا يمكن تأكيد التعاقد: ${x.errors.join(' • ')}`); return x; },
    financial(kind, id) { const c = this.get(kind, id); if (!c)
    return { rows: [], costs: [], allocated: 0, committed: 0, invoiced: 0, remaining: 0, paid: 0, uncommitted: 0, uninvoiced: 0 }; const costs = UmrahCore_Ops.scoped('programCosts').filter(x => x.active !== false && x.sourceContractKind === kind && x.sourceContractId === id), costIds = new Set(costs.map(x => x.id)), rows = UmrahCore_Ops.scoped('supplierCommitments').filter(x => x.active !== false && x.status !== 'cancelled' && ((x.sourceType === `${kind}Contract` && x.sourceId === id) || costIds.has(x.sourceCostId))), out = { rows, costs, allocated: 0, committed: 0, invoiced: 0, remaining: 0, paid: 0, uncommitted: 0, uninvoiced: 0 }, toContract = (amount, from, date, fxToBase = 0) => { const a = UmrahCore_N(amount), cur = from || c.currency; if (cur === c.currency)
    return a; const d = date || this.startDate(kind, c) || UmrahCore_today(), rf = UmrahCore_N(fxToBase) || UmrahCore_Bridge.rate(cur, d), rt = UmrahCore_Bridge.rate(c.currency, d); return rf > 0 && rt > 0 ? a * rf / rt : a; }; for (const x of costs) {
    let qty = 1;
    if (x.mode === 'perPax') {
        const r = UmrahCore_Ops.scoped('contractReservations').find(v => v.id === x.sourceReservationId) || this.activeReservations(kind, id).find(v => v.programId === x.programId);
        qty = kind === 'flight' ? UmrahCore_N(r?.allocation?.seats) : kind === 'visa' ? UmrahCore_N(r?.allocation?.visas) : kind === 'service' ? UmrahCore_N(r?.allocation?.units) : kind === 'transport' ? UmrahCore_N(r?.allocation?.capacity) : Object.entries(r?.allocation?.rooms || {}).reduce((z, [t, n]) => z + UmrahCore_N(n) * (UmrahCore_roomCap[t] || 0), 0);
        qty = Math.max(1, qty);
    }
    const p = UmrahCore_Ops.program(x.programId), d = p?.departureDate || this.startDate(kind, c) || UmrahCore_today();
    out.allocated += toContract(UmrahCore_N(x.amount) * qty, x.currency, d, x.fxToBase);
    } for (const r of rows) {
    const p = UmrahCore_Ops.program(r.programId), d = p?.departureDate || r.date || this.startDate(kind, c) || UmrahCore_today(), snap = UmrahCore_Procurement.status(r) || {}, committed = toContract(UmrahCore_N(r.total), r.currency, d);
    out.committed += committed;
    const invTotalRaw = UmrahCore_N(snap.total) || UmrahCore_N(r.total), invCurrency = snap.currency || r.currency, invTotal = toContract(invTotalRaw, invCurrency, d);
    if (r.status === 'invoiced' || r.hostInvoiceId || snap.invoiceId || snap.invoiceNo) {
        out.invoiced += invTotal;
        const remainingRaw = snap.remaining == null ? invTotalRaw : UmrahCore_N(snap.remaining), paidRaw = snap.paid == null ? Math.max(0, invTotalRaw - remainingRaw) : UmrahCore_N(snap.paid);
        out.remaining += toContract(remainingRaw, invCurrency, d);
        out.paid += toContract(paidRaw, invCurrency, d);
    }
    } out.uncommitted = Math.max(0, out.allocated - out.committed); out.uninvoiced = Math.max(0, out.committed - out.invoiced); return out; },
    allocationText(kind, r) { if (kind === 'hotel')
    return Object.entries(r.allocation?.rooms || {}).filter(([, v]) => UmrahCore_N(v) > 0).map(([t, v]) => `${UmrahCore_roomLabel(t)} ${UmrahCore_N(v)}`).join('، ') || '-'; if (kind === 'flight')
    return `${UmrahCore_N(r.allocation?.seats)} مقعد`; if (kind === 'visa') return `${UmrahCore_N(r.allocation?.visas)} تأشيرة`; if (kind === 'service') return `${UmrahCore_N(r.allocation?.units)} ${UmrahCore_Inventory.serviceUnitLabel(this.get('service',r.contractId)?.unit)}`; return `${UmrahCore_N(r.allocation?.vehicles)} مركبة / ${UmrahCore_N(r.allocation?.capacity)} راكب`; },
    availableText(kind, c) { if (!this.usable(kind, c))
    return ''; if (kind === 'hotel') {
    const x = Object.keys(UmrahCore_roomCap).map(t => [t, this.hotelStats(c.id, t).available]).filter(([, v]) => v > 0);
    return x.map(([t, v]) => `${UmrahCore_roomLabel(t)} ${v}`).join('، ');
    } if (kind === 'flight') {
    const n = this.flightStats(c.id).available;
    return n ? `${n} مقعد` : '';
    } if (kind === 'visa') {
    const n = this.visaStats(c.id).available;
    return n ? `${n} تأشيرة` : '';
    } if (kind === 'service') { const n=this.serviceStats(c.id).available; return n ? `${n} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}` : ''; } const n = this.transportStats(c.id).availableVehicles; return n ? `${n} مركبة` : ''; },
    compatiblePrograms(kind, c) { return UmrahCore_Ops.scoped('programs').filter(p => !['traveling', 'returned', 'closed', 'cancelled'].includes(p.status)).filter(p => { if (kind === 'flight')
    return (c.outDateTime || '').slice(0, 10) === p.departureDate && (c.returnDateTime || '').slice(0, 10) === p.returnDate; if (kind === 'visa')
    return (!c.programType || c.programType === 'all' || c.programType === p.programType) && (!c.from || c.from <= p.departureDate) && (!c.to || c.to >= p.returnDate); if (kind === 'hotel') return (!c.from || c.from <= p.returnDate) && (!c.to || c.to >= p.departureDate); if (kind === 'service') return (!c.programType || c.programType === 'all' || c.programType === p.programType) && (!c.from || c.from <= p.departureDate) && (!c.to || c.to >= p.returnDate); return (!c.from || c.from <= p.departureDate) && (!c.to || c.to >= p.returnDate); }); },
    history(kind, id) { return UmrahCore_Ops.scoped('contractReservations').filter(r => r.kind === kind && r.contractId === id).sort((a, b) => UmrahCore_S(b.createdAt).localeCompare(UmrahCore_S(a.createdAt))); },
    usage(kind, id) { return this.activeReservations(kind, id).map(r => ({ r, program: UmrahCore_Ops.program(r.programId), segment: UmrahCore_Ops.segment(r.segmentId) })).filter(x => x.program); },
    details(kind, id) {
    const c = this.get(kind, id);
    if (!c)
        return;
    const issues = this.issues(kind, c), use = this.usage(kind, id), canCost = UmrahCore_Bridge.canViewCosts() && UmrahCore_Bridge.can('umrah.costing', 'view'), canEdit = UmrahCore_Bridge.can('umrah.contracts', 'edit'), fin = canCost ? this.financial(kind, id) : null, pay = canCost ? this.paymentSchedule(kind, c) : [];
    const rows = use.map(x => `<tr><td><b>${UmrahCore_esc(x.program.no)}</b><div class="muted">${UmrahCore_esc(UmrahCore_programDisplay(x.program))}</div></td><td>${UmrahCore_esc(x.segment?.title || '-')}</td><td>${x.r.from || '-'}${x.r.to ? ' → ' + x.r.to : ''}</td><td>${UmrahCore_esc(this.allocationText(kind, x.r))}</td><td><div class="quick-actions"><button type="button" class="btn small ghost" data-umrah-close-program-overview="${x.program.id}">فتح البرنامج</button>${canEdit && !['traveling', 'returned', 'closed'].includes(x.program.status) ? `<button type="button" class="btn small soft" data-umrah-contract-action="allocationAdjustment" data-umrah-contract-kind="${kind}" data-umrah-contract-id="${x.r.id}">تعديل الكمية</button><button type="button" class="btn small danger" data-umrah-contract-action="unallocation" data-umrah-contract-kind="${kind}" data-umrah-contract-id="${x.r.id}">تحرير كامل</button>` : ''}</div></td></tr>`).join('');
    const finRows = canCost ? fin.rows.map(r => { const st = UmrahCore_Procurement.status(r) || {}; return `<tr><td>${UmrahCore_esc(UmrahCore_Ops.program(r.programId)?.no || '-')}</td><td><b>${UmrahCore_esc(r.description)}</b></td><td>${UmrahCore_money(r.total, r.currency)}</td><td>${UmrahCore_esc(st.poNo || r.hostPONo || '-')}</td><td>${UmrahCore_esc(st.invoiceNo || r.hostInvoiceNo || '-')}</td><td>${st.remaining == null ? '-' : UmrahCore_money(st.remaining, st.currency || r.currency)}</td></tr>`; }).join('') : '';
    const finance = canCost ? `<div class="grid kpis contract-detail-kpis"><div class="card kpi"><div class="label">القيمة التعاقدية</div><div class="value">${UmrahCore_money(this.contractTotal(kind, c), c.currency)}</div></div><div class="card kpi"><div class="label">مخصص للبرامج</div><div class="value">${UmrahCore_money(fin.allocated, c.currency)}</div></div><div class="card kpi"><div class="label">فواتير المورد</div><div class="value">${UmrahCore_money(fin.invoiced, c.currency)}</div></div><div class="card kpi"><div class="label">متبقي فواتير المورد</div><div class="value">${UmrahCore_money(fin.remaining, c.currency)}</div></div></div><div class="form-section"><div class="section-head"><div><h3>الربط مع المشتريات المركزية</h3><p>العقد لا ينشئ مديونية. التخصيص ينشئ أمر شراء حسب السياسة، وفاتورة المورد فقط تنشئ الرصيد المستحق.</p></div><div class="quick-actions"><button type="button" class="btn small ghost" data-umrah-close-erp="purchaseorders">أوامر الشراء</button><button type="button" class="btn small ghost" data-umrah-close-erp="purchases">فواتير الموردين</button></div></div><div class="table-wrap"><table class="table"><thead><tr><th>البرنامج</th><th>الخدمة</th><th>القيمة</th><th>أمر الشراء</th><th>فاتورة المورد</th><th>المتبقي</th></tr></thead><tbody>${finRows || '<tr><td colspan="6" class="empty">لا يوجد التزام شراء ناتج عن هذا العقد حتى الآن</td></tr>'}</tbody></table></div></div><div class="form-section"><h3>جدول الدفعات التعاقدي</h3><div class="info-note">موعد الدفعة لا ينشئ فاتورة مورد تلقائيًا. السداد قبل وجود فاتورة يسجل دفعة مقدمة للمورد مرتبطة بالعقد.</div>${pay.map(p => { const st = this.scheduleState(kind, c, p); return `<div class="info-row"><div><b>${UmrahCore_esc(p.label)}</b><small>${p.due} • ${st.status === 'paid' ? 'مسددة' : st.status === 'partial' ? 'مسددة جزئيًا' : 'غير مسددة'}</small></div><div><span>${UmrahCore_money(p.amount, c.currency)}</span>${st.paid > 0 ? `<small>مدفوع ${UmrahCore_money(st.paid, c.currency)} • متبقي ${UmrahCore_money(st.outstanding, c.currency)}</small>` : ''}${st.outstanding > .01 ? `<button type="button" class="btn small success" data-umrah-close-contract-action="payment" data-umrah-contract-kind="${kind}" data-umrah-contract-id="${c.id}" data-umrah-contract-extra="${p.id}">سداد الآن</button>` : ''}</div></div>`; }).join('') || '<div class="empty">لم يتم تحديد جدول دفعات؛ لن يفترض النظام قيمة أو تاريخ استحقاق.</div>'}</div>` : `<div class="info-note">القيم والتفاصيل المالية مخفية حسب صلاحياتك.</div>`;
    const body = `<div class="entity-link-bar"><span class="badge ${this.statusTone(this.effectiveStatus(kind, c))}">${this.statusLabel(this.effectiveStatus(kind, c))}</span><b>${UmrahCore_esc(c.contractNo)} — ${UmrahCore_esc(this.name(kind, c))}</b>${UmrahCore_Bridge.partyControls('supplier',c.supplierId)}<button type="button" class="btn small soft" data-umrah-close-contract-action="docs" data-umrah-contract-kind="${kind}" data-umrah-contract-id="${c.id}">المرفقات</button>${canEdit ? `<button type="button" class="btn small soft" data-umrah-close-contract-action="amendment" data-umrah-contract-kind="${kind}" data-umrah-contract-id="${c.id}">+ ملحق تعاقدي</button>` : ''}${canEdit && !use.length && !['cancelled', 'expired'].includes(this.effectiveStatus(kind, c)) ? `<button type="button" class="btn small danger" data-umrah-contract-cancel="${c.id}" data-umrah-contract-kind="${kind}">إلغاء العقد</button>` : ''}</div>${issues.errors.length || issues.warnings.length ? `<div class="${issues.errors.length ? 'danger-note' : 'info-note'} mb-12"><b>${issues.errors.length ? 'يحتاج معالجة قبل التأكيد' : 'ملاحظات التعاقد'}</b><br>${[...issues.errors, ...issues.warnings].map(UmrahCore_esc).join('<br>')}</div>` : ''}${finance}<div class="form-section"><h3>استخدام المخزون في البرامج</h3><div class="table-wrap"><table class="table"><thead><tr><th>البرنامج</th><th>القطاع</th><th>الفترة</th><th>التخصيص</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="empty">لم يتم تخصيص هذا العقد لأي برنامج</td></tr>'}</tbody></table></div></div>`;
    UmrahCore_Forms.view(`تفاصيل التعاقد — ${c.contractNo}`, this.kindLabel(kind), body);
    },
    kpis() { let rooms = 0, seats = 0, transport = 0, visas = 0, services = 0, active = 0, contractValue = 0, allocatedValue = 0; for (const kind of ['hotel', 'flight', 'transport', 'visa', 'service'])
    for (const c of this.arr(kind)) {
        if (!this.usable(kind, c))
            continue;
        active++;
        const rate = UmrahCore_Bridge.rate(c.currency, this.startDate(kind, c) || UmrahCore_today()) || 0;
        contractValue += this.contractTotal(kind, c) * rate;
        const f = this.financial(kind, c.id);
        allocatedValue += f.allocated * rate;
        if (kind === 'hotel')
            for (const t of Object.keys(UmrahCore_roomCap))
                rooms += this.hotelStats(c.id, t).available;
        else if (kind === 'flight')
            seats += this.flightStats(c.id).available;
        else if (kind === 'visa') visas += this.visaStats(c.id).available; else if (kind === 'service') services += this.serviceStats(c.id).available; else transport += this.transportStats(c.id).availableCapacity;
    } const alerts = this.warnings(); return { active, rooms, seats, transport, visas, services, contractValue, allocatedValue, alerts: alerts.length }; },
    commonFields(c: any = {}) { return `<div class="form-section"><h3>إدارة العقد</h3><div class="form-grid three"><div class="field"><label>رقم العقد</label><input value="${UmrahCore_esc(c.contractNo || 'يتولد تلقائيًا عند الحفظ')}" disabled></div><div class="field"><label>مرجع عقد المورد</label><input name="supplierRef" value="${UmrahCore_esc(c.supplierRef || '')}"></div><div class="field"><label>الحالة</label><select name="status">${['draft','negotiating','confirmed','active'].map(s=>`<option value="${s}" ${c.status===s||(!c.status&&s==='draft')?'selected':''}>${this.statusLabel(s)}</option>`).join('')}</select></div><div class="field"><label>تاريخ التعاقد</label><input name="signedDate" type="date" value="${c.signedDate || UmrahCore_today()}"></div><div class="field"><label>مسؤول المورد</label><input name="contactName" value="${UmrahCore_esc(c.contactName || '')}"></div><div class="field"><label>هاتف المسؤول</label><input name="contactPhone" value="${UmrahCore_esc(c.contactPhone || '')}"></div><div class="field"><label>إلغاء مجاني حتى</label><input name="freeCancelUntil" type="date" value="${c.freeCancelUntil || ''}"></div><div class="field"><label>سياسة تحرير المخزون</label><select name="releaseMode"><option value="manual" ${(c.releaseMode||(!c.releaseDeadline?'manual':''))==='manual'?'selected':''}>يدوي / لا يوجد تحرير تلقائي</option><option value="absolute" ${(c.releaseMode==='absolute'||(!c.releaseMode&&c.releaseDeadline))?'selected':''}>تاريخ ثابت</option><option value="rolling" ${c.releaseMode==='rolling'?'selected':''}>قبل الخدمة بعدد أيام</option></select></div><div class="field"><label>تاريخ التحرير الثابت</label><input name="releaseDeadline" type="date" value="${c.releaseDeadline || ''}"></div><div class="field"><label>تحرير قبل موعد الخدمة (يوم)</label><input name="releaseDays" type="number" min="0" value="${UmrahCore_N(c.releaseDays)||''}"></div><div class="field"><label>مرجع المستند/العقد</label><input name="documentRef" value="${UmrahCore_esc(c.documentRef || '')}"></div></div>${c.amendmentOf?`<div class="info-note">هذا ملحق تعاقدي رقم ${UmrahCore_N(c.amendmentNo)}${c.amendmentReason?` — ${UmrahCore_esc(c.amendmentReason)}`:''}</div>`:''}</div><div class="form-section"><div class="section-head"><div><h3>إيقاف البيع</h3><p>أي فترة هنا تمنع تخصيص مخزون جديد فعليًا، وليست مجرد تنبيه.</p></div><button type="button" class="btn small soft" data-umrah-inventory-add="stopSale">+ فترة إيقاف</button></div>${UmrahCore_Inventory.stopSaleRowsHtml(c)}</div><div class="form-section"><div class="section-head"><div><h3>جدول الدفعات التعاقدي</h3><p>حدد المواعيد الحقيقية المتفق عليها فقط. إنشاء العقد لا ينشئ فاتورة مورد أو مديونية.</p></div><button type="button" class="btn small soft" data-umrah-inventory-add="payment">+ إضافة دفعة</button></div>${this.paymentRowsHtml(c)}<div class="field full"><label>شروط السداد النصية</label><textarea name="paymentTerms" placeholder="مثال: 20% عند التوقيع، 30% قبل الوصول بشهر...">${UmrahCore_esc(c.paymentTerms || '')}</textarea></div></div>`; },
docs(kind,id){ UmrahCore_Bridge.openAttachment(`${kind}Contract`, id); }
};
Object.assign(UmrahCore_ContractCenter, UmrahCore_ContractManagement);
export { UmrahCore_ContractManagement };
