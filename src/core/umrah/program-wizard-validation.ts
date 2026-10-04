import { UmrahCore_N, UmrahCore_S, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Bridge } from './data';
import { UmrahCore_ContractCenter } from './contracts';
const ProgramWizard_Validation = {
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
        throw new Error(errs.join(' • ')); return { ...p, warnings: warn }; }
};
export { ProgramWizard_Validation };
