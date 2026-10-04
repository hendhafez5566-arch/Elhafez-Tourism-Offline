import { BrowserPlatform } from './platform/browser-platform';
import { registerPresentationPwa } from './platform/pwa-registration';
const PWA={
 register(){return registerPresentationPwa(BrowserPlatform.pwa)}
};
PWA.register();
export { PWA };
