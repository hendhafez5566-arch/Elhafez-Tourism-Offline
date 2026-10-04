import { UmrahCore_Bridge, UmrahCore_DB, type DataRow } from './data';
import { __set_UmrahCore_Ops } from '../late-bindings';
import { UmrahCore_OpsContracts } from './operations-contracts';
import { UmrahCore_OpsPrograms } from './operations-programs';
import { UmrahCore_OpsSchedule } from './operations-schedule';
import { UmrahCore_OpsBookings } from './operations-bookings';
import { UmrahCore_OpsTravelers } from './operations-travelers';
import { UmrahCore_travelerIdentityKey, UmrahCore_duplicateTravelerGroups, UmrahCore_duplicateTravelerIds } from './operations-identity';
const UmrahCore_Ops: any = {
    activeBookingStatuses: new Set(['hold', 'confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling']),
    resourceBookingStatuses: new Set(['hold', 'confirmed', 'partiallyPaid', 'fullyPaid', 'docsPending', 'ready', 'checkedIn', 'traveling', 'cancelRequested']),
    season(id) { return this.scoped('seasons').find(x => x.id === id); }, program(id) { return (UmrahCore_DB.data.programs || []).find(x => x.id === id && UmrahCore_Bridge.branchMatch(x)); }, booking(id) { return this.scoped('bookings').find(x => x.id === id); }, traveler(id) { return this.scoped('travelers').find(x => x.id === id); }, segment(id) { return this.scoped('programSegments').find(x => x.id === id); }, scoped(name: string): DataRow[] { return (UmrahCore_DB.data[name] || []).filter(x => UmrahCore_Bridge.branchMatch(x) && (name !== 'programs' || x.deleted !== true)); }, activeTravelers(programId) { const bookings = this.scoped('bookings'); return this.scoped('travelers').filter(t => t.programId === programId && t.active !== false && bookings.some(b => b.id === t.bookingId && this.activeBookingStatuses.has(b.status))); },
    ...UmrahCore_OpsContracts,
    ...UmrahCore_OpsPrograms,
    ...UmrahCore_OpsSchedule,
    ...UmrahCore_OpsBookings,
    ...UmrahCore_OpsTravelers,
};
__set_UmrahCore_Ops(UmrahCore_Ops);
const UmrahCore_AdvancedPages = [
    ['seasons', '◫', 'المواسم', 'فترات التشغيل والبيع'], ['contracts', '▥', 'التعاقدات والمخزون', 'فنادق وطيران ونقل وتأشيرات'], ['programs', '▣', 'البرامج والمسار', 'التعديل الفني للبرنامج ومحطات الرحلة'], ['program-workspace', '✓', 'مساحة عمل البرنامج', 'ملخص البرنامج والخطوة التالية بعد الإنشاء'], ['costing', '◈', 'التكلفة والتسعير', 'الميزانية التقديرية ونقطة التعادل'], ['bookings', '▤', 'مركز الحجوزات', 'كل الحجوزات والحالات'], ['travelers', '👥', 'ملفات المسافرين', 'الجوازات والبيانات'], ['hajj-services', '◉', 'خدمات الحج', 'التصاريح / نسك والمخيمات والمشاعر'], ['hotels', '▦', 'الفنادق وتوزيع الغرف', 'التوزيع على الإقامات'], ['visas', '◇', 'التأشيرات', 'دفعات ومراحل التقديم'], ['flights', '✈', 'الطيران والتذاكر', 'PNR وتذاكر ومقاعد'], ['transport', '▰', 'النقل والباصات', 'التوزيع وكشوف التشغيل'], ['procurement', '¤', 'مشتريات الموردين', 'الأوامر والالتزامات والفواتير'], ['control', '◎', 'مركز الجاهزية', 'الموانع قبل السفر'], ['tripops', '⌁', 'تشغيل الرحلة', 'المسار والمهام اليومية'], ['incidents', '!', 'المشاكل والحوادث', 'سجل الحوادث والمشكلات'], ['documents', '▥', 'المستندات والتقارير', 'قوائم وربحية'], ['settings', '⚙', 'إعدادات الحج والعمرة', 'سياسات التشغيل']
];
export { UmrahCore_AdvancedPages, UmrahCore_Ops, UmrahCore_duplicateTravelerGroups, UmrahCore_duplicateTravelerIds, UmrahCore_travelerIdentityKey };
