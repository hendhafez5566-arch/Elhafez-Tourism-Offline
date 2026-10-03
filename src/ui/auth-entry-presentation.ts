import type { PresentationDomPort } from '../platform/platform-contracts';
interface AuthEntryPresentationDeps {
    dom: PresentationDomPort;
    initialize(): unknown;
    before(): void;
    after(): void;
    escape(value: string): string;
    failed(error: unknown): void;
}
function enterAuthenticatedPresentation(deps: AuthEntryPresentationDeps): boolean {
    deps.before();
    const login = deps.dom.element('login'), app = deps.dom.element('app');
    login?.classList.add('hidden');
    app?.classList.remove('hidden');
    try {
        deps.initialize();
    }
    catch (error) {
        deps.failed(error);
        const pages = deps.dom.element('pages');
        const message = (error as {
            message?: string;
        })?.message || 'خطأ غير متوقع في الواجهة';
        if (pages)
            pages.innerHTML = `<section class="page active"><div class="empty-state"><h3>تعذر تجهيز واجهة النظام</h3><p>${deps.escape(message)}</p></div></section>`;
        throw error;
    }
    deps.after();
    return true;
}
export { enterAuthenticatedPresentation };
export type { AuthEntryPresentationDeps };
