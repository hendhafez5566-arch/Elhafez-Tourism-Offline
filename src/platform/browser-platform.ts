import type { ContactBridgePort, CurrentPrintPort, NativeDocumentPrintPort, PresentationDomPort, PresentationScheduler, PrintFramePort, PwaRegistrationPort } from './platform-contracts';
// Browser mechanics only. Presentation logic receives these focused ports.
interface NativePresentationWindow extends Window {
    NativePrint?: NativeDocumentPrintPort;
    NativeShell?: {
        isNative?(): boolean;
        pickContactPhone?(field: string): void;
    };
    Capacitor?: {
        isNativePlatform?(): boolean;
    };
}
const BrowserPlatform = (() => {
    let currentPrint: (() => void) | null = null;
    return {
        dom: {
            element: (id: string) => document.getElementById(id),
            form: (id: string) => document.getElementById(id) as HTMLFormElement | null
        } satisfies PresentationDomPort,
        scheduler: {
            timeout: (work: () => void, delay: number) => { setTimeout(work, delay); },
            idle(work: () => void, timeout: number, fallbackDelay: number) {
                if (typeof requestIdleCallback === 'function')
                    requestIdleCallback(work, { timeout });
                else
                    setTimeout(work, fallbackDelay);
            }
        } satisfies PresentationScheduler,
        configureCurrentPrint(native: CurrentPrintPort, title: () => string) {
            const fallback = window.print.bind(window);
            currentPrint = () => {
                try {
                    native.printCurrent(title());
                }
                catch (error) {
                    console.error('[print] native current-view print failed', error);
                    fallback();
                }
            };
        },
        printCurrent() { if (currentPrint)
            currentPrint();
        else
            window.print(); },
        contacts: {
            available: () => typeof (window as NativePresentationWindow).NativeShell?.pickContactPhone === 'function',
            pick(field: string) { (window as NativePresentationWindow).NativeShell?.pickContactPhone?.(field); },
            listen(work: (detail: {
                field?: string;
                phone?: string;
                name?: string;
            }) => void) {
                window.addEventListener('erp:native-contact-picked', event => work((event as CustomEvent<{
                    field?: string;
                    phone?: string;
                    name?: string;
                }>).detail || {}));
            }
        } satisfies ContactBridgePort,
        pwa: {
            native() {
                let native = (window as NativePresentationWindow).Capacitor?.isNativePlatform?.() === true;
                try {
                    native = native || (window as NativePresentationWindow).NativeShell?.isNative?.() === true;
                }
                catch (_) { }
                return native;
            },
            supported: () => 'serviceWorker' in navigator,
            hostname: () => location.hostname,
            protocol: () => location.protocol,
            onLoad: (work: () => void) => { window.addEventListener('load', work, { once: true }); },
            register: () => navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }),
            timeout: (work: () => void, delay: number) => { setTimeout(work, delay); }
        } satisfies PwaRegistrationPort,
        documents: {
            native: () => (window as NativePresentationWindow).NativePrint,
            frame(): PrintFramePort {
                const frame = document.getElementById('printFrame') as HTMLIFrameElement;
                const doc = frame.contentWindow!.document;
                return {
                    write(html) { doc.open(); doc.write(html); doc.close(); },
                    ready: () => doc.fonts?.ready,
                    print() { frame.contentWindow!.focus(); frame.contentWindow!.print(); }
                };
            }
        },
        renderFrame(work: () => void) { if (typeof requestAnimationFrame === 'function')
            requestAnimationFrame(work);
        else
            setTimeout(work, 0); },
        clearSession(key: string) { sessionStorage.removeItem(key); },
        online: () => typeof navigator !== 'undefined' ? navigator.onLine : true,
        reloadOnOnline() { window.addEventListener('online', () => location.reload(), { once: true }); }
    };
})();
export { BrowserPlatform };
