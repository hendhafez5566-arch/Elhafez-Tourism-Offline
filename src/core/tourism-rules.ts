import { BusinessValues } from './business-values';
import type { TourismBooking, TourismService } from '../application/business-contracts';
const TourismRules = {
    complete(record: TourismBooking | TourismService | undefined, kind: 'service' | 'booking') {
        if (!record || record.status !== 'confirmed')
            throw new Error(kind === 'service' ? 'الخدمة غير متاحة' : 'الحجز غير متاح للإكمال');
        record.status = 'completed';
        return record;
    },
    reopen(record: TourismBooking | TourismService | undefined, reason: string, kind: 'service' | 'booking') {
        if (!record || record.status !== 'completed')
            throw new Error(kind === 'service' ? 'الخدمة غير مكتملة' : 'الحجز غير مكتمل');
        if (!BusinessValues.text(reason).trim())
            throw new Error('سبب إعادة الفتح مطلوب');
        record.status = 'confirmed';
        record.reopenReason = reason;
        return record;
    },
    confirmable(service: TourismService | undefined) {
        if (!service || service.status !== 'draft')
            throw new Error('الخدمة غير متاحة للاعتماد');
        if (BusinessValues.number(service.externalCost) > 0 && !service.supplierId)
            throw new Error('الجزء الخارجي من التكلفة يتطلب موردًا');
    }
};
export { TourismRules };
