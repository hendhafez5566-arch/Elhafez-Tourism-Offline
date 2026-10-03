import type { PwaRegistrationPort } from './platform-contracts';
function registerPresentationPwa(port: PwaRegistrationPort): void {
    if (port.native())
        return;
    if (!port.supported())
        return;
    const local = /^(localhost|127(?:\.\d+){3}|\[::1\])$/i.test(port.hostname());
    if (port.protocol() !== 'https:' && !local)
        return;
    port.onLoad(() => {
        port.register().then(reg => { port.timeout(() => reg.update().catch(() => { }), 5000); }).catch(() => { });
    });
}
export { registerPresentationPwa };
