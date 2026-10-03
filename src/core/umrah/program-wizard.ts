import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_deep, UmrahCore_iid, UmrahCore_money, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_today, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Bridge, UmrahCore_Cost, UmrahCore_DB } from './data';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_SmartGuide } from './guided';
import { UmrahCore_Ops, UmrahCore_State, UmrahCore_UI } from '../late-bindings';
import { __set_UmrahCore_ProgramWizard } from '../late-bindings';
const UmrahCore_ProgramWizard: any = {
    step: 1, maxStep: 1, data: {}, busy: false, lastError: '', _saveTimer: null,
    defaults() { const cur = UmrahCore_DB.data.settings.defaultCurrency, dep = UmrahCore_today(), ret = UmrahCore_dateAdd(dep, 9), t = UmrahCore_Bridge.preferredTreasury(cur); return { creationToken: UmrahCore_iid(), programType: 'umrah', name: '', groupNo: '', groupDescription: '', seasonId: UmrahCore_Ops.scoped('seasons').find(x => x.status === 'open')?.id || '', departureDate: dep, returnDate: ret, capacity: 45, currency: cur, fxRate: UmrahCore_Bridge.rate(cur, dep) || 1, defaultTreasuryId: t?.id || '', holdHours: UmrahCore_DB.data.settings.holdHours, depositMin: 0, profitMode: 'percent', marginPct: UmrahCore_N(UmrahCore_DB.data.settings.defaultMarginPct) || 15, fixedProfit: 0, allowLossPricing: 'no', stay1Source: 'existing', stay1ContractId: '', stay1City: 'Makkah', stay1Label: 'مكة', stay1Hotel: '', stay1SupplierId: '', stay1Currency: cur, stay1FxRate: UmrahCore_Bridge.rate(cur, dep) || 1, stay1Nights: 5, stay1SingleQty: 0, stay1SingleRate: 0, stay1DoubleQty: 0, stay1DoubleRate: 0, stay1TripleQty: 0, stay1TripleRate: 0, stay1QuadQty: 0, stay1QuadRate: 0, stay1QuintQty: 0, stay1QuintRate: 0, stay2Source: 'existing', stay2ContractId: '', stay2City: 'Madinah', stay2Label: 'المدينة', stay2Hotel: '', stay2SupplierId: '', stay2Currency: cur, stay2FxRate: UmrahCore_Bridge.rate(cur, dep) || 1, stay2Nights: 4, stay2SingleQty: 0, stay2SingleRate: 0, stay2DoubleQty: 0, stay2DoubleRate: 0, stay2TripleQty: 0, stay2TripleRate: 0, stay2QuadQty: 0, stay2QuadRate: 0, stay2QuintQty: 0, stay2QuintRate: 0, stay3Source: 'existing', stay3ContractId: '', stay3City: '', stay3Label: 'إقامة إضافية', stay3Hotel: '', stay3SupplierId: '', stay3Currency: cur, stay3FxRate: UmrahCore_Bridge.rate(cur, dep) || 1, stay3Nights: 0, stay3SingleQty: 0, stay3SingleRate: 0, stay3DoubleQty: 0, stay3DoubleRate: 0, stay3TripleQty: 0, stay3TripleRate: 0, stay3QuadQty: 0, stay3QuadRate: 0, stay3QuintQty: 0, stay3QuintRate: 0, flightSource: 'existing', flightContractId: '', flightDatesAuto: true, airline: '', flightSupplierId: '', flightCurrency: cur, flightFxRate: UmrahCore_Bridge.rate(cur, dep) || 1, outFlight: '', outFrom: 'CAI', outTo: 'JED', outDateTime: `${dep}T06:00`, returnFlight: '', returnFrom: 'MED', returnTo: 'CAI', returnDateTime: `${ret}T18:00`, seats: 45, costPerSeat: 0, flightPolicy: 'block', transportSource: 'existing', transportContractId: '', transportProvider: '', transportSupplierId: '', transportCurrency: cur, transportFxRate: UmrahCore_Bridge.rate(cur, dep) || 1, vehicles: 1, vehicleType: 'bus', busCapacity: 50, transportRoute: 'مطار الوصول → مكة → المدينة → مطار المغادرة', transportCost: 0, visaSource: 'existing', visaContractId: '', visaServiceName: 'تأشيرة', visaSupplierId: '', visaCurrency: cur, visaFxRate: UmrahCore_Bridge.rate(cur, dep) || 1, visaCost: 0, campTitle: 'مخيم المشاعر', campSupplierId: '', campCurrency: cur, campFxRate: UmrahCore_Bridge.rate(cur, dep) || 1, campCost: 0, permitTitle: 'تصاريح / نسك', permitSupplierId: '', permitCurrency: cur, permitFxRate: UmrahCore_Bridge.rate(cur, dep) || 1, permitCost: 0, priceSingle: 0, priceDouble: 0, priceTriple: 0, priceQuad: 0, priceQuint: 0, childBed: 0, childNoBed: 0, infant: 0 }; },
    normalize() { const d = this.data || {}; if (d.makkahHotel && !d.stay1Hotel) {
        Object.assign(d, { stay1City: 'Makkah', stay1Label: 'مكة', stay1Hotel: d.makkahHotel, stay1SupplierId: d.makkahSupplierId, stay1Currency: d.makkahCurrency, stay1Nights: d.makkahNights, stay1DoubleQty: d.makkahDoubleQty, stay1DoubleRate: d.makkahDoubleRate, stay1TripleQty: d.makkahTripleQty, stay1TripleRate: d.makkahTripleRate, stay1QuadQty: d.makkahQuadQty, stay1QuadRate: d.makkahQuadRate });
    } if (d.madinahHotel && !d.stay2Hotel) {
        Object.assign(d, { stay2City: 'Madinah', stay2Label: 'المدينة', stay2Hotel: d.madinahHotel, stay2SupplierId: d.madinahSupplierId, stay2Currency: d.madinahCurrency, stay2Nights: d.madinahNights, stay2DoubleQty: d.madinahDoubleQty, stay2DoubleRate: d.madinahDoubleRate, stay2TripleQty: d.madinahTripleQty, stay2TripleRate: d.madinahTripleRate, stay2QuadQty: d.madinahQuadQty, stay2QuadRate: d.madinahQuadRate });
    } this.data = { ...this.defaults(), ...d, creationToken: d.creationToken || UmrahCore_iid() }; if (this.data.flightDatesAuto !== false && !this.data.flightContractId)
        this.alignFlightDates(false); return this.data; },
    alignFlightDates(force = false) { const d = this.data || {}; if (!force && d.flightDatesAuto === false)
        return d; if (!d.departureDate || !d.returnDate)
        return d; const outTime = UmrahCore_S(d.outDateTime).includes('T') ? UmrahCore_S(d.outDateTime).split('T')[1] || '06:00' : '06:00', returnTime = UmrahCore_S(d.returnDateTime).includes('T') ? UmrahCore_S(d.returnDateTime).split('T')[1] || '18:00' : '18:00'; d.outDateTime = `${d.departureDate}T${outTime}`; d.returnDateTime = `${d.returnDate}T${returnTime}`; d.flightDatesAuto = true; return d; },
    flightDateTouched() { this.data.flightDatesAuto = false; },
    start() { const saved = UmrahCore_DB.data.uiState?.programWizard; if (saved?.data?.creationToken) {
        clearTimeout(this._saveTimer);
        this.step = Math.max(1, UmrahCore_N(saved.step) || 1);
        this.maxStep = Math.max(this.step, UmrahCore_N(saved.maxStep) || this.step);
        this.busy = false;
        this.lastError = '';
        this.data = UmrahCore_deep(saved.data);
        this.normalize();
        UmrahCore_UI.openPage('guided-program');
        UmrahCore_UI.toast('تم استكمال مسودة البرنامج المحفوظة');
        return true;
    } return this.newDraft(true); }, newDraft(force = false) { const saved = UmrahCore_DB.data.uiState?.programWizard; if (saved?.data?.creationToken && !force && !confirm('بدء برنامج جديد سيحذف مسودة البرنامج الحالية. هل تريد المتابعة؟'))
        return false; clearTimeout(this._saveTimer); this.step = 1; this.maxStep = 1; this.busy = false; this.lastError = ''; this.data = this.defaults(); UmrahCore_DB.data.uiState = UmrahCore_DB.data.uiState || {}; UmrahCore_DB.data.uiState.programWizard = { step: 1, maxStep: 1, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); if (UmrahCore_UI.current === 'guided-program')
        UmrahCore_UI.render();
    else
        UmrahCore_UI.openPage('guided-program'); return true; },
    capture(persist = true) { const f = document.getElementById('programWizardForm') as HTMLFormElement | null; if (f) {
        const o = Object.fromEntries(new FormData(f));
        Object.assign(this.data, o);
        const nums = ['capacity', 'holdHours', 'depositMin', 'fxRate', 'marginPct', 'fixedProfit', 'seats', 'costPerSeat', 'vehicles', 'busCapacity', 'transportCost', 'visaCost', 'campCost', 'permitCost', 'flightFxRate', 'transportFxRate', 'visaFxRate', 'campFxRate', 'permitFxRate', 'priceSingle', 'priceDouble', 'priceTriple', 'priceQuad', 'priceQuint', 'childBed', 'childNoBed', 'infant'];
        for (const i of [1, 2, 3])
            for (const k of ['Nights', 'FxRate', 'SingleQty', 'SingleRate', 'DoubleQty', 'DoubleRate', 'TripleQty', 'TripleRate', 'QuadQty', 'QuadRate', 'QuintQty', 'QuintRate'])
                nums.push(`stay${i}${k}`);
        for (const k of nums)
            if (o[k] != null)
                this.data[k] = Math.max(0, UmrahCore_N(o[k]));
        if (this.step === 6)
            this.data.allowLossPricing = o.allowLossPricing === 'yes' ? 'yes' : 'no';
    } this.normalize(); UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; if (persist)
        UmrahCore_DB.saveUiState(); return this.data; },
    queueCapture() { this.capture(false); clearTimeout(this._saveTimer); this._saveTimer = setTimeout(() => { UmrahCore_DB.saveUiState(); }, 1400); this.refreshAssistant(); },
    flushCapture() { clearTimeout(this._saveTimer); this.capture(false); UmrahCore_DB.saveUiState(); },
    refreshAssistant() { const el = document.getElementById('programAiGuide'); if (el)
        el.innerHTML = UmrahCore_SmartGuide.programWizard(this.step, this.data); },
    setBusy(on) { this.busy = !!on; const b = document.getElementById('programWizardNext') as HTMLButtonElement | null; if (b) {
        b.disabled = !!on;
        b.innerHTML = on ? '<span class="wizard-inline-status">جاري التحقق</span>' : 'التالي';
    } const form = document.getElementById('programWizardForm'); form?.classList.toggle('wizard-busy', !!on); },
    autoAssist() { this.capture(false); const d = this.data, base = UmrahCore_Bridge.baseCurrency(); if (this.step === 1) {
        if (!d.seasonId)
            d.seasonId = UmrahCore_Ops.scoped('seasons').find(x => x.status === 'open')?.id || d.seasonId;
        if (!d.defaultTreasuryId)
            d.defaultTreasuryId = UmrahCore_Bridge.preferredTreasury(d.currency)?.id || '';
        if (d.currency === base)
            d.fxRate = 1;
        else if (!(UmrahCore_N(d.fxRate) > 0))
            d.fxRate = UmrahCore_Bridge.rate(d.currency, d.departureDate) || 0;
    }
    else if (this.step === 2 && !UmrahCore_S(d.stay1Hotel).trim()) {
        const m = this.hotelMatches('stay1')[0];
        if (m) {
            this.applyHotelContract('stay1', m.c.id);
            return;
        }
    }
    else if (this.step === 3) {
        const target = Math.max(0, UmrahCore_daysBetween(d.departureDate, d.returnDate)), s1 = Math.max(0, UmrahCore_N(d.stay1Nights)), s2 = Math.max(0, UmrahCore_N(d.stay2Nights));
        if (!UmrahCore_S(d.stay2Hotel).trim()) {
            const m = this.hotelMatches('stay2')[0];
            if (m) {
                this.applyHotelContract('stay2', m.c.id);
                return;
            }
        }
        if (UmrahCore_S(d.stay2Hotel).trim() && s1 + s2 < target)
            d.stay2Nights = Math.max(1, target - s1);
    }
    else if (this.step === 4 && !UmrahCore_S(d.airline).trim()) {
        const m = UmrahCore_ContractCenter.matchFlights(d.departureDate, d.returnDate, UmrahCore_N(d.capacity))[0];
        if (m) {
            this.applyFlightContract(m.c.id);
            return;
        }
    }
    else if (this.step === 4) {
        d.seats = Math.max(UmrahCore_N(d.capacity), UmrahCore_N(d.seats) || 0);
        if (!d.outDateTime)
            d.outDateTime = `${d.departureDate}T06:00`;
        if (!d.returnDateTime)
            d.returnDateTime = `${d.returnDate}T18:00`;
    }
    else if (this.step === 5 && !UmrahCore_S(d.transportProvider).trim()) {
        const m = UmrahCore_ContractCenter.matchTransports(d.departureDate, d.returnDate, UmrahCore_N(d.capacity))[0];
        if (m) {
            this.applyTransportContract(m.c.id);
            return;
        }
    }
    else if (this.step === 5 && UmrahCore_S(d.transportProvider).trim()) {
        d.busCapacity = UmrahCore_vehicleCaps[d.vehicleType] || Math.max(1, UmrahCore_N(d.busCapacity) || 50);
        d.vehicles = Math.max(1, Math.ceil(UmrahCore_N(d.capacity) / d.busCapacity));
    }
    else if (this.step === 6) {
        this.suggestPrices();
        return;
    } UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(d) }; UmrahCore_DB.saveUiState(); this.lastError = ''; UmrahCore_UI.render(); UmrahCore_UI.toast('تم تطبيق الاقتراحات الآمنة للخطوة الحالية'); },
    stays() { const d = this.normalize(), out = []; for (const i of [1, 2, 3]) {
        const pref = `stay${i}`, hotel = UmrahCore_S(d[pref + 'Hotel']).trim();
        if (!hotel)
            continue;
        out.push({ pref, index: i, source: d[pref + 'Source'] || 'smart', contractId: d[pref + 'ContractId'] || '', hotel, city: UmrahCore_S(d[pref + 'City']).trim() || 'Other', label: UmrahCore_S(d[pref + 'Label']).trim() || UmrahCore_S(d[pref + 'City']).trim() || `إقامة ${i}`, supplierId: d[pref + 'SupplierId'] || '', currency: d[pref + 'Currency'] || d.currency, fxRate: UmrahCore_N(d[pref + 'FxRate']), nights: Math.max(1, UmrahCore_N(d[pref + 'Nights'])), rooms: { single: { qty: UmrahCore_N(d[pref + 'SingleQty']), rate: UmrahCore_N(d[pref + 'SingleRate']) }, double: { qty: UmrahCore_N(d[pref + 'DoubleQty']), rate: UmrahCore_N(d[pref + 'DoubleRate']) }, triple: { qty: UmrahCore_N(d[pref + 'TripleQty']), rate: UmrahCore_N(d[pref + 'TripleRate']) }, quad: { qty: UmrahCore_N(d[pref + 'QuadQty']), rate: UmrahCore_N(d[pref + 'QuadRate']) }, quint: { qty: UmrahCore_N(d[pref + 'QuintQty']), rate: UmrahCore_N(d[pref + 'QuintRate']) } } });
    } return out; },
    ensureRate(currency, date, inlineRate = 0) { currency = UmrahCore_S(currency || this.data.currency).toUpperCase(); if (currency === UmrahCore_Bridge.baseCurrency())
        return 1; if (UmrahCore_N(inlineRate) > 0)
        UmrahCore_Bridge.setRate(currency, UmrahCore_N(inlineRate), date); const r = UmrahCore_Bridge.rate(currency, date); if (!(r > 0))
        throw new Error(`لا يوجد سعر صرف لـ ${currency}. أدخله في نفس الخطوة أو أضف العملة من هنا.`); return r; },
    inlineRate(currencyField, rateField) { this.capture(); const c = this.data[currencyField] || this.data.currency, r = UmrahCore_N(this.data[rateField]); if (c === UmrahCore_Bridge.baseCurrency())
        return UmrahCore_UI.toast('هذه هي العملة الأساسية'); if (!(r > 0))
        return UmrahCore_UI.toast('أدخل سعر صرف صحيح'); UmrahCore_Bridge.setRate(c, r, this.data.departureDate || UmrahCore_today()); UmrahCore_UI.toast(`تم تثبيت سعر ${c}`); UmrahCore_UI.render(); },
    currencyChanged(code) { this.capture(); this.data.currency = code; this.data.fxRate = UmrahCore_Bridge.rate(code, this.data.departureDate || UmrahCore_today()) || 0; const t = UmrahCore_Bridge.preferredTreasury(code); this.data.defaultTreasuryId = t?.id || ''; for (const pref of ['stay1', 'stay2', 'stay3', 'flight', 'transport', 'visa', 'camp', 'permit'])
        if (!this.data[pref + 'Currency'] || this.data[pref + 'Currency'] === UmrahCore_DB.data.settings.defaultCurrency)
            this.data[pref + 'Currency'] = code; UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_UI.render(); },
    serviceCurrencyChanged(currencyField, rateField, code) { this.capture(); this.data[currencyField] = code; this.data[rateField] = UmrahCore_Bridge.rate(code, this.data.departureDate || UmrahCore_today()) || 0; UmrahCore_UI.render(); },
    supplierChanged(select, currencyField, rateField = '') { this.capture(); const sup = UmrahCore_Bridge.supplier(select.value), cur = sup?.currency; if (cur) {
        this.data[currencyField] = cur;
        if (rateField)
            this.data[rateField] = UmrahCore_Bridge.rate(cur, this.data.departureDate || UmrahCore_today()) || 0;
    } UmrahCore_UI.render(); },
    vehicleChanged(type) { this.capture(false); this.data.vehicleType = type; const suggested = UmrahCore_vehicleCaps[type] || 50; this.data.busCapacity = suggested; const cap = document.querySelector('#programWizardForm [name="busCapacity"]') as HTMLInputElement | null; if (cap)
        cap.value = suggested; UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; this.refreshAssistant(); },
    stayDates(index) { const d = this.normalize(); let start = d.departureDate; for (let i = 1; i < index; i++)
        if (UmrahCore_S(d[`stay${i}Hotel`]).trim())
            start = UmrahCore_dateAdd(start, Math.max(0, UmrahCore_N(d[`stay${i}Nights`]))); const nights = Math.max(1, UmrahCore_N(d[`stay${index}Nights`])); return { from: start, to: UmrahCore_dateAdd(start, nights) }; },
    hotelMatches(pref) { const idx = UmrahCore_N(pref.replace('stay', '')) || 1, dt = this.stayDates(idx), d = this.data; return UmrahCore_ContractCenter.matchHotels(d[pref + 'City'], dt.from, dt.to, UmrahCore_N(d.capacity)); },
    sourceChanged(sourceField, contractField, value) { clearTimeout(this._saveTimer); this.capture(false); this.data[sourceField] = value; if (value !== 'existing')
        this.data[contractField] = ''; if (sourceField === 'flightSource' && value !== 'existing') {
        this.data.flightDatesAuto = true;
        this.alignFlightDates(true);
    } UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); },
    applyHotelContract(pref, id) { clearTimeout(this._saveTimer); this.capture(false); const c = UmrahCore_ContractCenter.get('hotel', id); if (!c)
        return; try {
        UmrahCore_ContractCenter.assertReady('hotel', c);
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
        return;
    } const d = this.data, idx = UmrahCore_N(pref.replace('stay', '')) || 1, dt = this.stayDates(idx), alloc = UmrahCore_ContractCenter.suggestHotelAllocation(id, UmrahCore_N(d.capacity), dt.from, dt.to), hotel = UmrahCore_S(c.hotelName || c.name || c.propertyName || c.hotel).trim(), city = UmrahCore_S(c.city || d[pref + 'City']).trim(); d[pref + 'Source'] = 'existing'; d[pref + 'ContractId'] = id; d[pref + 'Hotel'] = hotel; d[pref + 'City'] = city; d[pref + 'Label'] = UmrahCore_S(c.shortName || c.label || hotel || city || d[pref + 'Label']).trim(); d[pref + 'SupplierId'] = c.supplierId; d[pref + 'Currency'] = c.currency; d[pref + 'FxRate'] = UmrahCore_Bridge.rate(c.currency, d.departureDate) || 1; for (const t of Object.keys(UmrahCore_roomCap)) {
        const K = t[0].toUpperCase() + t.slice(1);
        d[pref + K + 'Qty'] = UmrahCore_N(alloc[t]);
        d[pref + K + 'Rate'] = UmrahCore_N(c.rooms?.[t]?.rate);
    } UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(d) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); UmrahCore_UI.toast(`تم تعبئة بيانات عقد ${c.contractNo} تلقائيًا. يمكنك تعديل بيانات البرنامج دون تغيير العقد الأصلي.`); },
    applyFlightContract(id) { clearTimeout(this._saveTimer); this.capture(false); const c = UmrahCore_ContractCenter.get('flight', id); if (!c)
        return; try {
        UmrahCore_ContractCenter.assertReady('flight', c);
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
        return;
    } const d = this.data, a = UmrahCore_ContractCenter.flightStats(id).available; Object.assign(d, { flightSource: 'existing', flightContractId: id, flightDatesAuto: false, airline: c.airline, flightSupplierId: c.supplierId, flightCurrency: c.currency, flightFxRate: UmrahCore_Bridge.rate(c.currency, d.departureDate) || 1, outFlight: c.outFlight, outFrom: c.outFrom, outTo: c.outTo, outDateTime: c.outDateTime, returnFlight: c.returnFlight, returnFrom: c.returnFrom, returnTo: c.returnTo, returnDateTime: c.returnDateTime, seats: Math.min(a, Math.max(UmrahCore_N(d.capacity), UmrahCore_N(d.seats) || UmrahCore_N(d.capacity))), costPerSeat: c.costPerSeat, flightPolicy: c.purchasePolicy || 'block' }); UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(d) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); UmrahCore_UI.toast(`تم تعبئة بلوك ${c.contractNo} تلقائيًا. كل البيانات قابلة للتعديل لهذا البرنامج فقط.`); },
    applyTransportContract(id) { clearTimeout(this._saveTimer); this.capture(false); const c = UmrahCore_ContractCenter.get('transport', id); if (!c)
        return; try {
        UmrahCore_ContractCenter.assertReady('transport', c);
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
        return;
    } const d = this.data, stats = UmrahCore_ContractCenter.transportStats(id, '', d.departureDate, UmrahCore_dateAdd(d.returnDate, 1)), need = Math.max(1, Math.ceil(UmrahCore_N(d.capacity) / Math.max(1, stats.capacityPerVehicle))), use = Math.min(stats.availableVehicles, need), costPerVehicle = UmrahCore_N(c.cost) / Math.max(1, UmrahCore_N(c.vehicles)); Object.assign(d, { transportSource: 'existing', transportContractId: id, transportProvider: c.provider, transportSupplierId: c.supplierId, transportCurrency: c.currency, transportFxRate: UmrahCore_Bridge.rate(c.currency, d.departureDate) || 1, vehicleType: c.vehicleType, busCapacity: UmrahCore_N(c.capacityPerVehicle) || stats.capacityPerVehicle, vehicles: use, transportRoute: c.route, transportCost: costPerVehicle * use }); UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(d) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); UmrahCore_UI.toast(`تم تعبئة عقد ${c.contractNo} تلقائيًا. يمكنك تعديل بيانات النقل للبرنامج مع بقاء حد المخزون من العقد.`); },
    applyVisaContract(id) { clearTimeout(this._saveTimer); this.capture(false); const c = UmrahCore_ContractCenter.get('visa', id); if (!c)
        return; try {
        UmrahCore_ContractCenter.assertReady('visa', c);
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
        return;
    } const d = this.data; Object.assign(d, { visaSource: 'existing', visaContractId: id, visaServiceName: c.serviceName || 'تأشيرة', visaSupplierId: c.supplierId, visaCurrency: c.currency, visaFxRate: UmrahCore_Bridge.rate(c.currency, d.departureDate) || 1, visaCost: UmrahCore_N(c.costPerVisa) }); UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(d) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); UmrahCore_UI.toast(`تم تعبئة اتفاقية ${c.contractNo} تلقائيًا. يمكنك تعديل بيانات التأشيرة لهذا البرنامج فقط.`); },
    roomCapacity(st) { return Object.entries(st.rooms as Record<string, any>).reduce((z, [k, v]) => z + UmrahCore_N(v.qty) * (UmrahCore_roomCap[k] || 0), 0); },
    hotelAmount(st) { return Object.values(st.rooms as Record<string, any>).reduce((z: number, v: any) => z + UmrahCore_N(v.qty) * UmrahCore_N(v.rate), 0) * UmrahCore_N(st.nights); },
    plan() { const d = this.normalize(), stays = this.stays(), base = UmrahCore_Bridge.baseCurrency(), rate = (c, r) => c === base ? 1 : (UmrahCore_N(r) || UmrahCore_Bridge.rate(c, d.departureDate)), baseCost = (a, c, r) => UmrahCore_N(a) * UmrahCore_N(rate(c, r)), cap = Math.max(1, UmrahCore_N(d.capacity)), hotelFixed = stays.reduce((z, st) => z + baseCost(this.hotelAmount(st), st.currency, st.fxRate), 0), flightTotalBase = d.flightPolicy === 'perPax' ? 0 : baseCost(UmrahCore_N(d.costPerSeat) * UmrahCore_N(d.seats), d.flightCurrency, d.flightFxRate), transportTotalBase = baseCost(d.transportCost, d.transportCurrency, d.transportFxRate), flightPerPaxBase = d.flightPolicy === 'perPax' ? baseCost(d.costPerSeat, d.flightCurrency, d.flightFxRate) : flightTotalBase / cap, transportPerPaxBase = transportTotalBase / cap, visaPerPaxBase = baseCost(d.visaCost, d.visaCurrency, d.visaFxRate), campPerPaxBase = d.programType === 'hajj' ? baseCost(d.campCost, d.campCurrency, d.campFxRate) : 0, permitPerPaxBase = d.programType === 'hajj' ? baseCost(d.permitCost, d.permitCurrency, d.permitFxRate) : 0, sharedPerPaxBase = flightPerPaxBase + transportPerPaxBase + visaPerPaxBase + campPerPaxBase + permitPerPaxBase, hotelAvgPerPax = hotelFixed / cap, costPerPax = hotelAvgPerPax + sharedPerPaxBase, profitMode = d.profitMode === 'fixed' ? 'fixed' : 'percent', marginPct = Math.max(0, UmrahCore_N(d.marginPct)), fixedProfit = Math.max(0, UmrahCore_N(d.fixedProfit)), marginRate = Math.min(99.9, marginPct) / 100, saleRate = Math.max(.0000001, UmrahCore_N(rate(d.currency, d.fxRate))), suggestSell = costBase => { if (!(costBase > 0))
        return 0; const costSell = d.currency === base ? costBase : costBase / saleRate; return profitMode === 'fixed' ? costSell + fixedProfit : costSell / Math.max(.001, 1 - marginRate); }, suggestedSell = suggestSell(costPerPax), roomCosts = {}, roomSuggestions = {}, roomEligible = {}; for (const [type, occ] of Object.entries(UmrahCore_roomCap)) {
        const eligible = stays.length > 0 && stays.every(st => UmrahCore_N(st.rooms[type]?.qty) > 0 && UmrahCore_N(st.rooms[type]?.rate) > 0);
        roomEligible[type] = eligible;
        let hotelTypeBase = 0;
        if (eligible)
            for (const st of stays)
                hotelTypeBase += baseCost((UmrahCore_N(st.rooms[type].rate) * UmrahCore_N(st.nights)) / occ, st.currency, st.fxRate);
        const typeCost = eligible ? hotelTypeBase + sharedPerPaxBase : 0;
        roomCosts[type] = typeCost;
        roomSuggestions[type] = eligible ? suggestSell(typeCost) : 0;
    } const commitments = []; for (const st of stays) {
        const total = this.hotelAmount(st);
        if (total > 0)
            commitments.push({ service: `إقامة ${st.label} — ${st.hotel}`, supplier: UmrahCore_Bridge.supplier(st.supplierId)?.name || '-', currency: st.currency, amount: total, policy: 'مسودة أمر شراء عند فتح البرنامج / اعتماد عند التحويل لفاتورة المورد' });
    } if (UmrahCore_N(d.costPerSeat) > 0)
        commitments.push({ service: `طيران ${d.airline || ''}`, supplier: UmrahCore_Bridge.supplier(d.flightSupplierId)?.name || '-', currency: d.flightCurrency, amount: d.flightPolicy === 'perPax' ? UmrahCore_N(d.costPerSeat) : UmrahCore_N(d.costPerSeat) * UmrahCore_N(d.seats), policy: d.flightPolicy === 'perPax' ? 'التزام بالحجز وتجميع فاتورة المورد عند اكتمال إصدار مسافري الحجز' : 'مسودة أمر شراء بلوك عند فتح البرنامج / اعتماد وفاتورة عند بدء السفر' }); if (UmrahCore_N(d.transportCost) > 0)
        commitments.push({ service: `النقل — ${d.transportProvider || ''}`, supplier: UmrahCore_Bridge.supplier(d.transportSupplierId)?.name || '-', currency: d.transportCurrency, amount: UmrahCore_N(d.transportCost), policy: 'مسودة أمر شراء عند فتح البرنامج / اعتماد عند التحويل لفاتورة المورد' }); if (UmrahCore_N(d.visaCost) > 0)
        commitments.push({ service: 'التأشيرات', supplier: UmrahCore_Bridge.supplier(d.visaSupplierId)?.name || '-', currency: d.visaCurrency, amount: UmrahCore_N(d.visaCost), policy: 'تكلفة للفرد وتتبع لكل مسافر / مستند مورد مجمع للحجز' }); if (d.programType === 'hajj' && UmrahCore_N(d.campCost) > 0)
        commitments.push({ service: d.campTitle || 'مخيم المشاعر', supplier: UmrahCore_Bridge.supplier(d.campSupplierId)?.name || '-', currency: d.campCurrency, amount: UmrahCore_N(d.campCost), policy: 'التزام لكل حاج مؤكد وربط بمورد الخدمة' }); if (d.programType === 'hajj' && UmrahCore_N(d.permitCost) > 0)
        commitments.push({ service: d.permitTitle || 'تصاريح / نسك', supplier: UmrahCore_Bridge.supplier(d.permitSupplierId)?.name || '-', currency: d.permitCurrency, amount: UmrahCore_N(d.permitCost), policy: 'التزام لكل حاج مؤكد وربط بمورد الخدمة' }); return { d, stays, base, costPerPax, suggestedSell, roomCosts, roomSuggestions, roomEligible, sharedPerPaxBase, profitMode, marginPct, fixedProfit, commitments, targetNights: Math.max(0, UmrahCore_daysBetween(d.departureDate, d.returnDate)), durationDays: Math.max(0, UmrahCore_daysBetween(d.departureDate, d.returnDate)) + 1, hotelNights: stays.reduce((z, x) => z + UmrahCore_N(x.nights), 0) }; },
    validateStep(step = this.step) { this.capture(false); const d = this.data, plan = this.plan(), errs = []; const rateOk = (c, r) => c === UmrahCore_Bridge.baseCurrency() || UmrahCore_N(r) > 0 || UmrahCore_Bridge.rate(c, d.departureDate) > 0; if (step === 1) {
        if (!UmrahCore_S(d.name).trim())
            errs.push('اكتب اسم البرنامج');
        if (!d.departureDate || !d.returnDate || d.returnDate <= d.departureDate)
            errs.push('راجع تاريخ السفر والعودة');
        if (!(UmrahCore_N(d.capacity) > 0))
            errs.push('أدخل سعة صحيحة');
        if (!rateOk(d.currency, d.fxRate))
            errs.push(`أدخل سعر صرف ${d.currency}`);
        if (!UmrahCore_Bridge.preferredTreasury(d.currency, d.defaultTreasuryId || ''))
            errs.push(`اختر خزنة/بنك تحصيل نشطًا بعملة ${d.currency}`);
    }
    else if (step === 2) {
        const st = plan.stays.find(x => x.index === 1);
        if (!st)
            errs.push('أدخل اسم الإقامة الأولى');
        else {
            if (!st.supplierId)
                errs.push('اختر مورد الإقامة الأولى');
            if (UmrahCore_N(st.nights) <= 0)
                errs.push('أدخل عدد الليالي');
            if (this.roomCapacity(st) < UmrahCore_N(d.capacity))
                errs.push(`سعة أسرّة الإقامة الأولى ${this.roomCapacity(st)} أقل من سعة البرنامج ${UmrahCore_N(d.capacity)}`);
            if (this.hotelAmount(st) <= 0)
                errs.push('أدخل مخزون الغرف وأسعار الإقامة الأولى');
            if (!rateOk(st.currency, st.fxRate))
                errs.push(`أدخل سعر صرف ${st.currency}`);
        }
    }
    else if (step === 3) {
        for (const st of plan.stays.filter(x => x.index > 1)) {
            if (!st.supplierId)
                errs.push(`اختر مورد ${st.hotel}`);
            if (this.roomCapacity(st) < UmrahCore_N(d.capacity))
                errs.push(`سعة أسرّة ${st.hotel} أقل من سعة البرنامج`);
            if (this.hotelAmount(st) <= 0)
                errs.push(`أكمل مخزون وتكلفة ${st.hotel}`);
            if (!rateOk(st.currency, st.fxRate))
                errs.push(`أدخل سعر صرف ${st.currency}`);
        }
        if (plan.hotelNights !== plan.targetNights)
            errs.push(`ليالي الإقامات ${plan.hotelNights} يجب أن تساوي ليالي البرنامج ${plan.targetNights}`);
    }
    else if (step === 4) {
        if (!UmrahCore_S(d.airline).trim())
            errs.push('أدخل شركة الطيران');
        if (!d.flightSupplierId)
            errs.push('اختر مورد الطيران');
        if (UmrahCore_N(d.seats) < UmrahCore_N(d.capacity))
            errs.push(`المقاعد ${UmrahCore_N(d.seats)} أقل من سعة البرنامج ${UmrahCore_N(d.capacity)}`);
        if (!d.outFlight || !d.returnFlight || !d.outFrom || !d.outTo || !d.returnFrom || !d.returnTo || !d.outDateTime || !d.returnDateTime)
            errs.push('أكمل بيانات رحلتي الذهاب والعودة');
        if (UmrahCore_N(d.costPerSeat) <= 0)
            errs.push('أدخل تكلفة المقعد');
        if (!rateOk(d.flightCurrency || d.currency, d.flightFxRate))
            errs.push(`أدخل سعر صرف ${d.flightCurrency || d.currency}`);
    }
    else if (step === 5) {
        if (UmrahCore_S(d.transportProvider).trim() || UmrahCore_N(d.transportCost) > 0) {
            if (!d.transportSupplierId)
                errs.push('اختر مورد النقل');
            if (!UmrahCore_S(d.transportRoute).trim())
                errs.push('أدخل مسار النقل');
            if ((UmrahCore_vehicleCaps[d.vehicleType] || UmrahCore_N(d.busCapacity)) !== UmrahCore_N(d.busCapacity))
                errs.push('سعة المركبة لا تطابق الحد الأقصى لنوع المركبة المختار');
            if (UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity) < UmrahCore_N(d.capacity))
                errs.push('سعة النقل أقل من سعة البرنامج');
            if (UmrahCore_N(d.transportCost) <= 0)
                errs.push('أدخل تكلفة النقل');
            if (!rateOk(d.transportCurrency || d.currency, d.transportFxRate))
                errs.push(`أدخل سعر صرف ${d.transportCurrency || d.currency}`);
        }
        if (d.visaSupplierId || UmrahCore_N(d.visaCost) > 0) {
            if (!d.visaSupplierId || UmrahCore_N(d.visaCost) <= 0)
                errs.push('أكمل مورد التأشيرات وتكلفة الفرد');
            if (!rateOk(d.visaCurrency || d.currency, d.visaFxRate))
                errs.push(`أدخل سعر صرف ${d.visaCurrency || d.currency}`);
        }
        if (d.programType === 'hajj') {
            for (const [label, supplier, cost, currency, fx] of [['خدمة المخيم/المشاعر', d.campSupplierId, d.campCost, d.campCurrency || d.currency, d.campFxRate], ['التصاريح/نسك', d.permitSupplierId, d.permitCost, d.permitCurrency || d.currency, d.permitFxRate]]) {
                if (!supplier || UmrahCore_N(cost) <= 0)
                    errs.push(`أكمل مورد وتكلفة ${label}`);
                if (!rateOk(currency, fx))
                    errs.push(`أدخل سعر صرف ${currency} لـ ${label}`);
            }
        }
    }
    else if (step === 6) {
        if (d.profitMode !== 'fixed' && UmrahCore_N(d.marginPct) >= 100)
            errs.push('هامش الربح يجب أن يكون أقل من 100%');
        if (d.profitMode === 'fixed' && UmrahCore_N(d.fixedProfit) < 0)
            errs.push('مبلغ الربح الثابت غير صحيح');
        if (errs.length)
            throw new Error(errs.join(' • '));
        this.preflight(true);
        return true;
    } if (errs.length)
        throw new Error(errs.join(' • ')); return true; },
    preflight(final = false) { this.capture(false); const p = this.plan(), d = p.d, errs = [], warn = []; if (!UmrahCore_S(d.name).trim())
        errs.push('اسم البرنامج مطلوب'); if (!d.departureDate || !d.returnDate || d.returnDate <= d.departureDate)
        errs.push('تاريخ السفر والعودة غير صحيح'); if (!d.seasonId)
        warn.push('البرنامج بدون موسم؛ يفضل إنشاء موسم وربطه قبل البيع'); if (!(UmrahCore_N(d.capacity) > 0))
        errs.push('سعة البرنامج غير صحيحة'); try {
        this.ensureRate(d.currency, d.departureDate, d.fxRate);
    }
    catch (e) {
        errs.push(e.message);
    } if (!UmrahCore_Bridge.preferredTreasury(d.currency, d.defaultTreasuryId || ''))
        errs.push(`لا توجد خزنة/بنك تحصيل نشط بعملة ${d.currency}`); if (!p.stays.length)
        errs.push('أضف إقامة فندقية واحدة على الأقل'); if (p.stays.length && p.hotelNights !== p.targetNights)
        errs.push(`مجموع ليالي الفنادق ${p.hotelNights} لا يساوي ليالي الرحلة ${p.targetNights}`); for (const st of p.stays) {
        if (!st.supplierId)
            errs.push(`اختر مورد ${st.hotel}`);
        if (this.roomCapacity(st) < UmrahCore_N(d.capacity))
            errs.push(`سعة أسرّة ${st.hotel} (${this.roomCapacity(st)}) أقل من سعة البرنامج (${d.capacity})`);
        if (this.hotelAmount(st) <= 0)
            errs.push(`تكلفة/مخزون ${st.hotel} غير مكتمل`);
        try {
            this.ensureRate(st.currency, d.departureDate, st.fxRate);
        }
        catch (e) {
            errs.push(`${st.hotel}: ${e.message}`);
        }
    } if (!UmrahCore_S(d.airline).trim())
        errs.push('شركة الطيران مطلوبة'); if (!d.flightSupplierId)
        errs.push('مورد الطيران مطلوب'); if (UmrahCore_N(d.seats) < UmrahCore_N(d.capacity))
        errs.push(`مقاعد الطيران (${UmrahCore_N(d.seats)}) أقل من سعة البرنامج (${UmrahCore_N(d.capacity)})`); if (!d.outFlight || !d.returnFlight || !d.outFrom || !d.outTo || !d.returnFrom || !d.returnTo || !d.outDateTime || !d.returnDateTime)
        errs.push('بيانات رحلتي الذهاب والعودة والمطارات والأوقات غير مكتملة'); if (UmrahCore_N(d.costPerSeat) <= 0)
        errs.push('تكلفة مقعد الطيران مطلوبة'); try {
        this.ensureRate(d.flightCurrency || d.currency, d.departureDate, d.flightFxRate);
    }
    catch (e) {
        errs.push(e.message);
    } if (UmrahCore_S(d.transportProvider).trim() || UmrahCore_N(d.transportCost) > 0) {
        if (!d.transportSupplierId)
            errs.push('مورد النقل مطلوب');
        if (!UmrahCore_S(d.transportRoute).trim())
            errs.push('مسار النقل مطلوب');
        if (!(UmrahCore_N(d.busCapacity) > 0))
            errs.push('سعة المركبة يجب أن تكون أكبر من صفر');
        if (UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity) < UmrahCore_N(d.capacity))
            errs.push(`سعة النقل (${UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity)}) أقل من سعة البرنامج (${d.capacity})`);
        if (UmrahCore_N(d.transportCost) <= 0)
            errs.push('تكلفة النقل مطلوبة');
        try {
            this.ensureRate(d.transportCurrency || d.currency, d.departureDate, d.transportFxRate);
        }
        catch (e) {
            errs.push(e.message);
        }
    } if (d.visaSupplierId || UmrahCore_N(d.visaCost) > 0) {
        if (!d.visaSupplierId || UmrahCore_N(d.visaCost) <= 0)
            errs.push('مورد التأشيرات وتكلفة الفرد مطلوبان معًا');
        try {
            this.ensureRate(d.visaCurrency || d.currency, d.departureDate, d.visaFxRate);
        }
        catch (e) {
            errs.push(e.message);
        }
    } if (d.programType === 'hajj') {
        for (const [label, supplier, cost, currency, fx] of [['خدمة المخيم/المشاعر', d.campSupplierId, d.campCost, d.campCurrency || d.currency, d.campFxRate], ['التصاريح/نسك', d.permitSupplierId, d.permitCost, d.permitCurrency || d.currency, d.permitFxRate]]) {
            if (!supplier || UmrahCore_N(cost) <= 0)
                errs.push(`مورد وتكلفة ${label} مطلوبان لبرنامج الحج`);
            try {
                this.ensureRate(currency, d.departureDate, fx);
            }
            catch (e) {
                errs.push(`${label}: ${e.message}`);
            }
        }
    } for (const st of p.stays) {
        const src = st.source === 'smart' ? 'existing' : (st.source || 'existing');
        if (src === 'existing' && !st.contractId)
            errs.push(`اختر عقدًا متاحًا لـ ${st.label} أو غيّر المصدر إلى شراء مباشر / إنشاء تعاقد`);
    } if ((d.flightSource === 'smart' || !d.flightSource || d.flightSource === 'existing') && !d.flightContractId)
        errs.push('اختر بلوك طيران متاحًا أو غيّر المصدر إلى شراء مباشر / إنشاء بلوك'); if ((UmrahCore_S(d.transportProvider).trim() || UmrahCore_N(d.transportCost) > 0) && (d.transportSource === 'smart' || !d.transportSource || d.transportSource === 'existing') && !d.transportContractId)
        errs.push('اختر عقد نقل متاحًا أو غيّر المصدر إلى شراء مباشر / إنشاء عقد'); if ((d.visaSupplierId || UmrahCore_N(d.visaCost) > 0) && (d.visaSource === 'smart' || !d.visaSource || d.visaSource === 'existing') && !d.visaContractId)
        errs.push('اختر اتفاقية تأشيرات متاحة أو غيّر المصدر إلى شراء مباشر / إنشاء اتفاقية'); for (const st of p.stays)
        if (st.contractId) {
            try {
                const dt = this.stayDates(st.index);
                UmrahCore_ContractCenter.assertHotel(st.contractId, Object.fromEntries(Object.entries(st.rooms as Record<string, any>).map(([k, v]) => [k, UmrahCore_N(v.qty)])), dt.from, dt.to);
            }
            catch (e) {
                errs.push(e.message);
            }
        } if (d.flightContractId) {
        try {
            UmrahCore_ContractCenter.assertFlight(d.flightContractId, d.seats);
        }
        catch (e) {
            errs.push(e.message);
        }
    } if (d.transportContractId) {
        try {
            UmrahCore_ContractCenter.assertTransport(d.transportContractId, d.vehicles, '', d.departureDate, UmrahCore_dateAdd(d.returnDate, 1));
        }
        catch (e) {
            errs.push(e.message);
        }
    } if (d.visaContractId) {
        try {
            UmrahCore_ContractCenter.assertVisa(d.visaContractId, UmrahCore_N(d.capacity));
        }
        catch (e) {
            errs.push(e.message);
        }
    } if (final) {
        if (d.profitMode !== 'fixed' && UmrahCore_N(d.marginPct) >= 100)
            errs.push('هامش الربح يجب أن يكون أقل من 100%');
        const defs = [['priceSingle', 'single'], ['priceDouble', 'double'], ['priceTriple', 'triple'], ['priceQuad', 'quad'], ['priceQuint', 'quint']], entered = defs.filter(([k]) => UmrahCore_N(d[k]) > 0);
        if (!entered.length)
            errs.push('أدخل سعر بيع واحدًا على الأقل للبالغ');
        const losses = entered.filter(([k, t]) => { const cost = UmrahCore_N(p.roomCosts?.[t]) || UmrahCore_N(p.costPerPax); return UmrahCore_Bridge.convert(UmrahCore_N(d[k]), d.currency, p.base, d.departureDate) + 0.01 < cost; });
        if (losses.length && d.allowLossPricing !== 'yes')
            errs.push(`يوجد سعر بيع أقل من تكلفته الفعلية في: ${losses.map(([, t]) => UmrahCore_roomLabel(t)).join('، ')}. راجع التسعير أو فعّل السماح بالبيع بخسارة عمدًا.`);
    } if (errs.length)
        throw new Error(errs.join(' • ')); return { ...p, warnings: warn }; },
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
    } (UmrahCore_UI as any).pushLocation({ page: 'guided-program', programWizard: { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) } }); this.step--; UmrahCore_DB.data.uiState.programWizard = { step: this.step, maxStep: this.maxStep, data: UmrahCore_deep(this.data) }; UmrahCore_DB.saveUiState(); UmrahCore_UI.render(); }, jumpTo(step) { step = Math.max(1, Math.min(6, UmrahCore_N(step))); if (step === this.step)
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
    } },
};
__set_UmrahCore_ProgramWizard(UmrahCore_ProgramWizard);
export { UmrahCore_ProgramWizard };
