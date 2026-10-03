import { UmrahCore_N, UmrahCore_S, UmrahCore_daysBetween, UmrahCore_deep, UmrahCore_esc, UmrahCore_money, UmrahCore_monthsAdd, UmrahCore_programDisplay, UmrahCore_programTypeLabel, UmrahCore_roomLabel, UmrahCore_today, UmrahCore_travelerTitle } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Actions, UmrahCore_Forms, UmrahCore_Ops, UmrahCore_ProgramWizard, UmrahCore_State, UmrahCore_UI, UmrahCore_currencyOptions, UmrahCore_fxLabel, UmrahCore_treasuryOptions } from '../late-bindings';
import { __set_UmrahCore_Guided, __set_UmrahCore_QuickCreate, __set_UmrahCore_Wizard } from '../late-bindings';
const UmrahCore_QuickCreate: any = {
    type: '', target: '', currency: '', open(type, target = '', currency = '') { this.type = type; this.target = target; this.currency = currency || ''; const m = document.getElementById('quickModal'), title = document.getElementById('quickTitle'), sub = document.getElementById('quickSub'), body = document.getElementById('quickBody'); if (type === 'customer') {
        title.textContent = 'عميل جديد';
        sub.textContent = 'سيُسجل في سجل العملاء المركزي ويُستخدم في الحجز فورًا';
        body.innerHTML = `<div class="form-grid"><div class="field"><label>اسم العميل</label><input name="name" required autofocus></div><div class="field"><label>الهاتف</label><input name="phone" type="tel"></div><div class="field"><label>رقم الجواز — اختياري</label><input name="passport"></div><div class="field"><label>الجنسية</label><input name="nationality"></div></div>`;
    }
    else if (type === 'supplier') {
        title.textContent = 'مورد جديد';
        sub.textContent = 'سيُسجل في سجل الموردين المركزي ويظهر داخل البرنامج فورًا';
        body.innerHTML = `<div class="form-grid"><div class="field"><label>اسم المورد</label><input name="name" required autofocus></div><div class="field"><label>نوع المورد</label><select name="type"><option>فنادق</option><option>طيران</option><option>نقل</option><option>تأشيرات</option><option>أخرى</option></select></div><div class="field"><label>الهاتف</label><input name="phone" type="tel"></div><div class="field"><label>عملة التعامل</label><select name="currency">${UmrahCore_currencyOptions(currency || UmrahCore_DB.data.settings.defaultCurrency)}</select></div></div>`;
    }
    else if (type === 'treasury') {
        title.textContent = 'إنشاء خزنة/حساب تشغيل';
        sub.textContent = 'تُنشأ في الخزينة المركزية بنفس العملة بدون مغادرة القسم';
        body.innerHTML = `<div class="form-grid"><div class="field"><label>الاسم</label><input name="name" value="خزنة ${UmrahCore_esc(currency)}" required autofocus></div><div class="field"><label>النوع</label><select name="type"><option value="cash">خزنة نقدية</option><option value="bank">حساب بنكي</option></select></div><div class="field"><label>العملة</label><input name="currency" value="${UmrahCore_esc(currency)}" readonly></div></div>`;
    }
    else if (type === 'currency') {
        title.textContent = 'عملة جديدة';
        sub.textContent = 'ستُضاف إلى العملات المركزية ويُثبت سعرها من نفس الخطوة';
        body.innerHTML = `<div class="form-grid"><div class="field"><label>كود العملة</label><input name="code" maxlength="5" placeholder="SAR" required autofocus></div><div class="field"><label>اسم العملة</label><input name="name" required></div><div class="field"><label>الرمز</label><input name="symbol"></div><div class="field"><label>عدد الكسور</label><input name="decimals" type="number" min="0" max="6" value="2"></div><div class="field"><label>سعرها مقابل ${UmrahCore_Bridge.baseCurrency()}</label><input name="rate" type="number" min="0" step="0.0001" required></div><div class="field"><label>تاريخ السعر</label><input name="date" type="date" value="${UmrahCore_today()}"></div></div>`;
    }
    else if (type === 'season') {
        title.textContent = 'موسم جديد';
        sub.textContent = 'يُنشأ داخل قسم الحج والعمرة ويُختار في البرنامج فورًا';
        body.innerHTML = `<div class="form-grid"><div class="field"><label>اسم الموسم</label><input name="name" required autofocus></div><div class="field"><label>السنة الهجرية</label><input name="hijri"></div><div class="field"><label>من</label><input name="from" type="date" value="${UmrahCore_today()}"></div><div class="field"><label>إلى</label><input name="to" type="date" value="${UmrahCore_monthsAdd(UmrahCore_today(), 8)}"></div></div>`;
    } const form = document.getElementById('quickForm') as HTMLFormElement | null; if (form)
        form.onsubmit = e => this.submit(e); m.classList.add('show'); },
    close() { document.getElementById('quickModal')?.classList.remove('show'); (document.getElementById('quickForm') as HTMLFormElement | null)?.reset(); },
    apply(x) { const el = this.target ? document.querySelector(`[name="${CSS.escape(this.target)}"]`) as HTMLInputElement | HTMLSelectElement | null : null; if (!el || !x)
        return; const value = this.type === 'currency' ? (x.code || x.id) : x.id, label = this.type === 'currency' ? `${x.code} — ${x.name || ''}` : `${x.no ? x.no + ' — ' : ''}${x.name || x.hotelName || x.title || ''}`; if (el.tagName === 'SELECT') {
        const select = el as HTMLSelectElement; let op = [...select.options].find(o => o.value === value);
        if (!op) {
            op = document.createElement('option');
            op.value = value;
            op.textContent = label;
            select.appendChild(op);
        }
        el.value = value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    else
        el.value = value || ''; },
    async submit(e) { e.preventDefault(); try {
        const o = Object.fromEntries(new FormData(e.target as HTMLFormElement)), type = this.type;
        const x = await UmrahCore_DB.atomicAsync('quickCreate', async () => { let item; if (type === 'customer')
            item = UmrahCore_Bridge.createCustomer(o);
        else if (type === 'supplier')
            item = UmrahCore_Bridge.createSupplier(o);
        else if (type === 'treasury')
            item = UmrahCore_Bridge.createTreasury({ ...o, opening: 0, date: UmrahCore_today() });
        else if (type === 'currency')
            item = UmrahCore_Bridge.createCurrency(o);
        else if (type === 'season')
            item = UmrahCore_Ops.addSeason({ ...o, status: 'open' });
        else
            throw new Error('نوع الإضافة غير معروف'); this.apply(item); if (type === 'currency' && UmrahCore_UI.current === 'guided-program')
            UmrahCore_ProgramWizard.capture(); return item; }, { save: true, render: false });
        this.close();
        if (type === 'currency' && UmrahCore_UI.current === 'guided-program')
            UmrahCore_UI.render();
        UmrahCore_UI.toast('تم الإنشاء والاختيار تلقائيًا');
        return x;
    }
    catch (err) {
        UmrahCore_UI.toast(err.message || 'تعذر الإنشاء');
    } }
};
__set_UmrahCore_QuickCreate(UmrahCore_QuickCreate);
const UmrahCore_Wizard: any = {
    step: 1, data: {}, busy: false, start(programId = '') { this.step = 1; this.data = { date: UmrahCore_today(), programId: programId || '', adults: 1, childBed: 0, childNoBed: 0, infants: 0, primaryRoomType: 'single', roomTypeTouched: false, discount: 0, status: 'hold', sourceType: 'direct', sourceAgentId: '', depositAmount: 0, paymentMethod: 'cash', treasuryId: '', travelerNames: '' }; UmrahCore_DB.data.uiState.bookingWizard = { step: 1, data: UmrahCore_deep(this.data) }; UmrahCore_UI.openPage('booking-wizard'); },
    capture() { const f = document.getElementById('wizardForm') as HTMLFormElement | null; if (!f)
        return; const o = Object.fromEntries(new FormData(f)); Object.assign(this.data, o); for (const k of ['adults', 'childBed', 'childNoBed', 'infants', 'discount', 'depositAmount'])
        if (o[k] != null)
            this.data[k] = Math.max(0, UmrahCore_N(o[k])); UmrahCore_DB.data.uiState.bookingWizard = { step: this.step, data: UmrahCore_deep(this.data) }; },
    addDraftFinancialNote() { if (this.step !== 5 || this.data.status === 'confirmed' || UmrahCore_N(this.data.depositAmount) > 0)
        return; const review = document.querySelector('#wizardForm .wizard-review'); if (!review || document.getElementById('bookingDraftFinancialNote'))
        return; review.insertAdjacentHTML('beforebegin', '<div id="bookingDraftFinancialNote" class="ok-note mb-12"><b>مسودة تشغيلية:</b> لم يتم إنشاء أي التزام مالي حتى الآن. لن تُنشأ فاتورة أو حركة خزنة إلا عند اختيار التأكيد أو إدخال عربون.</div>'); },
    totalPersons() { return UmrahCore_N(this.data.adults) + UmrahCore_N(this.data.childBed) + UmrahCore_N(this.data.childNoBed) + UmrahCore_N(this.data.infants); }, bedPersons() { return UmrahCore_N(this.data.adults) + UmrahCore_N(this.data.childBed); }, roomAvailable(type) { const p = UmrahCore_Ops.program(this.data.programId); if (!p)
        return true; const hotels = UmrahCore_Ops.segments(p.id, 'hotel'); return UmrahCore_N(p.pricing?.[type]) > 0 && (!hotels.length || hotels.every(s => UmrahCore_N(s.inventory?.[type]) > 0)); }, suggestRoomType() { const beds = Math.max(1, this.bedPersons()), ideal = beds <= 1 ? 'single' : beds === 2 ? 'double' : beds === 3 ? 'triple' : beds === 4 ? 'quad' : 'quint', ordered = ['single', 'double', 'triple', 'quad', 'quint']; if (this.roomAvailable(ideal))
        return ideal; const idx = ordered.indexOf(ideal), candidates = [...ordered.slice(idx + 1), ...ordered.slice(0, idx).reverse()]; return candidates.find(t => this.roomAvailable(t)) || ideal; }, countsChanged() { this.capture(); if (!this.data.roomTypeTouched)
        this.data.primaryRoomType = this.suggestRoomType(); const total = document.getElementById('bookingTotalPersons') as HTMLInputElement | null; if (total)
        total.value = this.totalPersons(); const room = document.querySelector('#wizardForm [name="primaryRoomType"]') as HTMLSelectElement | null; if (room && !this.data.roomTypeTouched)
        room.value = this.data.primaryRoomType; const hint = document.getElementById('roomSuggestionHint'); if (hint)
        hint.textContent = `اقتراح ذكي: ${UmrahCore_roomLabel(this.suggestRoomType())} حسب ${this.bedPersons()} فرد يحتاج سريرًا. يمكنك تغييره يدويًا.`; UmrahCore_DB.data.uiState.bookingWizard = { step: this.step, data: UmrahCore_deep(this.data) }; }, roomTypeChanged(v) { this.data.primaryRoomType = v; this.data.roomTypeTouched = true; this.capture(); }, depositChanged(v) { this.data.depositAmount = Math.max(0, UmrahCore_N(v)); if (this.data.depositAmount > 0) {
        this.data.status = 'confirmed';
        const s = document.querySelector('#wizardForm [name="status"]') as HTMLSelectElement | null;
        if (s)
            s.value = 'confirmed';
    } this.capture(); },
    async next() { if (this.busy)
        return; this.busy = true; const btn = document.getElementById('bookingWizardNext') as HTMLButtonElement | null; if (btn) {
        btn.disabled = true;
        btn.textContent = 'جاري التحقق...';
    } try {
        this.capture();
        await new Promise<void>(r => requestAnimationFrame(() => r()));
        if (this.step === 1 && (!this.data.customerId || !this.data.programId))
            throw new Error('اختر العميل والبرنامج');
        if (this.step === 1 && !this.data.roomTypeTouched)
            this.data.primaryRoomType = this.suggestRoomType();
        if (this.step === 2 && this.totalPersons() <= 0)
            throw new Error('أدخل عدد المسافرين');
        if (this.step === 3) {
            if (this.data.sourceType === 'agent' && !this.data.sourceAgentId)
                throw new Error('اختر المندوب مصدر الحجز');
            const p = UmrahCore_Ops.program(this.data.programId);
            if (!p)
                throw new Error('البرنامج غير موجود');
            this.data.estimatedTotal = UmrahCore_Ops.bookingPrice(p, { counts: { adults: UmrahCore_N(this.data.adults), childBed: UmrahCore_N(this.data.childBed), childNoBed: UmrahCore_N(this.data.childNoBed), infants: UmrahCore_N(this.data.infants) }, primaryRoomType: this.data.primaryRoomType, discount: UmrahCore_N(this.data.discount) });
        }
        if (this.step === 4 && UmrahCore_N(this.data.depositAmount) > 0) {
            const p = UmrahCore_Ops.program(this.data.programId);
            if (UmrahCore_N(this.data.depositAmount) > UmrahCore_N(this.data.estimatedTotal || UmrahCore_Ops.bookingPrice(p, { counts: { adults: UmrahCore_N(this.data.adults), childBed: UmrahCore_N(this.data.childBed), childNoBed: UmrahCore_N(this.data.childNoBed), infants: UmrahCore_N(this.data.infants) }, primaryRoomType: this.data.primaryRoomType, discount: UmrahCore_N(this.data.discount) })))
                throw new Error('العربون لا يمكن أن يتجاوز إجمالي الحجز');
            if (!this.data.treasuryId)
                throw new Error('اختر الخزنة/البنك لتحصيل العربون');
            this.data.status = 'confirmed';
        }
        this.step = Math.min(5, this.step + 1);
        UmrahCore_DB.data.uiState.bookingWizard = { step: this.step, data: UmrahCore_deep(this.data) };
        UmrahCore_UI.render();
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
    }
    finally {
        this.busy = false;
        const b = document.getElementById('bookingWizardNext') as HTMLButtonElement | null;
        if (b) {
            b.disabled = false;
            b.textContent = 'التالي';
        }
    } },
    back() { this.capture(); if (this.step <= 1) {
        if (!confirm('إلغاء مسودة الحجز والعودة إلى لوحة العمرة؟ لن يتم إنشاء حجز أو حركة مالية.')) return;
        UmrahCore_DB.data.uiState.bookingWizard = null;
        return UmrahCore_UI.openPage('dashboard');
    } this.step--; UmrahCore_UI.render(); },
    async finish() { try {
        this.capture();
        const d = UmrahCore_deep(this.data), p = UmrahCore_Ops.program(d.programId);
        if (!p)
            throw new Error('اختر برنامجًا صالحًا');
        if (UmrahCore_N(d.depositAmount) > 0)
            d.status = 'confirmed';
        const amt = UmrahCore_N(d.depositAmount), treasury = amt > 0 ? UmrahCore_Bridge.preferredTreasury(p.currency, d.treasuryId) : null;
        if (amt > 0 && !treasury)
            throw new Error(`أنشئ خزنة/حسابًا بعملة ${p.currency} لتحصيل العربون`);
        const b = await UmrahCore_DB.atomicAsync('bookingWizardFinish', async () => { const booking: any = UmrahCore_Ops.createBooking(d), names = UmrahCore_S(d.travelerNames).split(/\r?\n/).map(x => x.trim()).filter(Boolean), ts = UmrahCore_Ops.scoped('travelers').filter(t => t.bookingId === booking.id && t.active !== false).sort((a, z) => a.seq - z.seq); names.slice(0, ts.length).forEach((n, j) => ts[j].nameAr = n); if (booking.status === 'confirmed' && amt > 0) {
            const r = UmrahCore_Bridge.emit('umrah.booking.deposit.requested', { bookingId: booking.id, bookingNo: booking.no, amount: amt, currency: booking.currency, treasuryId: treasury.id, paymentMethod: d.paymentMethod || 'cash', date: UmrahCore_today(), note: `عربون حجز ${UmrahCore_programTypeLabel(p.programType)} ${booking.no}` }, `booking-deposit:${booking.id}:${amt}`);
            if (r?.receiptId) {
                booking.hostReceiptId = r.receiptId;
                booking.hostReceiptNo = r.receiptNo || '';
            }
            UmrahCore_Ops.syncPaymentStatus(booking);
        } UmrahCore_DB.data.uiState.bookingWizard = null; return booking; }, { save: true, render: false, strict: d.status === 'confirmed' || amt > 0, waitForSave: d.status === 'confirmed' || amt > 0 });
        UmrahCore_UI.toast(`تم إنشاء الحجز ${b.no}`);
        UmrahCore_UI.openPage('bookings');
        setTimeout(() => UmrahCore_Actions.bookingOverview(b.id), 50);
    }
    catch (e) {
        UmrahCore_UI.toast(e.message);
    } },
    page() { const p = UmrahCore_Ops.program(this.data.programId), c = UmrahCore_Bridge.customer(this.data.customerId), persons = UmrahCore_N(this.data.adults) + UmrahCore_N(this.data.childBed) + UmrahCore_N(this.data.childNoBed) + UmrahCore_N(this.data.infants), est = p ? UmrahCore_Ops.bookingPrice(p, { counts: { adults: UmrahCore_N(this.data.adults), childBed: UmrahCore_N(this.data.childBed), childNoBed: UmrahCore_N(this.data.childNoBed), infants: UmrahCore_N(this.data.infants) }, primaryRoomType: this.data.primaryRoomType || 'quad', discount: UmrahCore_N(this.data.discount) }) : 0, steps = ['العميل والبرنامج', 'المسافرون والغرفة', 'السعر والمصدر', 'التأكيد والعربون', 'المراجعة']; let body = ''; if (this.step === 1)
        body = `<div class="linked-note mb-12"><b>لا تحتاج مغادرة قسم الحج والعمرة.</b> لو العميل غير موجود أنشئه هنا، وسيُحفظ في سجل العملاء المركزي ويُختار تلقائيًا.</div><div class="form-grid">${UmrahCore_Forms.picker('customerId', 'العميل', 'customer', this.data.customerId || '', 'ابحث عن العميل...')}${UmrahCore_Forms.picker('programId', 'برنامج الحج/العمرة', 'saleProgram', this.data.programId || '', 'ابحث عن البرنامج...')}</div><div class="quick-actions mt-10"><button type="button" class="btn soft" data-quick-create-type="customer" data-quick-create-target="customerId">+ عميل جديد هنا</button><button type="button" class="btn ghost" data-umrah-guided-host="customers">فتح سجل العملاء المركزي</button>${UmrahCore_Ops.scoped('programs').some(x => x.status === 'open') ? '' : `<button type="button" class="btn primary" data-umrah-program-wizard-start="1">\u0625\u0646\u0634\u0627\u0621 \u0628\u0631\u0646\u0627\u0645\u062C \u062D\u062C/\u0639\u0645\u0631\u0629</button>`}</div>`;
    else if (this.step === 2)
        body = `<div class="form-grid three"><div class="field"><label>بالغون</label><input name="adults" type="number" min="0" value="${UmrahCore_N(this.data.adults)}" data-wizard-counts="1"></div><div class="field"><label>أطفال بسرير</label><input name="childBed" type="number" min="0" value="${UmrahCore_N(this.data.childBed)}" data-wizard-counts="1"></div><div class="field"><label>أطفال بدون سرير</label><input name="childNoBed" type="number" min="0" value="${UmrahCore_N(this.data.childNoBed)}" data-wizard-counts="1"></div><div class="field"><label>رضع</label><input name="infants" type="number" min="0" value="${UmrahCore_N(this.data.infants)}" data-wizard-counts="1"></div><div class="field"><label>نوع الغرفة الأساسي</label><select name="primaryRoomType" data-wizard-room-type="1">${['single', 'double', 'triple', 'quad', 'quint'].map(x => `<option value="${x}" ${this.data.primaryRoomType === x ? 'selected' : ''}>${UmrahCore_roomLabel(x)}</option>`).join('')}</select><small id="roomSuggestionHint">اقتراح ذكي: ${UmrahCore_roomLabel(this.suggestRoomType())} حسب ${this.bedPersons()} فرد يحتاج سريرًا. يمكنك تغييره يدويًا.</small></div><div class="field"><label>إجمالي مسافري الحجز</label><input id="bookingTotalPersons" value="${persons}" disabled></div></div>`;
    else if (this.step === 3)
        body = `<div class="form-grid"><div class="field"><label>الخصم</label><input name="discount" type="number" min="0" value="${UmrahCore_N(this.data.discount)}"></div><div class="field"><label>السعر المتوقع</label><input value="${UmrahCore_money(est, p?.currency || UmrahCore_DB.data.settings.defaultCurrency)}" disabled></div><div class="field"><label>مصدر الحجز</label><select name="sourceType"><option value="direct" ${this.data.sourceType === 'direct' ? 'selected' : ''}>مباشر</option><option value="agent" ${this.data.sourceType === 'agent' ? 'selected' : ''}>مندوب</option></select></div><div class="field"><label>المندوب</label><select name="sourceAgentId"><option value="">بدون</option>${UmrahCore_Bridge.agents().map(x => `<option value="${x.id}" ${this.data.sourceAgentId === x.id ? 'selected' : ''}>${UmrahCore_esc((x.no ? x.no + ' — ' : '') + x.name)}</option>`).join('')}</select></div></div><div class="automation-note mt-12"><b>تلقائي:</b> التأكيد ينشئ فاتورة العميل، العمولة حسب القواعد، وأوامر شراء الخدمات حسب سياسة البرنامج.</div>`;
    else if (this.step === 4) {
        const cur = p?.currency || UmrahCore_DB.data.settings.defaultCurrency, trs = UmrahCore_Bridge.treasuries(cur);
        if (!this.data.treasuryId) {
            const t = UmrahCore_Bridge.preferredTreasury(cur, p?.defaultTreasuryId || '');
            if (t)
                this.data.treasuryId = t.id;
        }
        body = `<div class="fx-card mb-10"><b>عملة الحجز: ${cur}</b> • ${UmrahCore_fxLabel(cur, p?.departureDate || UmrahCore_today())}</div><div class="form-grid"><div class="field"><label>طريقة الحفظ</label><select name="status"><option value="hold" ${this.data.status !== 'confirmed' ? 'selected' : ''}>حجز مؤقت</option><option value="confirmed" ${this.data.status === 'confirmed' ? 'selected' : ''}>تأكيد وترحيل تلقائي</option></select></div><div class="field"><label>عربون الآن — اختياري</label><input name="depositAmount" type="number" min="0" value="${UmrahCore_N(this.data.depositAmount)}" data-wizard-deposit="1"><small>إدخال عربون يعني تحصيلًا فعليًا؛ سيحوّل الحجز تلقائيًا إلى مؤكد وينشئ سند قبض ويخصّصه على الفاتورة.</small></div><div class="field"><label>الخزنة / البنك بنفس العملة</label><select name="treasuryId"><option value="">اختر...</option>${UmrahCore_treasuryOptions(cur, this.data.treasuryId)}</select></div><div class="field"><label>طريقة الدفع</label><select name="paymentMethod"><option value="cash">نقدي</option><option value="bank">تحويل بنكي</option><option value="card">بطاقة / نقطة بيع</option><option value="wallet">محفظة</option></select></div><div class="field full"><label>أسماء المسافرين — كل اسم في سطر</label><textarea name="travelerNames" placeholder="أحمد محمد\nسارة أحمد...">${UmrahCore_esc(this.data.travelerNames || '')}</textarea></div></div>${trs.length ? '' : `<div class="warn-note mt-10">لا توجد خزنة/حساب بعملة ${cur}. <button type="button" class="btn small soft" data-quick-create-type="treasury" data-quick-create-target="treasuryId" data-quick-currency="${cur}">إنشاء خزنة ${cur} هنا</button></div>`}`;
    }
    else
        body = `<div class="wizard-review"><div class="card"><b>العميل</b><div>${UmrahCore_esc(c?.name || '-')}</div></div><div class="card"><b>البرنامج</b><div>${UmrahCore_esc(p ? UmrahCore_programDisplay(p) : '-')}</div></div><div class="card"><b>المسافرون</b><div>${persons} فرد — ${UmrahCore_roomLabel(this.data.primaryRoomType)}</div></div><div class="card"><b>إجمالي الحجز</b><div>${UmrahCore_money(est, p?.currency || UmrahCore_DB.data.settings.defaultCurrency)}</div></div><div class="card"><b>الحالة</b><div>${this.data.status === 'confirmed' ? 'تأكيد وترحيل' : 'حجز مؤقت'}</div></div><div class="card"><b>العربون</b><div>${UmrahCore_money(UmrahCore_N(this.data.depositAmount), p?.currency || UmrahCore_DB.data.settings.defaultCurrency)}</div></div></div><div class="automation-note mt-12"><b>بعد الحفظ:</b> السعة والغرف وملفات المسافرين والفاتورة والعربون والعمولات وأوامر شراء الخدمات تتم آليًا حسب السياسة.</div>`; return `<div class="wizard-shell">${UmrahCore_UI.head('إنشاء حجز حج/عمرة', 'كل ما تحتاجه في مسار واحد بدون الرجوع إلى شاشات أخرى')}<div class="wizard-steps">${steps.map((s, i) => `<div class="wizard-step ${i + 1 === this.step ? 'active' : i + 1 < this.step ? 'done' : ''}">${i + 1}. ${s}</div>`).join('')}</div><div class="card"><form id="wizardForm">${body}<div class="quick-actions mt-16"><button type="button" class="btn ghost" data-umrah-wizard-back="1">${this.step === 1 ? 'إلغاء' : 'السابق'}</button>${this.step < 5 ? `<button id="bookingWizardNext" type="button" class="btn primary" data-umrah-wizard-next="1" ${this.busy ? 'disabled' : ''}>${this.busy ? 'جاري التحقق...' : 'التالي'}</button>` : `<button type="button" class="btn success" data-umrah-wizard-finish="1">\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062D\u062C\u0632 \u0627\u0644\u0622\u0646</button>`}</div></form></div></div>`; }
};
__set_UmrahCore_Wizard(UmrahCore_Wizard);
const UmrahCore_SmartGuide: any = {
    panel(title, text, items: any[] = [], opts: any = {}) { const tone = opts.error ? ' error' : '', actions = opts.actions || '', state = opts.state || 'مساعد نشط'; return `<div class="smart-guide${tone}" id="smartGuidePanel"><div class="smart-guide-head"><div class="smart-guide-orb">✦</div><div class="smart-guide-copy"><h2>${UmrahCore_esc(title)}</h2><p>${UmrahCore_esc(text)}</p></div><span class="badge green smart-guide-state">${UmrahCore_esc(state)}</span></div>${items.length ? `<div class="smart-guide-list">${items.slice(0, 4).map((x, i) => x.actionType && x.actionId ? `<button type="button" class="smart-guide-item smart-action" data-umrah-guide-action="${UmrahCore_esc(x.actionType)}" data-umrah-guide-id="${UmrahCore_esc(x.actionId)}"><span>${i + 1}</span><div><b>${UmrahCore_esc(x.title || x)}</b>${x.desc ? `<small>${UmrahCore_esc(x.desc)}</small>` : ''}</div></button>` : `<div class="smart-guide-item"><span>${i + 1}</span><div><b>${UmrahCore_esc(x.title || x)}</b>${x.desc ? `<small>${UmrahCore_esc(x.desc)}</small>` : ''}</div></div>`).join('')}</div>` : ''}${actions ? `<div class="smart-guide-actions">${actions}</div>` : ''}</div>`; },
    dashboard(rec, programs, bookings) { let title = 'المساعد الذكي للحج والعمرة', text = '', items = [], actions = ''; if (!programs.length) {
        text = 'ابدأ بإنشاء برنامج واحد؛ سأراجع معك العملة والموسم والإقامات والطيران والنقل والتكلفة قبل فتحه للبيع.';
        items = [{ title: 'إنشاء برنامج حج/عمرة', desc: 'مسار موجه خطوة بخطوة مع فحص تلقائي لكل مرحلة.' }, { title: 'لن تحتاج للتنقل بين الأقسام', desc: 'المورد والعملة والخزنة والموسم يمكن إنشاؤهم من مكان العمل عند الحاجة.' }];
        actions = "<button class=\"btn primary\" data-umrah-program-wizard-start=\"1\">\u0627\u0628\u062F\u0623 \u0625\u0646\u0634\u0627\u0621 \u0628\u0631\u0646\u0627\u0645\u062C</button>";
    }
    else if (rec.length) {
        text = `وجدت ${rec.length} إجراءً يحتاج انتباهك. رتبت لك الأهم أولًا حسب الجاهزية والتأثير التشغيلي والمالي.`;
        items = rec.slice(0, 3).map(x => ({ title: x.title, desc: x.desc, actionType: x.actionType, actionId: x.actionId }));
        actions = `<button class="btn primary" data-umrah-guide-action="${UmrahCore_esc(rec[0].actionType)}" data-umrah-guide-id="${UmrahCore_esc(rec[0].actionId)}">نفّذ أهم خطوة الآن</button><button class="btn ghost" data-umrah-page="guided-trip">عرض خطة التجهيز</button>`;
    }
    else {
        text = 'الوضع مستقر حاليًا. يمكنك إنشاء حجز جديد أو متابعة برنامج قائم، وسأظهر لك أي نقص بمجرد ظهوره.';
        items = [{ title: `${programs.length} برنامج`, desc: `${bookings.length} حجز قيد العمل` }, { title: 'المتابعة تلقائية', desc: 'الجاهزية المالية والتشغيلية والمهام تظهر لك حسب الحالة.' }];
        actions = `<button class="btn primary" data-umrah-wizard-start="1">\u0625\u0646\u0634\u0627\u0621 \u062D\u062C\u0632 \u062C\u062F\u064A\u062F</button><button class="btn ghost" data-umrah-page="guided-trip">\u0645\u062A\u0627\u0628\u0639\u0629 \u0627\u0644\u0628\u0631\u0627\u0645\u062C</button>`;
    } return this.panel(title, text, items, { actions, state: 'يتابع الحالة تلقائيًا' }); },
    programWizard(step, d) { const items = [], target = Math.max(0, UmrahCore_daysBetween(d.departureDate, d.returnDate)), plan = UmrahCore_ProgramWizard.plan(), err = UmrahCore_ProgramWizard.lastError || ''; let title = `مساعد إنشاء البرنامج — الخطوة ${step} من 6`, text = ''; if (step === 1) {
        text = 'أدخل أساس البرنامج فقط. لن أفحص الفنادق أو الطيران قبل الوصول لخطوتهم.';
        if (!UmrahCore_S(d.name).trim())
            items.push({ title: 'اسم البرنامج', desc: 'اكتب اسمًا واضحًا يظهر للحجز والتقارير.' });
        if (!d.seasonId)
            items.push({ title: 'الموسم', desc: 'يمكن إنشاؤه هنا واختياره تلقائيًا.' });
        if (d.currency !== UmrahCore_Bridge.baseCurrency() && !(UmrahCore_N(d.fxRate) > 0 || UmrahCore_Bridge.rate(d.currency, d.departureDate) > 0))
            items.push({ title: 'سعر الصرف', desc: `ثبّت سعر ${d.currency} قبل الانتقال.` });
        if (!d.defaultTreasuryId)
            items.push({ title: 'خزنة التحصيل', desc: `اختر أو أنشئ خزنة ${d.currency}.` });
    }
    else if (step === 2) {
        text = 'أكمل الإقامة الأولى. سأحسب السعة من أنواع الغرف وأقارنها بسعة البرنامج.';
        const st = plan.stays.find(x => x.index === 1);
        if (!st)
            items.push({ title: 'الفندق الأول', desc: 'اسم الفندق والمورد وعدد الليالي مطلوبون.' });
        else {
            items.push({ title: `سعة الإقامة ${UmrahCore_ProgramWizard.roomCapacity(st)}/${UmrahCore_N(d.capacity)}`, desc: 'يجب أن تكفي أسرّة الإقامة كل سعة البرنامج.' });
            items.push({ title: `الليالي ${plan.hotelNights}/${target}`, desc: 'سنكمل باقي الليالي في الإقامات التالية.' });
        }
    }
    else if (step === 3) {
        text = 'رتّب الإقامات التالية كما تريد؛ المدينة ليست مفروضة. قبل الطيران يجب أن تغطي الليالي مدة الرحلة.';
        items.push({ title: `تغطية ليالي الفنادق ${plan.hotelNights}/${target}`, desc: plan.hotelNights === target ? `التغطية مكتملة — مدة البرنامج ${target + 1} أيام / ${target} ليالٍ.` : 'عدّل ليالي الإقامات حتى تطابق الفرق بين تاريخ السفر والعودة.' });
    }
    else if (step === 4) {
        text = 'أدخل الذهاب والعودة كرحلتين مستقلتين. سأمنع الانتقال إذا كانت المقاعد أقل من سعة البرنامج.';
        items.push({ title: `المقاعد ${UmrahCore_N(d.seats)}/${UmrahCore_N(d.capacity)}`, desc: UmrahCore_N(d.seats) >= UmrahCore_N(d.capacity) ? 'السعة مناسبة.' : 'زد عدد المقاعد قبل المتابعة.' });
        if (!d.outFlight || !d.returnFlight)
            items.push({ title: 'أرقام الرحلات', desc: 'رحلة الذهاب والعودة مطلوبتان.' });
    }
    else if (step === 5) {
        text = d.programType === 'hajj' ? 'في برنامج الحج: المخيم/المشاعر والتصاريح/نسك إلزاميان قبل فتح البيع. النقل والتأشيرة يخضعان لإعداد البرنامج، وأي خدمة مفعلة تتطلب المورد والتكلفة والعملة كاملة.' : 'النقل والتأشيرة اختياريان حسب البرنامج، لكن إذا بدأت خدمة فسأطلب المورد والتكلفة والعملة كاملة.';
        if (UmrahCore_S(d.transportProvider).trim())
            items.push({ title: `سعة النقل ${UmrahCore_N(d.vehicles) * UmrahCore_N(d.busCapacity)}/${UmrahCore_N(d.capacity)}`, desc: 'يتم ضبط عدد المركبات تلقائيًا عند استخدام المساعدة.' });
        if (d.visaSupplierId || UmrahCore_N(d.visaCost) > 0)
            items.push({ title: 'التأشيرات', desc: 'سيتم تتبع كل مسافر مع تجميع مستند المورد على مستوى الحجز.' });
    }
    else {
        text = 'هذه آخر مراجعة. أحسب التكلفة المتوقعة والهامش والالتزامات قبل إنشاء أي مستند مالي.';
        items.push({ title: `متوسط التكلفة للفرد ${UmrahCore_money(plan.costPerPax, plan.base)}`, desc: d.profitMode === 'fixed' ? `ربح ثابت ${UmrahCore_money(UmrahCore_N(d.fixedProfit), d.currency)} لكل فرد؛ السعر المقترح يختلف حسب نوع الغرفة.` : `هامش الربح المستهدف ${UmrahCore_N(d.marginPct)}% من سعر البيع؛ السعر المقترح يختلف حسب نوع الغرفة.` });
        items.push({ title: `${plan.commitments.length} التزامات متوقعة`, desc: 'لن ينشأ شيء قبل اجتياز الفحص النهائي.' });
    } if (!items.length)
        items.push({ title: 'الخطوة جاهزة', desc: 'يمكنك الضغط على التالي؛ الفحص سيقتصر على هذه المرحلة فقط.' }); if (err)
        items.unshift({ title: 'راجع هذه النقطة', desc: err }); const actions = `<button type="button" class="btn soft" data-pw-auto-assist="1">\u2726 \u062A\u0637\u0628\u064A\u0642 \u0627\u0642\u062A\u0631\u0627\u062D \u0622\u0645\u0646</button>`; return this.panel(title, err || text, items, { actions, error: !!err, state: err ? 'يحتاج مراجعة' : 'جاهز للمساعدة' }); }
};
const UmrahCore_Guided: any = {
    hostPage(page) { UmrahCore_Bridge.rememberLocation(); return UmrahCore_Bridge.openERP(page); },
    bookingNext(b) { if (!b)
        return { tone: 'gray', title: 'الحجز غير موجود', desc: '', kind: 'open' }; if (b.status === 'cancelRequested')
        return { tone: 'red', title: 'طلب الإلغاء قيد التسوية', desc: b.cancelBlockReason || 'تظل السعة والخدمات محجوزة حتى اكتمال الإلغاء المالي.', kind: 'open' }; if (['inquiry', 'quotation'].includes(b.status))
        return { tone: 'orange', title: 'حوّل الحجز إلى حجز مؤقت أو تأكيد', desc: 'السعة لم تُثبت بعد بشكل نهائي.', kind: 'open' }; if (b.status === 'hold')
        return { tone: 'orange', title: 'تأكيد الحجز', desc: 'الحجز مؤقت وقد ينتهي تلقائيًا.', kind: 'confirm' }; const ts = UmrahCore_Ops.scoped('travelers').filter(t => t.bookingId === b.id && t.active !== false); const missPass = ts.find(t => !UmrahCore_Ops.travelerReadiness(t).passport); if (missPass)
        return { tone: 'red', title: `استكمال جواز ${missPass.nameAr || missPass.no}`, desc: 'بيانات الجواز أو الصلاحية غير مكتملة.', kind: 'traveler', id: missPass.id }; const missVisa = ts.find(t => !UmrahCore_Ops.travelerReadiness(t).visa); if (missVisa)
        return { tone: 'orange', title: `متابعة تأشيرة ${missVisa.nameAr || missVisa.no}`, desc: 'التأشيرة لم تصل لمرحلة الإصدار.', kind: 'visas' }; const missTicket = ts.find(t => !UmrahCore_Ops.travelerReadiness(t).ticket); if (missTicket)
        return { tone: 'orange', title: `إصدار تذكرة ${missTicket.nameAr || missTicket.no}`, desc: 'التذكرة أو PNR غير مكتمل.', kind: 'flights' }; const missHotel = ts.find(t => !UmrahCore_Ops.travelerReadiness(t).hotel); if (missHotel)
        return { tone: 'orange', title: 'استكمال توزيع الغرف', desc: 'هناك مسافر غير موزع على كل الإقامات.', kind: 'hotels' }; const missBus = ts.find(t => !UmrahCore_Ops.travelerReadiness(t).transport); if (missBus)
        return { tone: 'orange', title: 'استكمال توزيع المركبات', desc: 'هناك مسافر غير موزع على النقل.', kind: 'transport' }; const missPermit = ts.find(t => { const r = UmrahCore_Ops.travelerReadiness(t); return r.permitRequired && !r.permit; }); if (missPermit)
        return { tone: 'orange', title: `استكمال تصريح / نسك ${missPermit.nameAr || missPermit.no}`, desc: 'خدمة الحج المطلوبة لم تصل لمرحلة الإصدار.', kind: 'hajj-services' }; const missCamp = ts.find(t => { const r = UmrahCore_Ops.travelerReadiness(t); return r.campRequired && !r.camp; }); if (missCamp)
        return { tone: 'orange', title: `تحديد مخيم / مشاعر ${missCamp.nameAr || missCamp.no}`, desc: 'تسكين الحج المطلوب غير مكتمل.', kind: 'hajj-services' }; const r = UmrahCore_Ops.bookingReadiness(b); if (r.finance === 'due')
        return { tone: 'red', title: `تحصيل المتبقي ${UmrahCore_money(r.remaining, b.currency)}`, desc: 'الموقف المالي يمنع الجاهزية حسب سياسة الشركة.', kind: 'receipt' }; if (b.status === 'confirmed')
        return { tone: 'green', title: 'الحجز جاهز للمراجعة النهائية', desc: 'استكمل اعتماد الجاهزية ثم حوّله إلى جاهز.', kind: 'open' }; return { tone: 'green', title: 'فتح ملف الحجز', desc: `الجاهزية ${r.score}%`, kind: 'open' }; },
    doBooking(id) { const b = UmrahCore_Ops.booking(id), n = this.bookingNext(b); if (n.kind === 'confirm')
        return UmrahCore_Actions.confirmBooking(id); if (n.kind === 'traveler')
        return UmrahCore_Forms.traveler(n.id); if (['visas', 'flights', 'hotels', 'transport', 'hajj-services'].includes(n.kind))
        return UmrahCore_UI.openPage(n.kind); if (n.kind === 'receipt')
        return this.hostPage('receipts'); return UmrahCore_Actions.bookingOverview(id); },
    programNext(p) { if (!p)
        return { tone: 'gray', title: 'البرنامج غير موجود', desc: '', kind: 'advanced' }; if (['planning', 'contracting', 'pricing'].includes(p.status))
        return { tone: 'orange', title: 'أكمل إعداد البرنامج وافتحه للبيع', desc: 'استخدم معالج إنشاء البرنامج أو الإدارة المتقدمة.', kind: 'program' }; const b = UmrahCore_Ops.blockers(p.id); if (b.financialSetup?.length)
        return { tone: 'red', title: `${b.financialSetup.length} خدمات بدون ربط مالي كامل`, desc: 'حدد المورد والتكلفة وسياسة الإثبات قبل استمرار التشغيل.', kind: 'costing' }; if (b.passport.length)
        return { tone: 'red', title: `${b.passport.length} جوازات تحتاج استكمال`, desc: `ابدأ بأول ${UmrahCore_travelerTitle(p)} ناقص بيانات جواز.`, kind: 'travelers' }; if (b.visa.length)
        return { tone: 'red', title: `${b.visa.length} تأشيرات غير مكتملة`, desc: 'أنشئ/استكمل دفعة التأشيرات.', kind: 'visas' }; if (b.ticket.length)
        return { tone: 'orange', title: `${b.ticket.length} تذاكر غير مكتملة`, desc: 'استكمل PNR والتذاكر.', kind: 'flights' }; if (b.hotel.length)
        return { tone: 'orange', title: `${b.hotel.length} توزيع غرف ناقص`, desc: 'أكمل توزيع الغرف للإقامات.', kind: 'hotels' }; if (b.transport.length)
        return { tone: 'orange', title: `${b.transport.length} توزيع نقل ناقص`, desc: 'أكمل توزيع المركبات.', kind: 'transport' }; if (b.permit?.length)
        return { tone: 'orange', title: `${b.permit.length} تصاريح / نسك غير مكتملة`, desc: 'استكمل خدمات الحج المطلوبة لكل حاج.', kind: 'hajj-services' }; if (b.camp?.length)
        return { tone: 'orange', title: `${b.camp.length} تسكين مخيم/مشاعر ناقص`, desc: 'أكمل تسكين الحج قبل الجاهزية.', kind: 'hajj-services' }; if (b.finance.length)
        return { tone: 'red', title: `${b.finance.length} حجوزات عليها مستحقات`, desc: 'راجع التحصيل قبل السفر.', kind: 'bookings' }; if (b.tasks.length)
        return { tone: 'orange', title: `${b.tasks.length} مهام تشغيل حرجة`, desc: 'عالج المهمة التالية من مركز الجاهزية.', kind: 'control' }; return { tone: 'green', title: 'الفوج جاهز للتشغيل', desc: 'لا توجد موانع حرجة حاليًا.', kind: 'control' }; },
    doProgram(id) { const p = UmrahCore_Ops.program(id), n = this.programNext(p); if (n.kind === 'program')
        return UmrahCore_Actions.programOverview(id); if (['travelers', 'visas', 'flights', 'hotels', 'transport', 'hajj-services', 'bookings', 'costing'].includes(n.kind))
        return UmrahCore_UI.openPage(n.kind); UmrahCore_State.controlProgram = id; UmrahCore_UI.openPage('control'); },
    recommendations() { const rows = []; for (const b of UmrahCore_Ops.scoped('bookings').filter(x => !['cancelled', 'closed', 'returned', 'expired'].includes(x.status))) {
        const n = this.bookingNext(b);
        if (n.tone !== 'green')
            rows.push({ tone: n.tone, title: `${b.no} — ${n.title}`, desc: n.desc, actionType: 'booking', actionId: b.id });
    } for (const p of UmrahCore_Ops.scoped('programs').filter(x => !['cancelled', 'closed'].includes(x.status))) {
        const n = this.programNext(p);
        if (n.tone !== 'green')
            rows.push({ tone: n.tone, title: `${p.no} — ${n.title}`, desc: n.desc, actionType: 'program', actionId: p.id });
    } return rows.slice(0, 12); },
    resumePage() { const bs = UmrahCore_Ops.scoped('bookings').filter(b => !['cancelled', 'closed', 'returned', 'expired'].includes(b.status)); return `<div class="card">${UmrahCore_UI.head('استكمال حجز موجود', 'اختر الحجز، والنظام سيحدد لك الإجراء التالي بدل البحث داخل الشاشات.')}${bs.length ? `<div class="priority-list">${bs.map(b => { const n = this.bookingNext(b), p = UmrahCore_Ops.program(b.programId); return `<div class="priority-row ${n.tone}"><span class="priority-dot"></span><div><b>${UmrahCore_esc(b.no)} — ${UmrahCore_esc(b.customerSnapshot?.name || '-')}</b><small>${UmrahCore_esc(p ? UmrahCore_programDisplay(p) : '-')} • ${UmrahCore_esc(n.title)} — ${UmrahCore_esc(n.desc)}</small></div><button class="btn small primary" data-umrah-guided-booking="${b.id}">نفّذ الآن</button></div>`; }).join('')}</div>` : '<div class="empty">لا توجد حجوزات تحتاج متابعة.</div>'}</div>`; },
    tripPage() { const ps = UmrahCore_Ops.scoped('programs').filter(p => !['cancelled', 'closed'].includes(p.status)); return `<div class="card">${UmrahCore_UI.head('مركز تشغيل وتجهيز الأفواج', 'بدل التنقل بين شاشات كثيرة: اختر البرنامج ثم ادخل مباشرة على الجزء الذي يحتاج تنفيذًا.')}${ps.length ? `<div class="priority-list">${ps.map(p => { const r = UmrahCore_Ops.programReadiness(p), n = this.programNext(p), req=(UmrahCore_Ops as any).programRequirements(p), b=UmrahCore_Ops.blockers(p.id); return `<div class="priority-row ${n.tone}" style="display:block"><div style="display:flex;gap:10px;align-items:center"><span class="priority-dot"></span><div style="flex:1"><b>${UmrahCore_esc(p.no)} — ${UmrahCore_esc(p.name)} • جاهزية ${r.score}%</b><small>${UmrahCore_esc(n.title)} — ${UmrahCore_esc(n.desc)}</small></div><button class="btn small primary" data-umrah-guided-program="${p.id}">الخطوة التالية</button></div><div class="quick-actions mt-10"><button class="btn small soft" data-program-overview="${p.id}">ملف البرنامج</button>${req.visa?`<button class="btn small ghost" data-umrah-page="visas">التأشيرات ${b.visa.length?`(${b.visa.length})`:''}</button>`:''}${req.hotel?`<button class="btn small ghost" data-umrah-state-page="hotels" data-umrah-state-key="hotelProgram" data-umrah-state-id="${p.id}">الغرف ${b.hotel.length?`(${b.hotel.length})`:''}</button>`:''}${req.flight?`<button class="btn small ghost" data-umrah-state-page="flights" data-umrah-state-key="flightProgram" data-umrah-state-id="${p.id}">الطيران ${b.ticket.length?`(${b.ticket.length})`:''}</button>`:''}${req.transport?`<button class="btn small ghost" data-umrah-state-page="transport" data-umrah-state-key="busProgram" data-umrah-state-id="${p.id}">النقل ${b.transport.length?`(${b.transport.length})`:''}</button>`:''}${(req.permit||req.camp)?`<button class="btn small ghost" data-umrah-state-page="hajj-services" data-umrah-state-key="hajjProgram" data-umrah-state-id="${p.id}">خدمات الحج</button>`:''}<button class="btn small ghost" data-umrah-page="procurement">الموردون</button><button class="btn small ghost" data-umrah-state-page="control" data-umrah-state-key="controlProgram" data-umrah-state-id="${p.id}">الجاهزية ${b.total?`(${b.total})`:''}</button><button class="btn small ghost" data-umrah-state-page="tripops" data-umrah-state-key="tripProgram" data-umrah-state-id="${p.id}">التشغيل اليومي</button><button class="btn small ghost" data-umrah-page="incidents">الحوادث</button></div></div>`; }).join('')}</div>` : '<div class="empty">لا توجد برامج بعد. ابدأ بإنشاء برنامج حج/عمرة.</div>'}</div>`; }

};
__set_UmrahCore_Guided(UmrahCore_Guided);
export { UmrahCore_Guided, UmrahCore_QuickCreate, UmrahCore_SmartGuide, UmrahCore_Wizard };
