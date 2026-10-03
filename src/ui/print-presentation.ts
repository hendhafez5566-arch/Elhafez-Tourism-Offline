function printDocumentFallback(deps: DocumentPrintPresentationDeps, payload: {
    html: string;
    fileName: string;
    orientation: string;
}): void {
    const frame = deps.frame();
    frame.write(payload.html);
    const run = () => frame.print(), ready = frame.ready();
    if (ready)
        ready.then(() => deps.scheduler.timeout(run, 40)).catch(() => deps.scheduler.timeout(run, 80));
    else
        deps.scheduler.timeout(run, 80);
}
