import { UI } from '../../ui/ui';
import { UmrahCore_S, UmrahCore_esc, UmrahCore_programDisplay, UmrahCore_programLabel, UmrahCore_today } from './runtime';
import { UmrahCore_Bridge, UmrahCore_DB } from './data';
import { UmrahCore_Ops } from './operations';
import { UmrahCore_UI } from './ui';
import { __set_UmrahCore_Forms } from '../late-bindings';
import { UmrahCore_FormsContracts } from './forms-contract-entities';
import { UmrahCore_FormsPrograms } from './forms-programs';
import { UmrahCore_FormsBookings } from './forms-bookings';
import { UmrahCore_FormsTrip } from './forms-trip';
const UmrahCore_Forms: any = {
    open(title, sub, body, submit, options: any = {}) { const m = document.getElementById('modal'), f = document.getElementById('modalForm') as HTMLFormElement; document.getElementById('modalTitle').textContent = title; document.getElementById('modalSubtitle').textContent = sub || ''; document.getElementById('modalBody').innerHTML = body; const save=(UI.resetModalFooter?.(options.submitLabel || 'حفظ')||f.querySelector('button[type=submit]')) as HTMLButtonElement | null; m.classList.add('show'); f.noValidate = true; f.onsubmit = async (e) => { e.preventDefault(); if (f.dataset.busy === '1') return; try { for (const input of (e.target as HTMLFormElement).querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]')) { if (input.disabled || input.type === 'hidden') continue; const v = input.type === 'checkbox' ? (input as HTMLInputElement).checked : UmrahCore_S(input.value).trim(); if (!v) { input.focus?.(); const label = input.closest('.field')?.querySelector('label')?.textContent?.replace('*', '').trim() || 'هذا الحقل'; throw new Error(`أكمل الحقل المطلوب: ${label}`); } } for (const w of (e.target as HTMLFormElement).querySelectorAll<HTMLElement>('.smart-picker')) { const h = w.querySelector('input[type=hidden]') as HTMLInputElement | null, i = w.querySelector('.picker-input') as HTMLInputElement | null; if (i?.required && !h?.value) { i.focus?.(); throw new Error('اختر القيمة من نتائج البحث'); } } f.dataset.busy = '1'; if (save) save.disabled = true; const strict = options.strict === true; await UmrahCore_DB.atomicAsync('formSubmit', async () => await submit(new FormData(e.target as HTMLFormElement)), { save: true, render: false, strict, waitForSave: strict }); UmrahCore_Forms.close(); UmrahCore_UI.render(); } catch (err) { UmrahCore_UI.toast(err.message || 'تعذر الحفظ'); } finally { delete f.dataset.busy; if (save) save.disabled = false; } }; },
    view(title, sub, body) { const m = document.getElementById('modal'), f = document.getElementById('modalForm') as HTMLFormElement; document.getElementById('modalTitle').textContent = title; document.getElementById('modalSubtitle').textContent = sub || ''; document.getElementById('modalBody').innerHTML = body; UI.resetModalFooter?.('إغلاق',{hideSubmit:true,cancel:'إغلاق'}); m.classList.add('show'); f.onsubmit = e => e.preventDefault(); },
    close() { UI.closeModal(); },
    pickerSource(kind) { if (kind === 'customer')
        return UmrahCore_Bridge.customers().map(x => ({ value: x.id, label: `${x.no ? x.no + ' — ' : ''}${x.name}`, sub: x.phone || '' })); if (kind === 'program')
        return UmrahCore_Ops.scoped('programs').filter(p => p.status !== 'cancelled').map(x => ({ value: x.id, label: `${x.no} — ${UmrahCore_programDisplay(x)}`, sub: `${x.departureDate} • ${UmrahCore_programLabel(x.status)} • متاح ${UmrahCore_Ops.availablePersons(x.id)}` })); if (kind === 'saleProgram')
        return UmrahCore_Ops.scoped('programs').filter(p => p.active !== false && p.status === 'open' && (!p.salesCloseDate || UmrahCore_today() <= p.salesCloseDate)).map(x => ({ value: x.id, label: `${x.no} — ${UmrahCore_programDisplay(x)}`, sub: `${x.departureDate} • مفتوح للبيع • متاح ${UmrahCore_Ops.availablePersons(x.id)}` })); if (kind === 'traveler')
        return UmrahCore_Ops.scoped('travelers').filter(t => t.active !== false).map(t => ({ value: t.id, label: `${t.no} — ${t.nameAr || 'غير مكتمل'}`, sub: UmrahCore_Ops.program(t.programId)?.name || '' })); return []; },
    pickerDisplay(kind, value) { return this.pickerSource(kind).find(x => x.value === value)?.label || ''; },
    picker(name, label, kind, value = '', placeholder = 'ابحث بالاسم أو الكود...') { return `<div class="field"><label>${label}</label><div class="smart-picker"><input type="hidden" name="${name}" value="${UmrahCore_esc(value)}"><input class="picker-input" type="search" autocomplete="off" value="${UmrahCore_esc(this.pickerDisplay(kind, value))}" data-kind="${kind}" placeholder="${UmrahCore_esc(placeholder)}" onfocus="UmrahCore_Forms.pickerSearch(this,false)" data-umrah-picker-search="1" required><div class="picker-results"></div></div></div>`; },
    pickerSearch(input, changed = false) { const wrap = input.closest('.smart-picker'), hidden = wrap.querySelector('input[type=hidden]'), box = wrap.querySelector('.picker-results'), q = UmrahCore_S(input.value).trim().toLowerCase(); if (changed)
        hidden.value = ''; let src = this.pickerSource(input.dataset.kind); if (q)
        src = src.filter(x => `${x.label} ${x.sub}`.toLowerCase().includes(q)); src = src.slice(0, 15); box.innerHTML = src.length ? src.map(x => `<button type="button" class="picker-option" data-value="${UmrahCore_esc(x.value)}" data-label="${UmrahCore_esc(x.label)}" data-umrah-picker-choose="1"><b>${UmrahCore_esc(x.label)}</b><small>${UmrahCore_esc(x.sub)}</small></button>`).join('') : '<div class="picker-empty">لا توجد نتائج</div>'; },
    pickerChoose(btn) { const w = btn.closest('.smart-picker'); w.querySelector('input[type=hidden]').value = btn.dataset.value; w.querySelector('.picker-input').value = btn.dataset.label; w.querySelector('.picker-results').innerHTML = ''; },
    ...UmrahCore_FormsContracts,
    ...UmrahCore_FormsPrograms,
    ...UmrahCore_FormsBookings,
    ...UmrahCore_FormsTrip
};
__set_UmrahCore_Forms(UmrahCore_Forms);
export { UmrahCore_Forms };
