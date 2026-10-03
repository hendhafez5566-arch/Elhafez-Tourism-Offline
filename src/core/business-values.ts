// Pure values shared by domain rules and application use cases.
const BusinessValues = {
    find<T extends {
        id: string;
    }>(records: T[], id: string): T | undefined {
        return records.find(record => record.id === id);
    }, number(value: unknown): number {
        return Number(value) || 0;
    }, text(value: unknown): string {
        return String(value ?? '');
    }, live(record: {
        status: string;
        deleted?: boolean;
    } | undefined): boolean {
        return !!record && record.status !== 'void' && record.status !== 'cancelled' && record.status !== 'rejected' && record.deleted !== true;
    }
};
export { BusinessValues };
