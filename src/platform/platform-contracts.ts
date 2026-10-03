interface PresentationDomPort {
    element(id: string): HTMLElement | null;
    form(id: string): HTMLFormElement | null;
}
interface PresentationScheduler {
    timeout(work: () => void, delay: number): void;
    idle(work: () => void, timeout: number, fallbackDelay: number): void;
}
interface CurrentPrintPort {
    printCurrent(title: string): void;
}
interface PwaRegistrationPort {
    native(): boolean;
    supported(): boolean;
    hostname(): string;
    protocol(): string;
    onLoad(work: () => void): void;
    register(): Promise<{
        update(): Promise<unknown>;
    }>;
    timeout(work: () => void, delay: number): void;
}
interface ContactBridgePort {
    available(): boolean;
    pick(field: string): void;
    listen(work: (detail: {
        field?: string;
        phone?: string;
        name?: string;
    }) => void): void;
}
interface NotificationPresentationPort {
    notify(message: string, kind?: string): void;
}
interface StorePresentationEffects {
    canRender(): boolean;
    render(): void;
    notify(message: string, kind: string): void;
    schedule(work: () => void): void;
}
interface SessionPresentationEffects {
    clear(key: string): void;
    expired(message: string): void;
}
interface NativeDocumentPrintPort {
    printHtmlA4?(html: string, fileName: string, orientation: string): void;
    printHtml?(html: string, fileName: string): void;
}
interface PrintFramePort {
    write(html: string): void;
    ready(): Promise<unknown> | undefined;
    print(): void;
}
interface DocumentPrintPresentationDeps {
    frame(): PrintFramePort;
    scheduler: PresentationScheduler;
}
// Compatibility callbacks for the existing Umrah integration bridge, not a global dispatcher.
interface UmrahPresentationCommands {
    openPage(page: string): unknown;
    openForm(type: string, context: Record<string, unknown>): unknown;
    openPartyActions(type: string, id: string): unknown;
}
export type { ContactBridgePort, CurrentPrintPort, DocumentPrintPresentationDeps, NativeDocumentPrintPort, NotificationPresentationPort, PresentationDomPort, PresentationScheduler, PrintFramePort, PwaRegistrationPort, SessionPresentationEffects, StorePresentationEffects, UmrahPresentationCommands };
