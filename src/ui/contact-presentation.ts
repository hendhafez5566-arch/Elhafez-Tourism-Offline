import type { ContactBridgePort, NotificationPresentationPort, PresentationDomPort } from '../platform/platform-contracts';
interface ContactPresentationDeps {
    dom: PresentationDomPort;
    bridge: ContactBridgePort;
    notification: NotificationPresentationPort;
}
function bindContactPresentation(deps: ContactPresentationDeps): void {
    deps.bridge.listen(detail => {
        const field = String(detail.field || '');
        if (!field)
            return;
        const form = deps.dom.form('modalForm');
        const input = form?.elements?.namedItem?.(field) as HTMLInputElement | null;
        if (!input)
            return;
        input.value = String(detail.phone || '');
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        input.focus?.();
        deps.notification.notify(detail.name ? `تم اختيار رقم ${detail.name}` : 'تم اختيار رقم الهاتف');
    });
}
function pickContactPresentation(deps: ContactPresentationDeps, field: string): void {
    if (!deps.bridge.available())
        return deps.notification.notify('اختيار الرقم من جهات الاتصال متاح داخل تطبيق Android', 'warning');
    try {
        deps.bridge.pick(String(field || ''));
    }
    catch (_) {
        deps.notification.notify('تعذر فتح جهات الاتصال', 'error');
    }
}
export { bindContactPresentation, pickContactPresentation };
export type { ContactPresentationDeps };
