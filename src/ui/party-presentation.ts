import type { Party360PresentationDeps, UnifiedPartyPresentationDeps } from './presentation-contracts';
function createUnifiedPartyPresentation(deps: UnifiedPartyPresentationDeps) {
    return {
        openLinkRole(type: string, id: string, targetType: string) { const candidates = deps.linkCandidates(type, id, targetType); if (!candidates.length)
            return deps.notify(`لا يوجد ${deps.roleLabel(targetType)} مناسب وغير مرتبط`, 'warning'); const modal = deps.dom.element('modal'), form = deps.dom.form('modalForm') as HTMLFormElement; deps.dom.element('modalTitle').textContent = `ربط دور ${deps.roleLabel(targetType)}`; deps.dom.element('modalSubtitle').textContent = 'اختر سجلًا موجودًا لنفس الشخص/الشركة. الربط لا يدمج القيود المحاسبية.'; deps.dom.element('modalIcon').innerHTML = deps.icon(deps.roleIcon(targetType)); deps.dom.element('modalSubmitText').textContent = 'ربط السجل'; deps.dom.element('modalBody').innerHTML = `<div class="field"><label>${deps.roleLabel(targetType)} الموجود</label><select name="targetId" required>${candidates.map(x => `<option value="${deps.escape(x.id)}">${deps.escape(x.no || '')} — ${deps.escape(x.name || '')} ${x.phone ? `— ${deps.escape(x.phone)}` : ''}</option>`).join('')}</select></div><div class="form-note">لن يتم نقل أو حذف أي فاتورة أو قيد. سيصبح السجلان أدوارًا لنفس الطرف فقط.</div>`; modal.classList.add('show'); form.onsubmit = async (e) => { e.preventDefault(); const fd = new FormData(form), targetId = String(fd.get('targetId') ?? ''); try {
            await deps.linkRole(type, id, targetType, targetId);
            deps.close();
            deps.notify(`تم ربط دور ${deps.roleLabel(targetType)}`);
            deps.scheduler.timeout(() => deps.reopen(type, id), 30);
        }
        catch (err) {
            deps.notify(err.message, 'error');
        } }; },
        openNetting(type: string, id: string) { const pairs = deps.nettingPairs(type, id); if (!pairs.length)
            return deps.notify('لا توجد أرصدة متقابلة قابلة للمقاصة حاليًا', 'warning'); const first = pairs[0], modal = deps.dom.element('modal'), form = deps.dom.form('modalForm') as HTMLFormElement; deps.dom.element('modalTitle').textContent = 'مقاصة عميل / مورد / مندوب'; deps.dom.element('modalSubtitle').textContent = 'تُرحّل المقاصة بقيد رسمي بين الحسابات الرقابية ولا تحذف أي فاتورة أو حركة أصلية.'; deps.dom.element('modalIcon').innerHTML = deps.icon('journal'); deps.dom.element('modalSubmitText').textContent = 'اعتماد المقاصة'; deps.dom.element('modalBody').innerHTML = `<div class="field full"><label>الأرصدة المتقابلة</label><select name="pairRef" required>${pairs.map(p => `<option value="${deps.escape(p.key)}" data-max="${p.max}" data-currency="${p.currency}">${deps.escape(p.payable.label)} ${deps.money(p.payable.available, p.currency)} ↔ ${deps.escape(p.receivable.label)} ${deps.money(p.receivable.available, p.currency)} — الحد ${deps.money(p.max, p.currency)}</option>`).join('')}</select></div><div class="form-grid"><div class="field"><label>المبلغ</label><input name="amount" type="number" min="0.01" step="0.01" value="${first.max}" required></div><div class="field"><label>العملة</label><input name="currency" value="${first.currency}" readonly></div><div class="field"><label>التاريخ</label><input name="date" type="date" value="${deps.today()}" required></div><div class="field full"><label>البيان</label><textarea name="note">مقاصة ذمم نفس الطرف</textarea></div></div><div class="form-note">لا يمكن اعتماد قيمة أكبر من أقل الرصيدين. بعد الاعتماد لا تُعدّل المقاصة؛ عند الخطأ يتم عكسها بقيد عكسي.</div>`; modal.classList.add('show'); form.querySelector('[name="pairRef"]')?.addEventListener('change', (e: Event) => { const o = (e.target as HTMLSelectElement).selectedOptions?.[0], amount = form.elements.namedItem('amount') as HTMLInputElement, currency = form.elements.namedItem('currency') as HTMLInputElement; if (o && amount)
            amount.value = o.dataset.max || ''; if (o && currency)
            currency.value = o.dataset.currency || ''; }); form.onsubmit = async (e) => { e.preventDefault(); const fd = new FormData(form); try {
            const x = await deps.postNetting(type, id, { pairRef: fd.get('pairRef') as string, amount: fd.get('amount') as string, currency: fd.get('currency') as string, date: fd.get('date') as string, note: fd.get('note') as string });
            deps.close();
            deps.notify(`تم اعتماد المقاصة ${x.no}`);
            deps.scheduler.timeout(() => deps.reopen(type, id), 30);
        }
        catch (err) {
            deps.notify(err.message, 'error');
        } }; },
        async reversePrompt(type: string, id: string, nettingId: string) { const x = deps.netting(nettingId); if (!x)
            return; return deps.child(() => deps.confirm('عكس المقاصة', `سيتم إنشاء قيد عكسي للمقاصة ${x.no}. لن يتم حذف المستند الأصلي.`, async () => { await deps.reverseNetting(nettingId, 'عكس مقاصة بطلب المستخدم'); deps.notify(`تم عكس المقاصة ${x.no}`); deps.scheduler.timeout(() => deps.reopen(type, id), 30); }, { label: 'عكس المقاصة', danger: true })); }
    };
}
function createParty360Presentation(deps: Party360PresentationDeps) {
    return {
        open(type: string, id: string) { const d = deps.base(type, id), m = deps.dom.element('modal'), f = deps.dom.form('modalForm'); deps.dom.element('modalTitle').textContent = `المزيد — ${d.x.name}`; deps.dom.element('modalSubtitle').textContent = ''; deps.dom.element('modalIcon').innerHTML = deps.icon(d.cfg.icon); deps.dom.element('modalSubmitText').textContent = 'إغلاق'; deps.dom.element('modalBody').innerHTML = deps.shell(type, id); m.classList.add('show'); f.onsubmit = e => { e.preventDefault(); deps.close(); }; deps.loadTab(type, id, 'overview'); }
    };
}
export { createParty360Presentation, createUnifiedPartyPresentation };
