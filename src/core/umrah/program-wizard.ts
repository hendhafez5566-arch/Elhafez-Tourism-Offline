import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_deep, UmrahCore_iid, UmrahCore_roomCap, UmrahCore_today, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_SmartGuide } from './guided';
import { UmrahCore_Ops, UmrahCore_UI } from '../late-bindings';
import { __set_UmrahCore_ProgramWizard } from '../late-bindings';
import { ProgramWizard_Validation } from './program-wizard-validation';
import { ProgramWizard_Finish } from './program-wizard-finish';
const UmrahCore_ProgramWizard: any = {
    step: 1,
    maxStep: 1,
    data: {},
    busy: false,
    lastError: '',
    _saveTimer: null,
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
    } return this.newDraft(true); },
    newDraft(force = false) { const saved = UmrahCore_DB.data.uiState?.programWizard; if (saved?.data?.creationToken && !force && !confirm('بدء برنامج جديد سيحذف مسودة البرنامج الحالية. هل تريد المتابعة؟'))
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
    hotelAmount(st) { return Object.values(st.rooms as Record<string, any>).reduce((z: number, v) => z + UmrahCore_N(v.qty) * UmrahCore_N(v.rate), 0) * UmrahCore_N(st.nights); },
    ...ProgramWizard_Validation,
    ...ProgramWizard_Finish
};
__set_UmrahCore_ProgramWizard(UmrahCore_ProgramWizard);
export { UmrahCore_ProgramWizard };
