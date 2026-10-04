import { __set_Actions } from '../core/late-bindings';
import { ActionsMaster } from './actions-handlers-master';
import { ActionsDocuments } from './actions-handlers-documents';
import { ActionsFinance } from './actions-handlers-finance';
import { ActionsCrm } from './actions-handlers-crm';
import { ActionsReportsSettings } from './actions-handlers-reports-settings';
import { ActionsAdvanced } from './actions-handlers-advanced';
const ActionsDocument: any = document;
const Actions: any={
 ...ActionsMaster,
 ...ActionsDocuments,
 ...ActionsFinance,
 ...ActionsCrm,
 ...ActionsReportsSettings,
 ...ActionsAdvanced,

};
__set_Actions(Actions);
export { Actions, ActionsDocument };
