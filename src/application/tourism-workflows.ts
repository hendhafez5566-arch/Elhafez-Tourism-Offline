import { BusinessValues } from '../core/business-values';
import { TourismRules } from '../core/tourism-rules';
import type { BusinessInvoice, TourismWorkflowDeps } from './business-contracts';
const TourismWorkflows = {
    reopenBooking(d: TourismWorkflowDeps, id: string, reason: string) {
        const b = BusinessValues.find(d.repository.bookings, id);
        TourismRules.reopen(b, reason, 'booking');
        d.persistence.log('reopen', 'booking', id, reason);
    },
    completeBooking(d: TourismWorkflowDeps, id: string) {
        const b = BusinessValues.find(d.repository.bookings, id);
        TourismRules.complete(b, 'booking');
        d.persistence.log('complete', 'booking', id, b.no);
    },
    confirmService(d: TourismWorkflowDeps, id: string) {
        return d.transactions.atomic('confirmService', () => {
            const s = BusinessValues.find(d.repository.services, id);
            TourismRules.confirmable(s);
            const c = BusinessValues.find(d.repository.customers, s.customerId), agent = s.agentId && BusinessValues.find(d.repository.agents, s.agentId);
            if (s.billTo === 'agent' && !agent)
                throw new Error('المندوب مطلوب');
            const debtorType = s.billTo === 'agent' ? 'agent' : 'customer', debtorId = s.billTo === 'agent' ? agent.id : c.id;
            if (s.sale > 0) {
                const inv: BusinessInvoice = d.invoices.create({
                    kind: 'customer', partyId: debtorId, partyType: debtorType, currency: s.saleCurrency, date: s.date, dueDate: s.dueDate, description: `${s.type} — ${c.name}`, sourceType: 'service', sourceId: s.id, costCenterId: s.costCenterId, lines: [{
                            description: s.description || s.type, qty: 1, price: s.sale, discount: 0, taxId: s.saleTaxId || 'TAX0', accountId: '4200', costCenterId: s.costCenterId
                        }], status: 'draft'
                });
                inv.revenueAccountId = '4200';
                d.invoices.post(inv);
                s.customerInvoiceId = inv.id;
                s.billingStatus = inv.status;
            }
            if (BusinessValues.number(s.externalCost) > 0) {
                const sp = BusinessValues.find(d.repository.suppliers, s.supplierId);
                if (!sp)
                    throw new Error('المورد الخارجي غير موجود');
                const inv: BusinessInvoice = d.invoices.create({
                    kind: 'supplier', partyId: sp.id, partyType: 'supplier', currency: s.externalCostCurrency || s.costCurrency, date: s.date, dueDate: s.supplierDueDate, description: `تكلفة خارجية ${s.type}`, sourceType: 'service', sourceId: s.id, costCenterId: s.costCenterId, lines: [{
                            description: `الجزء الخارجي — ${s.type}`, qty: 1, price: s.externalCost, discount: 0, taxId: s.costTaxId || 'TAX0', accountId: '5100', costCenterId: s.costCenterId
                        }], status: 'draft'
                });
                inv.expenseAccountId = '5100';
                d.invoices.post(inv);
                s.supplierInvoiceId = inv.id;
                s.supplierBillingStatus = inv.status;
            }
            s.status = 'confirmed';
            d.ensureServiceCommission(s);
            return s;
        });
    },
    completeService(d: TourismWorkflowDeps, id: string) {
        const s = BusinessValues.find(d.repository.services, id);
        TourismRules.complete(s, 'service');
        d.persistence.log('complete', 'service', id, s.no);
    },
    reopenService(d: TourismWorkflowDeps, id: string, reason: string) {
        const s = BusinessValues.find(d.repository.services, id);
        TourismRules.reopen(s, reason, 'service');
        d.persistence.log('reopen', 'service', id, reason);
    }
};
export { TourismWorkflows };
