import { esc, icon } from '../core/runtime';
import { Auth } from '../security/auth';
import { Party360 } from './party360';
import { PageGroup } from './navigation';
import { UI } from './ui';
import { CoreSuites } from '../core/suites';
import { WorkCenter } from './work-center';
import { __set_Pages } from '../core/late-bindings';
import { Pages_Operations } from './operations-pages';
import { Pages_Accounting } from './accounting-pages';
import { Pages_Admin } from './admin-pages';
import { Pages_Settings } from './settings-pages';
import { AccessControl } from '../security/access-control';
const Pages = {
    'umrah-dashboard'(){return CoreSuites.render('umrah','umrah-dashboard')},
    'umrah-program-new'(){return CoreSuites.render('umrah','umrah-program-new')},
    'umrah-booking-new'(){return CoreSuites.render('umrah','umrah-booking-new')},
    'umrah-booking-resume'(){return CoreSuites.render('umrah','umrah-booking-resume')},
    'umrah-bookings'(){return CoreSuites.render('umrah','umrah-bookings')},
    'umrah-travelers'(){return CoreSuites.render('umrah','umrah-travelers')},
    'umrah-seasons'(){return CoreSuites.render('umrah','umrah-seasons')},
    'umrah-contracts'(){return CoreSuites.render('umrah','umrah-contracts')},
    'umrah-programs'(){return CoreSuites.render('umrah','umrah-programs')},
    'umrah-program-workspace'(){return CoreSuites.render('umrah','umrah-program-workspace')},
    'umrah-costing'(){return CoreSuites.render('umrah','umrah-costing')},
    'umrah-trip-ready'(){return CoreSuites.render('umrah','umrah-trip-ready')},
    'umrah-control'(){return CoreSuites.render('umrah','umrah-control')},
    'umrah-hotels'(){return CoreSuites.render('umrah','umrah-hotels')},
    'umrah-visas'(){return CoreSuites.render('umrah','umrah-visas')},
    'umrah-hajj-services'(){return CoreSuites.render('umrah','umrah-hajj-services')},
    'umrah-flights'(){return CoreSuites.render('umrah','umrah-flights')},
    'umrah-transport'(){return CoreSuites.render('umrah','umrah-transport')},
    'umrah-tripops'(){return CoreSuites.render('umrah','umrah-tripops')},
    'umrah-incidents'(){return CoreSuites.render('umrah','umrah-incidents')},
    'umrah-procurement'(){return CoreSuites.render('umrah','umrah-procurement')},
    'umrah-documents'(){return CoreSuites.render('umrah','umrah-documents')},
    'umrah-settings'(){return CoreSuites.render('umrah','umrah-settings')},
    workcenter(){return WorkCenter.page()},
    'customer-more'(){return Party360.page('customer',UI.focusId)},
    head(title,desc,buttons=''){const m=UI.pageMeta(),ws=UI.activeWorkspace(),group=ws?.name||PageGroup[UI.current]||'النظام',back=ws&&UI.current!=='dashboard'?`<button class="btn small ghost workspace-home-btn" data-ui-workspace="${esc(ws.id)}">${icon('chevron','sm')} أقسام ${esc(ws.name)}</button>`:'';return `<div class="page-hero"><div class="page-title-wrap"><div class="page-icon">${icon(m[1],'lg')}</div><div class="page-head"><div class="breadcrumb">${esc(group)} / ${esc(title)}</div><h2>${esc(title)}</h2></div></div><div class="page-actions">${back}${buttons}</div></div>`},
    can(page,action,html){return AccessControl.can(page,action)?html:''},
    row(id,html){return `<tr data-record="${id}">${html}</tr>`},
    ...Pages_Operations,
    ...Pages_Accounting,
    ...Pages_Admin,
    ...Pages_Settings
};
__set_Pages(Pages);
export { Pages };
