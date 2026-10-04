import { BusinessValues } from '../business-values';
import type { BusinessNumber, UmrahBookingRuleRecord, UmrahFinanceSnapshot, UmrahProgramRuleRecord } from '../../application/business-contracts';
const UmrahBusinessRules = {
    programTransition(current: string, status: string, label: (status: string) => string) {
        const allowed: Record<string, string[]> = {
            planning: ['contracting', 'pricing', 'open', 'cancelled'], contracting: ['planning', 'pricing', 'open', 'cancelled'], pricing: ['contracting', 'open', 'cancelled'], open: ['salesClosed', 'cancelled'], salesClosed: ['open', 'operating', 'cancelled'], operating: ['traveling', 'cancelled'], traveling: ['returned'], returned: ['closed'], closed: [], cancelled: []
        };
        if (status !== current && !((allowed[current] || []).includes(status)))
            throw new Error(`الانتقال من ${label(current)} إلى ${label(status)} غير مسموح مباشرة`);
    },
    bookingTransition(current: string, status: string) {
        const allowed: Record<string, string[]> = {
            ready: ['confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending'], checkedIn: ['ready'], traveling: ['checkedIn'], returned: ['traveling'], closed: ['returned']
        };
        if (!(allowed[status] || []).includes(current))
            throw new Error('تسلسل حالة الحجز غير صحيح');
    },
    bookingGross(program: UmrahProgramRuleRecord, b: UmrahBookingRuleRecord) {
        const p = program.pricing || {}, c = b.counts || {};
        return Math.max(0, BusinessValues.number(c.adults) * BusinessValues.number(p[b.primaryRoomType] || p.quad) + BusinessValues.number(c.childBed) * BusinessValues.number(p.childBed) + BusinessValues.number(c.childNoBed) * BusinessValues.number(p.childNoBed) + BusinessValues.number(c.infants) * BusinessValues.number(p.infant));
    },
    discount(gross: number, discountValue: BusinessNumber, reason: string, limit: () => number, format: (value: number, digits: number) => string) {
        const discount = Math.max(0, BusinessValues.number(discountValue));
        if (discount > gross + 0.0001)
            throw new Error('الخصم لا يمكن أن يتجاوز قيمة الحجز');
        if (discount > 0 && !BusinessValues.text(reason).trim())
            throw new Error('سبب الخصم مطلوب');
        const pct = gross > 0 ? discount / gross * 100 : 0, max = limit();
        if (pct > max + 0.0001)
            throw new Error(`صلاحيتك تسمح بخصم حتى ${format(max, 1)}% فقط`);
        return true;
    },
    saleAllowed(p: UmrahProgramRuleRecord, status: string, date: () => string) {
        if (['inquiry', 'quotation', 'waitlist'].includes(status))
            return true;
        if (p.active === false)
            throw new Error('البرنامج موقوف');
        if (p.status !== 'open')
            throw new Error('لا يمكن إنشاء حجز مؤقت/مؤكد إلا والبرنامج مفتوح للبيع');
        if (p.salesCloseDate && date() > p.salesCloseDate)
            throw new Error(`تم إغلاق البيع للبرنامج بتاريخ ${p.salesCloseDate}`);
        return true;
    },
    syncPaymentStatus(b: UmrahBookingRuleRecord, f: UmrahFinanceSnapshot, date: () => string) {
        const paid = BusinessValues.number(f?.paid), rem = f?.remaining == null ? null : BusinessValues.number(f.remaining);
        if (f?.invoiceId) {
            b.hostInvoiceId = f.invoiceId;
            b.hostInvoiceNo = f.invoiceNo || b.hostInvoiceNo || '';
        }
        b.paymentStatus = !f?.invoiceId ? 'unbilled' : rem != null && rem <= 0.01 ? 'fullyPaid' : paid > 0 ? 'partiallyPaid' : 'unpaid';
        b.paymentRemaining = rem;
        b.paymentUpdatedAt = date();
        return b.paymentStatus;
    }
};
export { UmrahBusinessRules };
