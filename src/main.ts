// Generated entry. The import order below is the former tsconfig.json "files" order, so module
// initialisation order is unchanged. The block at the end keeps the legacy global names on window.
import './core/late-bindings';
import './core/runtime';
import './platform/platform-contracts';
import './platform/browser-platform';
import './platform/pwa-registration';
import './ui/auth-entry-presentation';
import './ui/contact-presentation';
import './application/contracts';
import './core/business-values';
import './application/business-contracts';
import './accounting/advanced-rules';
import './accounting/journal-rules';
import './accounting/invoice-rules';
import './accounting/expense-rules';
import './accounting/voucher-rules';
import './application/invoice-workflows';
import './application/voucher-workflows';
import './crm/purchase-fulfillment-rules';
import './crm/commercial-lifecycle-rules';
import './commercial/administration-rules';
import './commercial/branch-rules';
import './application/approval-workflows';
import './application/branch-workflows';
import './core/tourism-rules';
import './application/tourism-workflows';
import './core/umrah/business-rules';
import './application/umrah-lifecycle-workflows';
import './finance/query-rules';
import './application/manual-journal-workflows';
import './application/transfer-workflows';
import './application/integrity-workflows';
import './crm/party-business-rules';
import './application/netting-workflows';
import './application/expense-workflows';
import './crm/lead-rules';
import './accounting/manual-journal-rules';
import './application/crm-leads';
import './application/quotation-workflows';
import './application/purchase-workflows';
import './application/document-actions';
import './application/commercial-actions';
import './core/action-policy';
import './core/numbering';
import './core/seed';
import './accounting/advanced';
import './persistence/state-patch';
import './composition/early-presentation';
import './persistence/server-store';
import './persistence/browser-store';
import './commercial/product';
import './accounting/currency-periods';
import './accounting/engine';
import './accounting/invoices';
import './accounting/terms';
import './accounting/expense-categories';
import './accounting/transactions';
import './crm/purchase-order-fulfillment';
import './crm/crm';
import './core/delete-center';
import './documents/attachments-backup';
import './security/auth';
import './commercial/data-exchange';
import './ui/presentation-contracts';
import './ui/party-presentation';
import './crm/unified-party';
import './crm/party360';
import './finance/insights';
import './ui/print-presentation';
import './reports/printing';
import './ui/navigation';
import './ui/delegated-actions';
import './ui/ui';
import './ui/data-table';
import './ui/forms';
import './ui/forms-definitions';
import './integrated/bridge';
import './core/umrah/runtime';
import './core/umrah/integration';
import './core/umrah/data';
import './core/umrah/contracts-inventory';
import './core/umrah/contracts';
import './core/umrah/contracts-management';
import './core/umrah/procurement';
import './integrated/service-inventory';
import './core/umrah/guided';
import './core/umrah/program-wizard';
import './core/umrah/program-wizard-view';
import './core/umrah/booking-rooms';
import './core/umrah/operations';
import './core/umrah/operations-execution';
import './core/umrah/workflow';
import './core/umrah/insights';
import './core/umrah/ui';
import './core/umrah/ui-pages';
import './core/umrah/forms';
import './core/umrah/forms-contracts';
import './core/umrah/actions-print';
import './documents/output-center';
import './core/suites';
import './ui/work-center';
import './ui/clean-pages';
import './ui/pages';
import './accounting/advanced-pages';
import './commercial/pages';
import './commercial/vendor-owner';
import './ui/actions';
import './ui/commercial-action-views';
import './commercial/actions';
import './ui/commercial-ux';
import './mobile';
import './pwa';
import './bootstrap';
import { APP, DISPLAY_LOCALE, Device, EPS, FileNames, ICONS, MONTH_NAMES_AR, Money, N, PrefixDefaults, PrefixLabels, S, StatusCatalog, accountTypeLabel, activityActionLabel, amountWordsAr, approvalTypeLabel, byId, currencyFlag, dateAddMonthsClamped, daysBetween, deep, entityLabel, esc, expenseModeLabel, fmt, formatDate, formatDateTime, icon, iid, live, money, monthNameAr, natureLabel, now, numWordsAr, paymentMethodLabel, roleLabel, sc, sl, statusClass, statusLabel, toast, today, year2 } from './core/runtime';
import { BrowserPlatform } from './platform/browser-platform';
import { registerPresentationPwa } from './platform/pwa-registration';
import { enterAuthenticatedPresentation } from './ui/auth-entry-presentation';
import { bindContactPresentation, pickContactPresentation } from './ui/contact-presentation';
import { BusinessValues } from './core/business-values';
import { AdvancedAccountingRules } from './accounting/advanced-rules';
import { JournalRules } from './accounting/journal-rules';
import { InvoiceRules } from './accounting/invoice-rules';
import { ApprovalRules, ExpenseRules } from './accounting/expense-rules';
import { VoucherRules } from './accounting/voucher-rules';
import { InvoiceWorkflows } from './application/invoice-workflows';
import { VoucherWorkflows } from './application/voucher-workflows';
import { createPurchaseFulfillmentRules } from './crm/purchase-fulfillment-rules';
import { CommercialLifecycleRules } from './crm/commercial-lifecycle-rules';
import { AdministrationRules } from './commercial/administration-rules';
import { BranchRules } from './commercial/branch-rules';
import { ApprovalWorkflows } from './application/approval-workflows';
import { BranchWorkflows } from './application/branch-workflows';
import { TourismRules } from './core/tourism-rules';
import { TourismWorkflows } from './application/tourism-workflows';
import { UmrahBusinessRules } from './core/umrah/business-rules';
import { UmrahLifecycleWorkflows } from './application/umrah-lifecycle-workflows';
import { FinancialQueryRules } from './finance/query-rules';
import { ManualJournalWorkflows } from './application/manual-journal-workflows';
import { TransferWorkflows } from './application/transfer-workflows';
import { IntegrityWorkflows } from './application/integrity-workflows';
import { PartyBusinessRules, PartyNettingRules } from './crm/party-business-rules';
import { NettingWorkflows } from './application/netting-workflows';
import { ExpenseWorkflows } from './application/expense-workflows';
import { CrmLeadRules } from './crm/lead-rules';
import { ManualJournalRules } from './accounting/manual-journal-rules';
import { CrmLeadWorkflows } from './application/crm-leads';
import { QuotationWorkflows } from './application/quotation-workflows';
import { PurchaseWorkflows } from './application/purchase-workflows';
import { DocumentWorkflows } from './application/document-actions';
import { CommercialWorkflows } from './application/commercial-actions';
import { ActionPolicy } from './core/action-policy';
import { Numbering } from './core/numbering';
import { Seed, SequenceMigration } from './core/seed';
import { AccountingProgram, AdvancedAccounting } from './accounting/advanced';
import { StatePatch } from './persistence/state-patch';
import { composeLegacyPurchaseFulfillment, composeSessionPresentation, composeStorePresentation } from './composition/early-presentation';
import { ServerStore } from './persistence/server-store';
import { DB, DBEnsureAccountingLifecycleBase, DataStore } from './persistence/browser-store';
import { BranchScope, Commercial, CommercialPageModule, CommercialSupport, EditionDefinitions } from './commercial/product';
import { Currency, Periods } from './accounting/currency-periods';
import { Accounting, ManualJournal } from './accounting/engine';
import { InvoiceCancelLifecycleBase, InvoiceRemainingLifecycleBase, Invoices, MasterData, Tax, TaxLedgerLifecycleBase } from './accounting/invoices';
import { PaymentTerms, paymentTermsAddDays } from './accounting/terms';
import { ExpenseCategories } from './accounting/expense-categories';
import { Approvals, Transactions } from './accounting/transactions';
import { PurchaseOrderFulfillment } from './crm/purchase-order-fulfillment';
import { CRM, CRMAddPOLifecycleBase, CRMConvertPOLifecycleBase, CRMUpdatePOLifecycleBase } from './crm/crm';
import { DeleteCenter } from './core/delete-center';
import { AttachmentStore, Attachments, AutoOps, Backup } from './documents/attachments-backup';
import { Auth, License, RolePermissions, Security } from './security/auth';
import { CommercialData } from './commercial/data-exchange';
import { createParty360Presentation, createUnifiedPartyPresentation } from './ui/party-presentation';
import { UnifiedParty } from './crm/unified-party';
import { Party360 } from './crm/party360';
import { DocumentNarrative, Insights, PartyFinance, PrintNarrativeStore } from './finance/insights';
import { printDocumentFallback } from './ui/print-presentation';
import { PartyTransactions, Print, Reports, Statements } from './reports/printing';
import { Nav, NumericUX, PageGroup, PageTheme, RecentEntities, SearchSelect, SuiteWorkspaceNav, adminNav } from './ui/navigation';
import { UIDelegatedActions } from './ui/delegated-actions';
import { SystemFontCatalog, UI, UIDocument, UiBaseMethods, ensureSystemFontAsset, systemFontEntry } from './ui/ui';
import { _dataTableExportBase, _dataTableFilterBase, _dataTableRenderBase, _dataTableSortBase } from './ui/data-table';
import { Forms, FormsDocument } from './ui/forms';
import { FormsDefinitions } from './ui/forms-definitions';
import { ERPIntegration } from './integrated/bridge';
import { UmrahCore_META, UmrahCore_N, UmrahCore_S, UmrahCore_Seed, UmrahCore_bookingLabel, UmrahCore_dateAdd, UmrahCore_daysBetween, UmrahCore_deep, UmrahCore_esc, UmrahCore_fmt, UmrahCore_hajjPermitStatusLabel, UmrahCore_iid, UmrahCore_localDateTime, UmrahCore_money, UmrahCore_monthsAdd, UmrahCore_now, UmrahCore_programDisplay, UmrahCore_programLabel, UmrahCore_programTypeLabel, UmrahCore_roomCap, UmrahCore_roomLabel, UmrahCore_segLabel, UmrahCore_today, UmrahCore_tone, UmrahCore_travelerTitle, UmrahCore_travelersTitle, UmrahCore_vehicleCaps, UmrahCore_vehicleLabel } from './core/umrah/runtime';
import { UmrahCore_ERP } from './core/umrah/integration';
import { UmrahCore_Bridge, UmrahCore_Cost, UmrahCore_DB, UmrahCore_LocalUI, UmrahCore_RootMap, UmrahCore_scopePage } from './core/umrah/data';
import { UmrahCore_Inventory } from './core/umrah/contracts-inventory';
import { UmrahCore_ContractCenter } from './core/umrah/contracts';
import { UmrahCore_ContractManagement } from './core/umrah/contracts-management';
import { UmrahCore_Procurement } from './core/umrah/procurement';
import { TourismServiceInventory } from './integrated/service-inventory';
import { UmrahCore_Guided, UmrahCore_QuickCreate, UmrahCore_SmartGuide, UmrahCore_Wizard } from './core/umrah/guided';
import { UmrahCore_ProgramWizard } from './core/umrah/program-wizard';
import { UmrahCore_ProgramWizardView } from './core/umrah/program-wizard-view';
import { UmrahCore_BookingRooms } from './core/umrah/booking-rooms';
import { UmrahCore_AdvancedPages, UmrahCore_Ops, UmrahCore_duplicateTravelerGroups, UmrahCore_duplicateTravelerIds, UmrahCore_travelerIdentityKey } from './core/umrah/operations';
import { UmrahCore_OperationsExecution } from './core/umrah/operations-execution';
import { UmrahCore_CreateProgramBase, UmrahCore_EnsureBase, UmrahCore_RequirementLabels, UmrahCore_UpdateProgramBase, UmrahCore_UpdateTravelerBase, UmrahCore_defaultRequirements, UmrahCore_programReq, UmrahCore_reqSegmentType, UmrahCore_requirementsFromForm, UmrahCore_serviceCostCategory } from './core/umrah/workflow';
import { UmrahCore_Insights } from './core/umrah/insights';
import { UmrahCore_PageAllowed, UmrahCore_PageScope, UmrahCore_State, UmrahCore_UI, UmrahCore_currencyOptions, UmrahCore_entityOptions, UmrahCore_filterHistory, UmrahCore_fxLabel, UmrahCore_historyToolbar, UmrahCore_integrationRows, UmrahCore_isHistoryRow, UmrahCore_procurementSourceLabel, UmrahCore_selectProgram, UmrahCore_ticketStatusLabel, UmrahCore_travelerCategory, UmrahCore_treasuryOptions, UmrahCore_visaStatusLabel } from './core/umrah/ui';
import { UmrahCore_Pages } from './core/umrah/ui-pages';
import { UmrahCore_Forms } from './core/umrah/forms';
import { UmrahCore_ContractForms } from './core/umrah/forms-contracts';
import { UmrahCore_Actions, UmrahCore_PrintView } from './core/umrah/actions-print';
import { OutputCenter } from './documents/output-center';
import { CoreSuites } from './core/suites';
import { WorkCenter } from './ui/work-center';
import { CleanPages } from './ui/clean-pages';
import { Pages } from './ui/pages';
import { ArchiveCenter, BackupCenter, CommercialPages } from './commercial/pages';
import { VendorOwner } from './commercial/vendor-owner';
import { Actions, ActionsDocument } from './ui/actions';
import { ArchiveViewer, CommercialActionViews } from './ui/commercial-action-views';
import { CommercialActions } from './commercial/actions';
import { CommercialUX, uxClose, uxDashboard, uxHome, uxModal, uxOpen, uxRender, uxSave, uxTopbar, uxUserMenu, uxWorkspace } from './ui/commercial-ux';
import { PWA } from './pwa';
import { composeAuthEntryPresentation, composeBusinessClock, composeBusinessMoney, composeContactPresentation, composeLegacyActionDeps, composeLegacyApprovalDeps, composeLegacyBranchAccess, composeLegacyBranchDeps, composeLegacyCommercialDeps, composeLegacyCommercialPermissions, composeLegacyCrmDeps, composeLegacyExpenseDeps, composeLegacyFinancialQueries, composeLegacyIntegrityDeps, composeLegacyInvoiceDeps, composeLegacyInvoiceRules, composeLegacyJournalRules, composeLegacyManualJournalDeps, composeLegacyNettingDeps, composeLegacyPartyNames, composeLegacyPhonePolicy, composeLegacyTourismDeps, composeLegacyTransferDeps, composeLegacyUmrahLifecycleDeps, composeLegacyVoucherDeps, composeParty360Presentation, composePrintPresentation, composeUmrahPresentationCommands, composeUnifiedPartyPresentation } from './bootstrap';

// Legacy global surface (window.DB, Auth, UI, Actions, ...) - live accessors, never copies.
const __erpGlobals: Record<string, () => unknown> = {
    APP: () => APP,
    DISPLAY_LOCALE: () => DISPLAY_LOCALE,
    Device: () => Device,
    EPS: () => EPS,
    FileNames: () => FileNames,
    ICONS: () => ICONS,
    MONTH_NAMES_AR: () => MONTH_NAMES_AR,
    Money: () => Money,
    N: () => N,
    PrefixDefaults: () => PrefixDefaults,
    PrefixLabels: () => PrefixLabels,
    S: () => S,
    StatusCatalog: () => StatusCatalog,
    accountTypeLabel: () => accountTypeLabel,
    activityActionLabel: () => activityActionLabel,
    amountWordsAr: () => amountWordsAr,
    approvalTypeLabel: () => approvalTypeLabel,
    byId: () => byId,
    currencyFlag: () => currencyFlag,
    dateAddMonthsClamped: () => dateAddMonthsClamped,
    daysBetween: () => daysBetween,
    deep: () => deep,
    entityLabel: () => entityLabel,
    esc: () => esc,
    expenseModeLabel: () => expenseModeLabel,
    fmt: () => fmt,
    formatDate: () => formatDate,
    formatDateTime: () => formatDateTime,
    icon: () => icon,
    iid: () => iid,
    live: () => live,
    money: () => money,
    monthNameAr: () => monthNameAr,
    natureLabel: () => natureLabel,
    now: () => now,
    numWordsAr: () => numWordsAr,
    paymentMethodLabel: () => paymentMethodLabel,
    roleLabel: () => roleLabel,
    sc: () => sc,
    sl: () => sl,
    statusClass: () => statusClass,
    statusLabel: () => statusLabel,
    toast: () => toast,
    today: () => today,
    year2: () => year2,
    BrowserPlatform: () => BrowserPlatform,
    registerPresentationPwa: () => registerPresentationPwa,
    enterAuthenticatedPresentation: () => enterAuthenticatedPresentation,
    bindContactPresentation: () => bindContactPresentation,
    pickContactPresentation: () => pickContactPresentation,
    BusinessValues: () => BusinessValues,
    AdvancedAccountingRules: () => AdvancedAccountingRules,
    JournalRules: () => JournalRules,
    InvoiceRules: () => InvoiceRules,
    ApprovalRules: () => ApprovalRules,
    ExpenseRules: () => ExpenseRules,
    VoucherRules: () => VoucherRules,
    InvoiceWorkflows: () => InvoiceWorkflows,
    VoucherWorkflows: () => VoucherWorkflows,
    createPurchaseFulfillmentRules: () => createPurchaseFulfillmentRules,
    CommercialLifecycleRules: () => CommercialLifecycleRules,
    AdministrationRules: () => AdministrationRules,
    BranchRules: () => BranchRules,
    ApprovalWorkflows: () => ApprovalWorkflows,
    BranchWorkflows: () => BranchWorkflows,
    TourismRules: () => TourismRules,
    TourismWorkflows: () => TourismWorkflows,
    UmrahBusinessRules: () => UmrahBusinessRules,
    UmrahLifecycleWorkflows: () => UmrahLifecycleWorkflows,
    FinancialQueryRules: () => FinancialQueryRules,
    ManualJournalWorkflows: () => ManualJournalWorkflows,
    TransferWorkflows: () => TransferWorkflows,
    IntegrityWorkflows: () => IntegrityWorkflows,
    PartyBusinessRules: () => PartyBusinessRules,
    PartyNettingRules: () => PartyNettingRules,
    NettingWorkflows: () => NettingWorkflows,
    ExpenseWorkflows: () => ExpenseWorkflows,
    CrmLeadRules: () => CrmLeadRules,
    ManualJournalRules: () => ManualJournalRules,
    CrmLeadWorkflows: () => CrmLeadWorkflows,
    QuotationWorkflows: () => QuotationWorkflows,
    PurchaseWorkflows: () => PurchaseWorkflows,
    DocumentWorkflows: () => DocumentWorkflows,
    CommercialWorkflows: () => CommercialWorkflows,
    ActionPolicy: () => ActionPolicy,
    Numbering: () => Numbering,
    Seed: () => Seed,
    SequenceMigration: () => SequenceMigration,
    AccountingProgram: () => AccountingProgram,
    AdvancedAccounting: () => AdvancedAccounting,
    StatePatch: () => StatePatch,
    composeLegacyPurchaseFulfillment: () => composeLegacyPurchaseFulfillment,
    composeSessionPresentation: () => composeSessionPresentation,
    composeStorePresentation: () => composeStorePresentation,
    ServerStore: () => ServerStore,
    DB: () => DB,
    DBEnsureAccountingLifecycleBase: () => DBEnsureAccountingLifecycleBase,
    DataStore: () => DataStore,
    BranchScope: () => BranchScope,
    Commercial: () => Commercial,
    CommercialPageModule: () => CommercialPageModule,
    CommercialSupport: () => CommercialSupport,
    EditionDefinitions: () => EditionDefinitions,
    Currency: () => Currency,
    Periods: () => Periods,
    Accounting: () => Accounting,
    ManualJournal: () => ManualJournal,
    InvoiceCancelLifecycleBase: () => InvoiceCancelLifecycleBase,
    InvoiceRemainingLifecycleBase: () => InvoiceRemainingLifecycleBase,
    Invoices: () => Invoices,
    MasterData: () => MasterData,
    Tax: () => Tax,
    TaxLedgerLifecycleBase: () => TaxLedgerLifecycleBase,
    PaymentTerms: () => PaymentTerms,
    paymentTermsAddDays: () => paymentTermsAddDays,
    ExpenseCategories: () => ExpenseCategories,
    Approvals: () => Approvals,
    Transactions: () => Transactions,
    PurchaseOrderFulfillment: () => PurchaseOrderFulfillment,
    CRM: () => CRM,
    CRMAddPOLifecycleBase: () => CRMAddPOLifecycleBase,
    CRMConvertPOLifecycleBase: () => CRMConvertPOLifecycleBase,
    CRMUpdatePOLifecycleBase: () => CRMUpdatePOLifecycleBase,
    DeleteCenter: () => DeleteCenter,
    AttachmentStore: () => AttachmentStore,
    Attachments: () => Attachments,
    AutoOps: () => AutoOps,
    Backup: () => Backup,
    Auth: () => Auth,
    License: () => License,
    RolePermissions: () => RolePermissions,
    Security: () => Security,
    CommercialData: () => CommercialData,
    createParty360Presentation: () => createParty360Presentation,
    createUnifiedPartyPresentation: () => createUnifiedPartyPresentation,
    UnifiedParty: () => UnifiedParty,
    Party360: () => Party360,
    DocumentNarrative: () => DocumentNarrative,
    Insights: () => Insights,
    PartyFinance: () => PartyFinance,
    PrintNarrativeStore: () => PrintNarrativeStore,
    printDocumentFallback: () => printDocumentFallback,
    PartyTransactions: () => PartyTransactions,
    Print: () => Print,
    Reports: () => Reports,
    Statements: () => Statements,
    Nav: () => Nav,
    NumericUX: () => NumericUX,
    PageGroup: () => PageGroup,
    PageTheme: () => PageTheme,
    RecentEntities: () => RecentEntities,
    SearchSelect: () => SearchSelect,
    SuiteWorkspaceNav: () => SuiteWorkspaceNav,
    adminNav: () => adminNav,
    UIDelegatedActions: () => UIDelegatedActions,
    SystemFontCatalog: () => SystemFontCatalog,
    UI: () => UI,
    UIDocument: () => UIDocument,
    UiBaseMethods: () => UiBaseMethods,
    ensureSystemFontAsset: () => ensureSystemFontAsset,
    systemFontEntry: () => systemFontEntry,
    _dataTableExportBase: () => _dataTableExportBase,
    _dataTableFilterBase: () => _dataTableFilterBase,
    _dataTableRenderBase: () => _dataTableRenderBase,
    _dataTableSortBase: () => _dataTableSortBase,
    Forms: () => Forms,
    FormsDocument: () => FormsDocument,
    FormsDefinitions: () => FormsDefinitions,
    ERPIntegration: () => ERPIntegration,
    UmrahCore_META: () => UmrahCore_META,
    UmrahCore_N: () => UmrahCore_N,
    UmrahCore_S: () => UmrahCore_S,
    UmrahCore_Seed: () => UmrahCore_Seed,
    UmrahCore_bookingLabel: () => UmrahCore_bookingLabel,
    UmrahCore_dateAdd: () => UmrahCore_dateAdd,
    UmrahCore_daysBetween: () => UmrahCore_daysBetween,
    UmrahCore_deep: () => UmrahCore_deep,
    UmrahCore_esc: () => UmrahCore_esc,
    UmrahCore_fmt: () => UmrahCore_fmt,
    UmrahCore_hajjPermitStatusLabel: () => UmrahCore_hajjPermitStatusLabel,
    UmrahCore_iid: () => UmrahCore_iid,
    UmrahCore_localDateTime: () => UmrahCore_localDateTime,
    UmrahCore_money: () => UmrahCore_money,
    UmrahCore_monthsAdd: () => UmrahCore_monthsAdd,
    UmrahCore_now: () => UmrahCore_now,
    UmrahCore_programDisplay: () => UmrahCore_programDisplay,
    UmrahCore_programLabel: () => UmrahCore_programLabel,
    UmrahCore_programTypeLabel: () => UmrahCore_programTypeLabel,
    UmrahCore_roomCap: () => UmrahCore_roomCap,
    UmrahCore_roomLabel: () => UmrahCore_roomLabel,
    UmrahCore_segLabel: () => UmrahCore_segLabel,
    UmrahCore_today: () => UmrahCore_today,
    UmrahCore_tone: () => UmrahCore_tone,
    UmrahCore_travelerTitle: () => UmrahCore_travelerTitle,
    UmrahCore_travelersTitle: () => UmrahCore_travelersTitle,
    UmrahCore_vehicleCaps: () => UmrahCore_vehicleCaps,
    UmrahCore_vehicleLabel: () => UmrahCore_vehicleLabel,
    UmrahCore_ERP: () => UmrahCore_ERP,
    UmrahCore_Bridge: () => UmrahCore_Bridge,
    UmrahCore_Cost: () => UmrahCore_Cost,
    UmrahCore_DB: () => UmrahCore_DB,
    UmrahCore_LocalUI: () => UmrahCore_LocalUI,
    UmrahCore_RootMap: () => UmrahCore_RootMap,
    UmrahCore_scopePage: () => UmrahCore_scopePage,
    UmrahCore_Inventory: () => UmrahCore_Inventory,
    UmrahCore_ContractCenter: () => UmrahCore_ContractCenter,
    UmrahCore_ContractManagement: () => UmrahCore_ContractManagement,
    UmrahCore_Procurement: () => UmrahCore_Procurement,
    TourismServiceInventory: () => TourismServiceInventory,
    UmrahCore_Guided: () => UmrahCore_Guided,
    UmrahCore_QuickCreate: () => UmrahCore_QuickCreate,
    UmrahCore_SmartGuide: () => UmrahCore_SmartGuide,
    UmrahCore_Wizard: () => UmrahCore_Wizard,
    UmrahCore_ProgramWizard: () => UmrahCore_ProgramWizard,
    UmrahCore_ProgramWizardView: () => UmrahCore_ProgramWizardView,
    UmrahCore_BookingRooms: () => UmrahCore_BookingRooms,
    UmrahCore_AdvancedPages: () => UmrahCore_AdvancedPages,
    UmrahCore_Ops: () => UmrahCore_Ops,
    UmrahCore_duplicateTravelerGroups: () => UmrahCore_duplicateTravelerGroups,
    UmrahCore_duplicateTravelerIds: () => UmrahCore_duplicateTravelerIds,
    UmrahCore_travelerIdentityKey: () => UmrahCore_travelerIdentityKey,
    UmrahCore_OperationsExecution: () => UmrahCore_OperationsExecution,
    UmrahCore_CreateProgramBase: () => UmrahCore_CreateProgramBase,
    UmrahCore_EnsureBase: () => UmrahCore_EnsureBase,
    UmrahCore_RequirementLabels: () => UmrahCore_RequirementLabels,
    UmrahCore_UpdateProgramBase: () => UmrahCore_UpdateProgramBase,
    UmrahCore_UpdateTravelerBase: () => UmrahCore_UpdateTravelerBase,
    UmrahCore_defaultRequirements: () => UmrahCore_defaultRequirements,
    UmrahCore_programReq: () => UmrahCore_programReq,
    UmrahCore_reqSegmentType: () => UmrahCore_reqSegmentType,
    UmrahCore_requirementsFromForm: () => UmrahCore_requirementsFromForm,
    UmrahCore_serviceCostCategory: () => UmrahCore_serviceCostCategory,
    UmrahCore_Insights: () => UmrahCore_Insights,
    UmrahCore_PageAllowed: () => UmrahCore_PageAllowed,
    UmrahCore_PageScope: () => UmrahCore_PageScope,
    UmrahCore_State: () => UmrahCore_State,
    UmrahCore_UI: () => UmrahCore_UI,
    UmrahCore_currencyOptions: () => UmrahCore_currencyOptions,
    UmrahCore_entityOptions: () => UmrahCore_entityOptions,
    UmrahCore_filterHistory: () => UmrahCore_filterHistory,
    UmrahCore_fxLabel: () => UmrahCore_fxLabel,
    UmrahCore_historyToolbar: () => UmrahCore_historyToolbar,
    UmrahCore_integrationRows: () => UmrahCore_integrationRows,
    UmrahCore_isHistoryRow: () => UmrahCore_isHistoryRow,
    UmrahCore_procurementSourceLabel: () => UmrahCore_procurementSourceLabel,
    UmrahCore_selectProgram: () => UmrahCore_selectProgram,
    UmrahCore_ticketStatusLabel: () => UmrahCore_ticketStatusLabel,
    UmrahCore_travelerCategory: () => UmrahCore_travelerCategory,
    UmrahCore_treasuryOptions: () => UmrahCore_treasuryOptions,
    UmrahCore_visaStatusLabel: () => UmrahCore_visaStatusLabel,
    UmrahCore_Pages: () => UmrahCore_Pages,
    UmrahCore_Forms: () => UmrahCore_Forms,
    UmrahCore_ContractForms: () => UmrahCore_ContractForms,
    UmrahCore_Actions: () => UmrahCore_Actions,
    UmrahCore_PrintView: () => UmrahCore_PrintView,
    OutputCenter: () => OutputCenter,
    CoreSuites: () => CoreSuites,
    WorkCenter: () => WorkCenter,
    CleanPages: () => CleanPages,
    Pages: () => Pages,
    ArchiveCenter: () => ArchiveCenter,
    BackupCenter: () => BackupCenter,
    CommercialPages: () => CommercialPages,
    VendorOwner: () => VendorOwner,
    Actions: () => Actions,
    ActionsDocument: () => ActionsDocument,
    ArchiveViewer: () => ArchiveViewer,
    CommercialActionViews: () => CommercialActionViews,
    CommercialActions: () => CommercialActions,
    CommercialUX: () => CommercialUX,
    uxClose: () => uxClose,
    uxDashboard: () => uxDashboard,
    uxHome: () => uxHome,
    uxModal: () => uxModal,
    uxOpen: () => uxOpen,
    uxRender: () => uxRender,
    uxSave: () => uxSave,
    uxTopbar: () => uxTopbar,
    uxUserMenu: () => uxUserMenu,
    uxWorkspace: () => uxWorkspace,
    PWA: () => PWA,
    composeAuthEntryPresentation: () => composeAuthEntryPresentation,
    composeBusinessClock: () => composeBusinessClock,
    composeBusinessMoney: () => composeBusinessMoney,
    composeContactPresentation: () => composeContactPresentation,
    composeLegacyActionDeps: () => composeLegacyActionDeps,
    composeLegacyApprovalDeps: () => composeLegacyApprovalDeps,
    composeLegacyBranchAccess: () => composeLegacyBranchAccess,
    composeLegacyBranchDeps: () => composeLegacyBranchDeps,
    composeLegacyCommercialDeps: () => composeLegacyCommercialDeps,
    composeLegacyCommercialPermissions: () => composeLegacyCommercialPermissions,
    composeLegacyCrmDeps: () => composeLegacyCrmDeps,
    composeLegacyExpenseDeps: () => composeLegacyExpenseDeps,
    composeLegacyFinancialQueries: () => composeLegacyFinancialQueries,
    composeLegacyIntegrityDeps: () => composeLegacyIntegrityDeps,
    composeLegacyInvoiceDeps: () => composeLegacyInvoiceDeps,
    composeLegacyInvoiceRules: () => composeLegacyInvoiceRules,
    composeLegacyJournalRules: () => composeLegacyJournalRules,
    composeLegacyManualJournalDeps: () => composeLegacyManualJournalDeps,
    composeLegacyNettingDeps: () => composeLegacyNettingDeps,
    composeLegacyPartyNames: () => composeLegacyPartyNames,
    composeLegacyPhonePolicy: () => composeLegacyPhonePolicy,
    composeLegacyTourismDeps: () => composeLegacyTourismDeps,
    composeLegacyTransferDeps: () => composeLegacyTransferDeps,
    composeLegacyUmrahLifecycleDeps: () => composeLegacyUmrahLifecycleDeps,
    composeLegacyVoucherDeps: () => composeLegacyVoucherDeps,
    composeParty360Presentation: () => composeParty360Presentation,
    composePrintPresentation: () => composePrintPresentation,
    composeUmrahPresentationCommands: () => composeUmrahPresentationCommands,
    composeUnifiedPartyPresentation: () => composeUnifiedPartyPresentation
};
const __erpGlobalThis = globalThis as unknown as Record<string, unknown>;
for (const name of Object.keys(__erpGlobals)) {
    if (name in __erpGlobalThis) continue;
    const read = __erpGlobals[name];
    Object.defineProperty(__erpGlobalThis, name, { configurable: true, enumerable: false, get: read, set(value) { Object.defineProperty(__erpGlobalThis, name, { value, writable: true, configurable: true, enumerable: false }); } });
}
export {};
