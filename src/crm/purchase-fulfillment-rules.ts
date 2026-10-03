// Quantities, invoice linkage and status decisions are independent of the legacy store.
function createPurchaseFulfillmentRules(clock: Pick<BusinessClock, 'id' | 'now'>, recorded: (action: string, type: string, id: string, detail: string) => unknown) {
    return {
        normalizeLines(lines: BusinessLine[] = [], previous: BusinessLine[] = []) {
            return (lines || []).map((line, index) => {
                const old = (previous || []).find(x => x.id && x.id === line.id) || (previous || [])[index] || {};
                const qty = Math.max(0, BusinessValues.number(line.qty));
                return {
                    ...line, id: line.id || old.id || clock.id(), qty, receivedQty: Math.min(qty, Math.max(0, BusinessValues.number(old.receivedQty || line.receivedQty))), invoicedQty: Math.min(qty, Math.max(0, BusinessValues.number(old.invoicedQty || line.invoicedQty)))
                };
            });
        },
        received(po: BusinessPurchaseOrder) {
            return (po.lines || []).reduce((s, l) => s + Math.min(BusinessValues.number(l.qty), BusinessValues.number(l.receivedQty)), 0);
        },
        ordered(po: BusinessPurchaseOrder) {
            return (po.lines || []).reduce((s, l) => s + BusinessValues.number(l.qty), 0);
        },
        status(po: BusinessPurchaseOrder) {
            const ordered = this.ordered(po), received = this.received(po);
            if (received <= EPS)
                return 'approved';
            if (received + EPS < ordered)
                return 'partiallyReceived';
            return 'received';
        },
        record(po: BusinessPurchaseOrder, quantities: Record<string, number> = {}) {
            if (!po || !['approved', 'partiallyReceived', 'received', 'partiallyInvoiced'].includes(po.status))
                throw new Error('اعتمد أمر الشراء أولًا');
            po.lines = this.normalizeLines(po.lines, po.lines);
            for (const l of po.lines) {
                const raw = quantities[l.id] ?? quantities[l.description];
                if (raw === undefined)
                    continue;
                const next = Math.max(0, BusinessValues.number(raw));
                if (next + EPS < BusinessValues.number(l.invoicedQty))
                    throw new Error(`لا يمكن خفض المنفذ من «${l.description}» عن الكمية المفوترة`);
                if (next - BusinessValues.number(l.qty) > EPS)
                    throw new Error(`الكمية المنفذة في «${l.description}» أكبر من كمية أمر الشراء`);
                l.receivedQty = next;
            }
            const receiptStatus = this.status(po), invoiced = po.lines.reduce((s, l) => s + Math.min(BusinessValues.number(l.qty), BusinessValues.number(l.invoicedQty)), 0), ordered = this.ordered(po);
            po.status = invoiced > EPS && invoiced + EPS < ordered ? 'partiallyInvoiced' : (invoiced + EPS >= ordered && receiptStatus === 'received' ? 'converted' : receiptStatus);
            po.receivedAt = receiptStatus === 'received' ? (po.receivedAt || clock.now()) : '';
            po.updatedAt = clock.now();
            recorded('fulfill', 'purchaseOrder', po.id, `${po.no} — ${this.received(po)}/${this.ordered(po)}`);
            return po;
        },
        receiveAll(po: BusinessPurchaseOrder) {
            const q: Record<string, number> = {};
            for (const l of this.normalizeLines(po.lines, po.lines))
                q[l.id] = BusinessValues.number(l.qty);
            po.lines = this.normalizeLines(po.lines, po.lines);
            return this.record(po, q);
        },
        uninvoicedLines(po: BusinessPurchaseOrder, { legacyFull = true }: {
            legacyFull?: boolean;
        } = {}) {
            po.lines = this.normalizeLines(po.lines, po.lines);
            const tracked = po.lines.some(l => BusinessValues.number(l.receivedQty) > EPS || BusinessValues.number(l.invoicedQty) > EPS);
            return po.lines.map(l => {
                const received = tracked ? BusinessValues.number(l.receivedQty) : (legacyFull ? BusinessValues.number(l.qty) : 0), qty = Math.max(0, received - BusinessValues.number(l.invoicedQty));
                return qty > EPS ? {
                    ...l, qty
                } : null;
            }).filter(Boolean);
        },
        markInvoiced(po: BusinessPurchaseOrder, lines: BusinessLine[]) {
            po.lines = this.normalizeLines(po.lines, po.lines);
            for (const src of lines || []) {
                const l = po.lines.find(x => x.id === src.id) || po.lines.find(x => x.description === src.description);
                if (l)
                    l.invoicedQty = Math.min(BusinessValues.number(l.qty), BusinessValues.number(l.invoicedQty) + BusinessValues.number(src.qty));
            }
            po.invoiceIds = [...new Set([...(po.invoiceIds || []), po.invoiceId].filter(Boolean))];
            const remaining = this.uninvoicedLines(po, {
                legacyFull: false
            }).length;
            const allReceived = this.status(po) === 'received';
            po.status = remaining ? (allReceived ? 'received' : 'partiallyReceived') : (allReceived ? 'converted' : 'partiallyInvoiced');
            po.updatedAt = clock.now();
        },
        rollbackInvoice(po: BusinessPurchaseOrder, inv: BusinessInvoice) {
            if (!po || !inv)
                return;
            po.lines = this.normalizeLines(po.lines, po.lines);
            for (const src of inv.lines || []) {
                const id = src.purchaseOrderLineId;
                const l = (id && po.lines.find(x => x.id === id)) || po.lines.find(x => x.description === src.description);
                if (l)
                    l.invoicedQty = Math.max(0, BusinessValues.number(l.invoicedQty) - BusinessValues.number(src.qty));
            }
            po.invoiceIds = (po.invoiceIds || []).filter(x => x !== inv.id);
            po.invoiceId = po.invoiceIds.slice(-1)[0] || '';
            po.status = this.status(po);
            po.updatedAt = clock.now();
        }
    };
}
