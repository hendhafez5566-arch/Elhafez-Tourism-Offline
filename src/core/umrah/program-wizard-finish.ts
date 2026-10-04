import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_deep, UmrahCore_money } from './runtime';
import { UmrahCore_Bridge, UmrahCore_Cost, UmrahCore_DB } from './data';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_Ops, UmrahCore_State, UmrahCore_UI } from '../late-bindings';
const ProgramWizard_Finish = {
    async next() { if (this.busy)
        return; this.setBusy(true); try {
        this.capture(false);
        await new Promise<void>(r => requestAnimationFrame(() => r()));
        this.validateStep(this.step);
        this.lastError = '';
        (UmrahCore_UI as any).pushLocation({ page: 'guided-program', programWizard: { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) } });
        this.step = Math.min(6, this.step + 1);
        this.maxStep = Math.max(this.maxStep, this.step);
        UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) };
        UmrahCore_DB.saveUiState();
        UmrahCore_UI.render();
    }
    catch (e) {
        this.lastError = UmrahCore_S(e.message || e);
        this.refreshAssistant();
        UmrahCore_UI.toast(this.lastError);
    }
    finally {
        this.setBusy(false);
    } },
    back() { this.flushCapture(); this.lastError = ''; if (this.step <= 1) {
        UmrahCore_DB.data.uiState.programWizard = { step: 1, maxStep: this.maxStep, data: UmrahCore_deep(this.data) };
        UmrahCore_DB.saveUiState();
        return (UmrahCore_UI as any).openPage('dashboard');
    } (UmrahCore_UI as any).pushLocation({ page: 'guided-program', programWizard: { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) } }); this.step--; UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); },
    jumpTo(step) { step = Math.max(1, Math.min(6, UmrahCore_N(step))); if (step === this.step)
        return; if (step > this.maxStep) {
        UmrahCore_UI.toast('أكمل الخطوات السابقة أولًا قبل الانتقال لهذه الخطوة');
        return;
    } this.flushCapture(); (UmrahCore_UI as any).pushLocation({ page: 'guided-program', programWizard: { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) } }); this.lastError = ''; this.step = step; UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); },
    suggestPrices() { this.capture(); const p = this.plan(); if (this.data.profitMode !== 'fixed' && UmrahCore_N(this.data.marginPct) >= 100)
        return UmrahCore_UI.toast('هامش الربح يجب أن يكون أقل من 100%'); const defs = [['priceSingle', 'single'], ['priceDouble', 'double'], ['priceTriple', 'triple'], ['priceQuad', 'quad'], ['priceQuint', 'quint']]; let applied = 0; for (const [field, type] of defs) {
        const raw = UmrahCore_N(p.roomSuggestions?.[type]);
        if (raw > 0 && !UmrahCore_N(this.data[field])) {
            this.data[field] = Math.ceil(raw / 10) * 10;
            applied++;
        }
    } UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); const label = this.data.profitMode === 'fixed' ? `ربح ثابت ${UmrahCore_money(UmrahCore_N(this.data.fixedProfit), this.data.currency)} لكل فرد` : `هامش ${UmrahCore_N(this.data.marginPct)}% من سعر البيع`; UmrahCore_UI.toast(applied ? `تم حساب ${applied} أسعار حسب تكلفة كل نوع غرفة و${label}` : 'لا توجد أنواع غرف مكتملة (مخزون + سعر في كل إقامة) لتطبيق اقتراح تلقائي'); },
    async finish() { this.capture(false); let saved = null; try {
        const pre = this.preflight(true), token = pre.d.creationToken;
        let existing = UmrahCore_DB.data.programs.find(x => x.creationToken === token);
        if (existing && (['cancelled', 'closed'].includes(existing.status) || existing.active === false))
            throw new Error('المسودة مرتبطة ببرنامج مغلق أو ملغي؛ ابدأ برنامجًا جديدًا');
        if (existing)
            saved = { programId: existing.id, programNo: existing.no, reused: true };
        else
            saved = await UmrahCore_DB.atomicAsync('programWizardCreateComplete', async () => { let pid = ''; const plan = this.preflight(true), d = plan.d, duplicate = UmrahCore_DB.data.programs.find(x => x.creationToken === d.creationToken); if (duplicate)
                return { programId: duplicate.id, programNo: duplicate.no, reused: true }; const p = UmrahCore_Ops.createProgram({ programType: d.programType || 'umrah', name: d.name, groupNo: d.groupNo, groupDescription: d.groupDescription, seasonId: d.seasonId, departureDate: d.departureDate, returnDate: d.returnDate, capacity: d.capacity, currency: d.currency, fxRateSnapshot: this.ensureRate(d.currency, d.departureDate, d.fxRate), defaultTreasuryId: d.defaultTreasuryId, costCenterId: '', holdHours: d.holdHours, depositMin: d.depositMin, priceSingle: d.priceSingle, priceDouble: d.priceDouble, priceTriple: d.priceTriple, priceQuad: d.priceQuad, priceQuint: d.priceQuint, childBed: d.childBed, childNoBed: d.childNoBed, infant: d.infant, status: 'planning', requirementsConfigured:'1', reqHotel: plan.stays.length?'yes':'', reqFlight:(d.outFlight&&d.returnFlight)?'yes':'', reqTransport:(d.transportContractId||d.transportProvider||UmrahCore_N(d.transportCost)>0)?'yes':'', reqVisa:(d.visaContractId||d.visaSupplierId||UmrahCore_N(d.visaCost)>0)?'yes':'', reqCamp:d.programType==='hajj'?'yes':'', reqPermit:d.programType==='hajj'?'yes':'' }); p.creationToken = d.creationToken; pid = p.id; let seq = 1, curDate = p.departureDate; for (const st of plan.stays) {
                const nights = UmrahCore_N(st.nights), end = UmrahCore_dateAdd(curDate, nights - 1), checkout = UmrahCore_dateAdd(curDate, nights), source = st.source === 'smart' ? 'existing' : (st.source || 'existing');
                let hc = null;
                if (st.contractId)
                    hc = UmrahCore_ContractCenter.get('hotel', st.contractId);
                else if (source === 'new')
                    hc = UmrahCore_Ops.addHotelContract({ hotelName: st.hotel, shortName: st.label, city: st.city, supplierId: st.supplierId, from: curDate, to: checkout, currency: st.currency, status: 'confirmed', singleQty: st.rooms.single.qty, singleRate: st.rooms.single.rate, doubleQty: st.rooms.double.qty, doubleRate: st.rooms.double.rate, tripleQty: st.rooms.triple.qty, tripleRate: st.rooms.triple.rate, quadQty: st.rooms.quad.qty, quadRate: st.rooms.quad.rate, quintQty: st.rooms.quint.qty, quintRate: st.rooms.quint.rate, balanceDue: curDate });
                const seg = UmrahCore_Ops.addSegment({ programId: pid, type: 'hotel', title: `إقامة ${st.label} — ${st.hotel}`, start: curDate, end, nights, sequence: seq++, supplierId: st.supplierId, contractId: hc?.id || '', city: st.city, inventory: Object.fromEntries(Object.entries(st.rooms as Record<string, any>).map(([k, v]) => [k, UmrahCore_N(v.qty)])) }, true);
                if (hc)
                    UmrahCore_ContractCenter.reserve('hotel', hc.id, pid, { rooms: Object.fromEntries(Object.entries(st.rooms as Record<string, any>).map(([k, v]) => [k, UmrahCore_N(v.qty)])) }, seg.id, curDate, checkout, true);
                UmrahCore_Cost.add({ programId: pid, category: 'hotel', description: `إقامة ${st.label} — ${st.hotel}`, amount: this.hotelAmount(st), currency: st.currency, fxToBase: this.ensureRate(st.currency, p.departureDate, st.fxRate), mode: 'fixed', supplierId: st.supplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onReturned', sourceContractKind: hc ? 'hotel' : '', sourceContractId: hc?.id || '' }, true);
                curDate = checkout;
            } const fc = d.flightCurrency || p.currency; let fb = d.flightContractId ? UmrahCore_ContractCenter.get('flight', d.flightContractId) : null; if (!fb && d.flightSource === 'new')
                fb = UmrahCore_Ops.addFlightBlock({ name: `${d.airline} ${d.outFlight}`, airline: d.airline, supplierId: d.flightSupplierId, outFlight: d.outFlight, outFrom: d.outFrom, outTo: d.outTo, outDateTime: d.outDateTime, returnFlight: d.returnFlight, returnFrom: d.returnFrom, returnTo: d.returnTo, returnDateTime: d.returnDateTime, seats: d.seats, currency: fc, costPerSeat: d.costPerSeat, status: 'confirmed', ticketDeadline: UmrahCore_dateAdd(p.departureDate, -7), balanceDue: UmrahCore_dateAdd(p.departureDate, -7) }); const outSeg = UmrahCore_Ops.addSegment({ programId: pid, type: 'flight', title: `ذهاب ${d.airline} ${d.outFlight}`, start: d.outDateTime.slice(0, 10), end: d.outDateTime.slice(0, 10), sequence: seq++, supplierId: d.flightSupplierId, contractId: fb?.id || '', route: `${d.outFrom} → ${d.outTo}`, details: d.outDateTime, direction: 'outbound', airline: d.airline, flightNo: d.outFlight, from: d.outFrom, to: d.outTo, dateTime: d.outDateTime, seats: d.seats }, true); UmrahCore_Ops.addSegment({ programId: pid, type: 'flight', title: `عودة ${d.airline} ${d.returnFlight}`, start: d.returnDateTime.slice(0, 10), end: d.returnDateTime.slice(0, 10), sequence: seq++, supplierId: d.flightSupplierId, contractId: fb?.id || '', route: `${d.returnFrom} → ${d.returnTo}`, details: d.returnDateTime, direction: 'return', airline: d.airline, flightNo: d.returnFlight, from: d.returnFrom, to: d.returnTo, dateTime: d.returnDateTime, seats: d.seats }, true); if (fb)
                UmrahCore_ContractCenter.reserve('flight', fb.id, pid, { seats: UmrahCore_N(d.seats) }, outSeg.id, '', '', true); if (d.flightPolicy === 'perPax')
                UmrahCore_Cost.add({ programId: pid, category: 'flight', description: `طيران ${d.airline} لكل مسافر`, amount: d.costPerSeat, currency: fc, fxToBase: this.ensureRate(fc, p.departureDate, d.flightFxRate), mode: 'perPax', supplierId: d.flightSupplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onTicketIssued', sourceContractKind: fb ? 'flight' : '', sourceContractId: fb?.id || '' }, true);
            else
                UmrahCore_Cost.add({ programId: pid, category: 'flight', description: `بلوك طيران ${d.airline}`, amount: UmrahCore_N(d.costPerSeat) * UmrahCore_N(d.seats), currency: fc, fxToBase: this.ensureRate(fc, p.departureDate, d.flightFxRate), mode: 'fixed', supplierId: d.flightSupplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onTraveling', sourceContractKind: fb ? 'flight' : '', sourceContractId: fb?.id || '' }, true); if (UmrahCore_S(d.transportProvider).trim()) {
                const tc = d.transportCurrency || p.currency;
                let ct = d.transportContractId ? UmrahCore_ContractCenter.get('transport', d.transportContractId) : null;
                if (!ct && d.transportSource === 'new')
                    ct = UmrahCore_Ops.addTransportContract({ provider: d.transportProvider, supplierId: d.transportSupplierId, route: d.transportRoute, vehicleType: d.vehicleType, vehicles: d.vehicles, capacityPerVehicle: d.busCapacity, currency: tc, cost: d.transportCost, from: p.departureDate, to: p.returnDate, status: 'confirmed', balanceDue: p.departureDate });
                const seg = UmrahCore_Ops.addSegment({ programId: pid, type: 'transport', title: `النقل — ${d.transportProvider}`, start: p.departureDate, end: p.returnDate, sequence: seq++, supplierId: d.transportSupplierId, contractId: ct?.id || '', route: d.transportRoute, capacity: UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity) }, true);
                if (ct)
                    UmrahCore_ContractCenter.reserve('transport', ct.id, pid, { vehicles: UmrahCore_N(d.vehicles), capacity: UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity) }, seg.id, p.departureDate, UmrahCore_dateAdd(p.returnDate, 1), true);
                UmrahCore_Cost.add({ programId: pid, category: 'transport', description: `نقل البرنامج — ${d.transportProvider}`, amount: d.transportCost, currency: tc, fxToBase: this.ensureRate(tc, p.departureDate, d.transportFxRate), mode: 'fixed', supplierId: d.transportSupplierId, procurementPolicy: 'fixedOnOpen', actualizationPolicy: 'onReturned', sourceContractKind: ct ? 'transport' : '', sourceContractId: ct?.id || '' }, true);
            } if (d.visaSupplierId && UmrahCore_N(d.visaCost) > 0) {
                const vc = d.visaCurrency || p.currency;
                let vct = d.visaContractId ? UmrahCore_ContractCenter.get('visa', d.visaContractId) : null;
                if (!vct && d.visaSource === 'new')
                    vct = UmrahCore_Ops.addVisaContract({ serviceName: d.visaServiceName || 'تأشيرة', programType: d.programType || 'all', supplierId: d.visaSupplierId, from: p.departureDate, to: p.returnDate, quota: UmrahCore_N(p.capacity), currency: vc, costPerVisa: d.visaCost, status: 'confirmed' });
                const vseg = UmrahCore_Ops.addSegment({ programId: pid, type: 'visa', title: UmrahCore_S(d.visaServiceName).trim() || 'التأشيرات', start: p.departureDate, end: p.departureDate, sequence: seq++, supplierId: d.visaSupplierId, contractId: vct?.id || '', deadline: UmrahCore_dateAdd(p.departureDate, -14) }, true);
                let vr = null;
                if (vct)
                    vr = UmrahCore_ContractCenter.reserve('visa', vct.id, pid, { visas: UmrahCore_N(p.capacity) }, vseg.id, '', '', true);
                UmrahCore_Cost.add({ programId: pid, category: 'visa', description: `${UmrahCore_S(d.visaServiceName).trim() || 'تأشيرة'} لكل ${d.programType === 'hajj' ? 'حاج' : 'معتمر'} مؤكد`, amount: d.visaCost, currency: vc, fxToBase: this.ensureRate(vc, p.departureDate, d.visaFxRate), mode: 'perPax', supplierId: d.visaSupplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onVisaIssued', sourceContractKind: vct ? 'visa' : '', sourceContractId: vct?.id || '', sourceReservationId: vr?.id || '', sourceSegmentId: vseg.id }, true);
            } if (d.programType === 'hajj' && d.campSupplierId && UmrahCore_N(d.campCost) > 0) {
                const cc = d.campCurrency || p.currency;
                UmrahCore_Ops.addSegment({ programId: pid, type: 'camp', title: UmrahCore_S(d.campTitle).trim() || 'مخيم المشاعر', start: p.departureDate, end: p.returnDate, sequence: seq++, supplierId: d.campSupplierId }, true);
                UmrahCore_Cost.add({ programId: pid, category: 'camp', description: `${UmrahCore_S(d.campTitle).trim() || 'مخيم المشاعر'} لكل حاج مؤكد`, amount: d.campCost, currency: cc, fxToBase: this.ensureRate(cc, p.departureDate, d.campFxRate), mode: 'perPax', supplierId: d.campSupplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onCampAssigned' }, true);
            } if (d.programType === 'hajj' && d.permitSupplierId && UmrahCore_N(d.permitCost) > 0) {
                const pc = d.permitCurrency || p.currency;
                UmrahCore_Ops.addSegment({ programId: pid, type: 'permit', title: UmrahCore_S(d.permitTitle).trim() || 'تصاريح / نسك', start: p.departureDate, end: p.departureDate, sequence: seq++, supplierId: d.permitSupplierId, deadline: UmrahCore_dateAdd(p.departureDate, -7) }, true);
                UmrahCore_Cost.add({ programId: pid, category: 'permit', description: `${UmrahCore_S(d.permitTitle).trim() || 'تصاريح / نسك'} لكل حاج مؤكد`, amount: d.permitCost, currency: pc, fxToBase: this.ensureRate(pc, p.departureDate, d.permitFxRate), mode: 'perPax', supplierId: d.permitSupplierId, procurementPolicy: 'perConfirmedPax', actualizationPolicy: 'onPermitIssued' }, true);
            } const liveP = UmrahCore_Ops.program(pid); if (!liveP)
                throw new Error('تعذر تثبيت البرنامج بعد تجميع بياناته'); if (!liveP.defaultTreasuryId) {
                const t = UmrahCore_Bridge.preferredTreasury(liveP.currency);
                if (t)
                    liveP.defaultTreasuryId = t.id;
            } return { programId: liveP.id, programNo: liveP.no, reused: false }; }, { save: false, render: false });
        let liveP = UmrahCore_Ops.program(saved.programId);
        if (!liveP)
            throw new Error('البرنامج غير موجود بعد الحفظ');
        // Draft-first workflow: creating a program must not silently open sales.
        // Readiness is reviewed first; opening sale is an explicit approved action.
        if (!saved.reused)
            await UmrahCore_DB.save(false);
        UmrahCore_DB.data.uiState.programWizard = null;
        UmrahCore_DB.data.uiState.programWorkspace = liveP.id;
        (UmrahCore_State as any).programWorkspace = liveP.id;
        await UmrahCore_DB.saveUiState();
        const opened = liveP.status === 'open';
        UmrahCore_UI.toast(opened
            ? `البرنامج ${liveP.no} موجود ومفتوح للبيع`
            : `تم إنشاء ${liveP.no} كمسودة جاهزة للمراجعة؛ افتح البيع بعد اكتمال قائمة الجاهزية`);
        UmrahCore_UI.openPage('program-workspace');
        return { liveId: liveP.id, liveNo: liveP.no, opened, reused: !!saved.reused };
    }
    catch (e) {
        if (saved?.programId) {
            const p = UmrahCore_Ops.program(saved.programId);
            UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) };
            UmrahCore_UI.toast(`البرنامج ${p?.no || saved.programNo} محفوظ، لكن تعذر إكمال فتحه للبيع: ${e.message}`);
            return { savedId: p?.id || saved.programId, savedNo: p?.no || saved.programNo, opened: false, error: e.message };
        }
        UmrahCore_UI.toast(`تعذر إنشاء البرنامج: ${e.message}`);
        return null;
    } }
};
export { ProgramWizard_Finish };
