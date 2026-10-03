const ManualJournalRules = {
    created(record: ManualJournalRecord) {
        if (!record.memo)
            throw new Error('بيان القيد مطلوب');
        if (record.lines.length < 2)
            throw new Error('القيد يحتاج طرفين على الأقل');
    },
    editable(record: ManualJournalRecord | undefined) {
        if (!record || record.status !== 'draft')
            throw new Error('المسودة غير متاحة');
    },
    postable(record: ManualJournalRecord | undefined) {
        if (!record || record.status !== 'draft')
            throw new Error('مسودة القيد غير متاحة');
    },
    removable(record: ManualJournalRecord | undefined) {
        if (!record || record.status !== 'draft')
            throw new Error('الحذف للمسودة فقط');
    },
    reversible(record: ManualJournalRecord | undefined) {
        if (!record || record.status !== 'posted')
            throw new Error('القيد غير متاح للعكس');
    },
    recurringCreated(record: RecurringJournalRecord) {
        if (!record.name || record.lines.length < 2)
            throw new Error('بيانات القيد المتكرر غير مكتملة');
    }
};
