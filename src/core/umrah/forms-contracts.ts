import { UmrahCore_N, UmrahCore_dateAdd, UmrahCore_esc, UmrahCore_programDisplay, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_vehicleCaps } from './runtime';
import { UmrahCore_Inventory } from './contracts-inventory';
import { UmrahCore_ContractCenter } from './contracts';
import { UmrahCore_Ops } from './operations';
import { UmrahCore_UI, UmrahCore_entityOptions } from './ui';
import { UmrahCore_Forms } from './forms';
const UmrahCore_ContractForms: any = {
    contractAllocation(kind, id) { const c = UmrahCore_ContractCenter.get(kind, id); if (!c)
        return UmrahCore_UI.toast('التعاقد غير موجود'); const ps = UmrahCore_ContractCenter.compatiblePrograms(kind, c), programOptions = UmrahCore_entityOptions(ps); let fields = ''; if (kind === 'hotel')
        fields = `<div class="field"><label>من / Check-in</label><input name="from" type="date" value="" required></div><div class="field"><label>إلى / Check-out</label><input name="to" type="date" value="" required></div>${Object.keys(UmrahCore_roomCap).map(t => `<div class="field"><label>${UmrahCore_roomLabel(t)} — غرف</label><input name="${t}Qty" type="number" min="0" value="0"><small>المتاح الأقصى ${UmrahCore_ContractCenter.hotelStats(c.id, t).available}</small></div>`).join('')}`;
    else if (kind === 'visa')
        fields = `<div class="field"><label>عدد التأشيرات المخصصة</label><input name="visas" type="number" min="1" max="${UmrahCore_ContractCenter.visaStats(c.id).available}" value="1" required><small>المتاح ${UmrahCore_ContractCenter.visaStats(c.id).available} تأشيرة</small></div>`;
    else if (kind === 'flight')
        fields = `<div class="field"><label>المقاعد المخصصة</label><input name="seats" type="number" min="1" max="${UmrahCore_ContractCenter.flightStats(c.id).available}" value="1" required><small>المتاح ${UmrahCore_ContractCenter.flightStats(c.id).available} مقعد</small></div>`;
    else if (kind === 'service')
        fields = `<div class="field"><label>من</label><input name="from" type="date" required></div><div class="field"><label>إلى</label><input name="to" type="date" required></div><div class="field"><label>الكمية المخصصة</label><input name="units" type="number" min="1" max="${UmrahCore_ContractCenter.serviceStats(c.id).available}" value="1" required><small>المتاح ${UmrahCore_ContractCenter.serviceStats(c.id).available} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}</small></div>`;
    else
        fields = `<div class="field"><label>من</label><input name="from" type="date" value="" required></div><div class="field"><label>إلى</label><input name="to" type="date" value="" required></div><div class="field"><label>عدد المركبات</label><input name="vehicles" type="number" min="1" max="${UmrahCore_ContractCenter.transportStats(c.id).availableVehicles}" value="1" required><small>المتاح ${UmrahCore_ContractCenter.transportStats(c.id).availableVehicles} مركبة</small></div>`; const noPrograms = ps.length ? '' : `<div class="danger-note mb-12">لا يوجد برنامج حالي متوافق مع فترة هذا العقد. أنشئ/عدّل البرنامج أو راجع تواريخ العقد أولًا.</div>`; const body = `<div class="automation-note mb-12"><b>تخصيص موحد:</b> اختر البرنامج أولًا؛ النظام يضبط التواريخ والكمية المقترحة تلقائيًا ثم يحجز المخزون ويضيف التكلفة ويربط أمر الشراء المركزي حسب حالة البرنامج.</div>${noPrograms}<label class="check-line mb-12"><input type="checkbox" name="autoAllocation" value="yes" checked> احتساب الكمية تلقائيًا من سعة البرنامج والمخزون المتاح <small>ألغِ الاختيار فقط لو تريد تخصيصًا يدويًا.</small></label><div class="form-grid three"><div class="field full"><label>البرنامج</label><select name="programId" required data-contract-allocation-kind="${kind}" data-contract-allocation-id="${id}">${programOptions}</select><small id="contractAllocationHint">اختيار البرنامج يملأ فترة الخدمة والكمية المقترحة.</small></div>${fields}</div>`; this.open(`تخصيص ${UmrahCore_ContractCenter.kindLabel(kind)} لبرنامج`, `${c.contractNo} — ${UmrahCore_ContractCenter.name(kind, c)}`, body, fd => UmrahCore_ContractCenter.allocate(kind, id, Object.fromEntries(fd))); },
    contractAllocationProgramChanged(kind, id, programId) { const c = UmrahCore_ContractCenter.get(kind, id), p = UmrahCore_Ops.program(programId), f = document.getElementById('modalForm') as HTMLFormElement | null, hint = document.getElementById('contractAllocationHint'); if (!c || !p || !f)
        return; const set = (n, v) => { const x = f.elements.namedItem(n) as HTMLInputElement | HTMLSelectElement | null; if (x)
        x.value = v ?? ''; }; if (kind === 'visa') {
        set('visas', Math.max(1, Math.min(UmrahCore_N(p.capacity), UmrahCore_ContractCenter.visaStats(c.id).available)));
        if (hint)
            hint.textContent = `الاتفاقية تغطي ${p.departureDate} → ${p.returnDate} • سعة البرنامج ${p.capacity}`;
    }
    else if (kind === 'hotel') {
        const from = c.from > p.departureDate ? c.from : p.departureDate, to = c.to && c.to < UmrahCore_dateAdd(p.returnDate, 1) ? c.to : UmrahCore_dateAdd(p.returnDate, 1);
        set('from', from);
        set('to', to);
        if (hint)
            hint.textContent = `الفترة المقترحة داخل البرنامج: ${from} → ${to} • سعة البرنامج ${p.capacity}`;
    }
    else if (kind === 'flight') {
        set('seats', Math.max(1, Math.min(UmrahCore_N(p.capacity), UmrahCore_ContractCenter.flightStats(c.id).available)));
        if (hint) hint.textContent = `رحلات العقد تطابق ${p.departureDate} → ${p.returnDate} • سعة البرنامج ${p.capacity}`;
    }
    else if (kind === 'service') {
        const from=c.from&&c.from>p.departureDate?c.from:p.departureDate,to=c.to&&c.to<p.returnDate?c.to:p.returnDate,need=c.unit==='pax'?UmrahCore_N(p.capacity):1; set('from',from);set('to',to);set('units',Math.max(1,Math.min(need,UmrahCore_ContractCenter.serviceStats(c.id).available||need))); if(hint)hint.textContent=`${c.serviceName} • ${from} → ${to} • المطلوب ${need} ${UmrahCore_Inventory.serviceUnitLabel(c.unit)}`;
    }
    else {
        const from = c.from && c.from > p.departureDate ? c.from : p.departureDate, to = c.to && c.to < p.returnDate ? c.to : p.returnDate, need = Math.max(1, Math.ceil(UmrahCore_N(p.capacity) / Math.max(1, UmrahCore_N(c.capacityPerVehicle) || UmrahCore_vehicleCaps[c.vehicleType] || 1)));
        set('from', from);
        set('to', to);
        set('vehicles', Math.min(need, UmrahCore_ContractCenter.transportStats(c.id, '', from, UmrahCore_dateAdd(to, 1)).availableVehicles || need));
        if (hint)
            hint.textContent = `الفترة المقترحة: ${from} → ${to} • المطلوب تقريبًا ${need} مركبة لسعة ${p.capacity}`;
    } },
    contractAmendment(kind,id){const c=UmrahCore_ContractCenter.get(kind,id);if(!c)return;this.open('إنشاء ملحق تعاقدي',`${c.contractNo} — ${UmrahCore_ContractCenter.name(kind,c)}`,`<div class="info-note">سيتم إنشاء نسخة مسودة مرتبطة بالعقد الأصلي. التخصيصات القديمة تبقى على العقد الأصلي ولا تتغير بأثر رجعي.</div><div class="field"><label>سبب الملحق</label><textarea name="reason" required placeholder="تغيير سعر / كمية / فترة / شرط تعاقدي..."></textarea></div>`,fd=>{const x=UmrahCore_ContractCenter.createAmendment(kind,id,fd.get('reason'));setTimeout(()=>UmrahCore_ContractCenter.edit(kind,x.id),0);return x;});},
    contractAllocationAdjustment(kind,reservationId){const r=UmrahCore_Ops.scoped('contractReservations').find(x=>x.id===reservationId&&x.kind===kind&&x.active!==false),c=r&&UmrahCore_ContractCenter.get(kind,r.contractId),p=r&&UmrahCore_Ops.program(r.programId);if(!r||!c||!p)return UmrahCore_UI.toast('التخصيص غير موجود');let fields='';if(kind==='hotel')fields=Object.keys(UmrahCore_roomCap).map(t=>`<div class="field"><label>${UmrahCore_roomLabel(t)}</label><input name="${t}Qty" type="number" min="0" value="${UmrahCore_N(r.allocation?.rooms?.[t])}"></div>`).join('');else if(kind==='flight')fields=`<div class="field"><label>المقاعد</label><input name="seats" type="number" min="0" value="${UmrahCore_N(r.allocation?.seats)}"></div>`;else if(kind==='visa')fields=`<div class="field"><label>التأشيرات</label><input name="visas" type="number" min="0" value="${UmrahCore_N(r.allocation?.visas)}"></div>`;else if(kind==='service')fields=`<div class="field"><label>الكمية</label><input name="units" type="number" min="0" value="${UmrahCore_N(r.allocation?.units)}"></div>`;else fields=`<div class="field"><label>المركبات</label><input name="vehicles" type="number" min="0" value="${UmrahCore_N(r.allocation?.vehicles)}"></div>`;this.open('تعديل التخصيص',`${c.contractNo} • ${UmrahCore_programDisplay(p)}`,`<div class="info-note">يمكن التخفيض أو الزيادة طالما المخزون متاح ولا تقل الكمية عن الاستخدام الفعلي. وجود فاتورة مورد يمنع التعديل بأثر رجعي.</div><div class="form-grid three">${fields}</div>`,fd=>UmrahCore_ContractCenter.adjustAllocation(kind,reservationId,Object.fromEntries(fd)));},
    contractCancel(kind, id) { const c = UmrahCore_ContractCenter.get(kind, id); if (!c)
        return UmrahCore_UI.toast('التعاقد غير موجود'); this.open('إلغاء التعاقد', `${c.contractNo} — ${UmrahCore_ContractCenter.name(kind, c)}`, `<div class="danger-note mb-12">لن يسمح النظام بإلغاء عقد عليه مخزون مخصص لبرنامج نشط. سبب الإلغاء يُحفظ في سجل التدقيق.</div><div class="field"><label>سبب الإلغاء</label><textarea name="reason" required placeholder="اكتب سبب إلغاء العقد"></textarea></div>`, fd => UmrahCore_ContractCenter.setStatus(kind, id, 'cancelled', fd.get('reason'))); },
    contractUnallocation(kind, reservationId) { const r = UmrahCore_Ops.scoped('contractReservations').find(x => x.id === reservationId && x.kind === kind && x.active !== false), c = r && UmrahCore_ContractCenter.get(kind, r.contractId), p = r && UmrahCore_Ops.program(r.programId); if (!r || !c || !p)
        return UmrahCore_UI.toast('التخصيص غير موجود'); const body = `<div class="danger-note mb-12"><b>تحرير موحد وليس حذفًا شكليًا:</b> سيحرر المخزون، يزيل قطاعات المسار التي أنشأها التخصيص، يعطل بند التكلفة ويلغي أمر الشراء إن لم توجد فاتورة مورد. إذا توجد فاتورة/تشغيل فعلي سيمنع النظام العملية.</div><div class="info-row"><div><b>${UmrahCore_esc(c.contractNo)} — ${UmrahCore_esc(UmrahCore_ContractCenter.name(kind, c))}</b><small>${UmrahCore_esc(UmrahCore_programDisplay(p))}</small></div><span>${UmrahCore_esc(UmrahCore_ContractCenter.allocationText(kind, r))}</span></div><div class="field mt-12"><label>سبب تحرير التخصيص</label><textarea name="reason" required placeholder="مثال: تغيير الفندق / إلغاء البلوك من المورد / تعديل البرنامج"></textarea></div>`; this.open('تحرير تخصيص العقد', 'سيتم عكس كل الآثار المرتبطة كوحدة واحدة.', body, fd => UmrahCore_ContractCenter.unallocate(kind, reservationId, fd.get('reason'))); },
    contractCommit(kind, id) { UmrahCore_UI.toast('استخدم «تخصيص لبرنامج»؛ النظام سينشئ التكلفة وأمر الشراء تلقائيًا بدون تكرار.'); return this.contractAllocation(kind, id); },

};
Object.assign(UmrahCore_Forms, UmrahCore_ContractForms);
export { UmrahCore_ContractForms };
