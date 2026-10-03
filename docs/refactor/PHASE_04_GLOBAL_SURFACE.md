# Phase 04 global surface inventory

START SHA: 4701fc6fd50ee5b69df6d7f18eb36bdfdfe71b5e

This inventory is based on the actual ordered TypeScript source, AST assignments, index.html handlers, template attributes and delegated mappings. In module:none, top-level lexical declarations are accessible to legacy scripts/inline handlers; they are not all properties on window. Counts below distinguish those surfaces rather than claiming every lexical binding is a public browser API.

## REQUIRED LEGACY GLOBALS

All 147 original top-level object declarations are retained, including configuration/value objects. All callable public method names and JavaScript arities on those original objects are compared by the presentation checker. Required inline roots are Auth, Forms, Print, UI, UmrahCore_Forms and UmrahCore_QuickCreate (19 index.html handlers, 16 unique callable references; existing action integrity gate). Template-generated data attributes route through UIDelegatedActions to Actions, CommercialActions, CommercialUX, Party360, UnifiedParty, OutputCenter, WorkCenter, Auth, Forms, Print and Umrah facades. Their public methods remain compatible.

Legacy cross-script callers also require DB/DataStore/ServerStore, Transactions, Invoices, Accounting, ManualJournal, CRM, Commercial, Approvals, Currency, AdvancedAccounting and the UmrahCore_* facades. Print/export uses Print, Statements, Reports, PartyTransactions and the native NativePrint interface. Mobile integration uses ERP_MOBILE, NativeShell and Capacitor; their method contracts/message shapes remain. PWA is retained and invoked at the same ordered script point. Bootstrap remains the sole composition root. No caller migration requiring a facade rename/removal was attempted.

## INTERNAL-ONLY GLOBALS

Four captured patch functions (renderCurrentCommercial, openPageCommercial, initGlobalModalStack, uxEnter) cease to be separate top-level bindings. Three UI base captures and the bound closeModal implementation are grouped in UiBaseMethods; the Auth wrapper capture is unnecessary after explicit presentation entry composition. This is a private implementation object, not a container or second UI instance. New focused factories/ports still require lexical definitions in this module:none build. Total top-level runtime declarations therefore increase 297 → 310; it would be false to claim elimination of the global-script model. Existing object declarations 147 → 148, plus BrowserPlatform's IIFE binding. No new window/globalThis publication.

The complete starting lexical inventory is below. Pure values, formatters, seed/configuration data and compose* factories are internal implementation bindings; externally called facades listed above must remain. Where dynamic external use cannot be excluded, the existing binding is retained conservatively.

| Source | Starting top-level runtime declarations |
|---|---|
| src/core/runtime.ts | `EPS`, `S`, `N`, `deep`, `today`, `now`, `year2`, `esc`, `DISPLAY_LOCALE`, `fmt`, `byId`, `live`, `iid`, `Money`, `money`, `MONTH_NAMES_AR`, `monthNameAr`, `PrefixLabels`, `formatDate`, `formatDateTime`, `daysBetween`, `dateAddMonthsClamped`, `numWordsAr`, `amountWordsAr`, `FileNames`, `currencyFlag`, `toast`, `ICONS`, `icon`, `roleLabel`, `statusLabel`, `statusClass`, `accountTypeLabel`, `natureLabel`, `expenseModeLabel`, `APP`, `Device`, `PrefixDefaults`, `StatusCatalog`, `sl`, `sc`, `paymentMethodLabel`, `approvalTypeLabel`, `activityActionLabel`, `entityLabel` |
| src/core/business-values.ts | `BusinessValues` |
| src/accounting/advanced-rules.ts | `AdvancedAccountingRules` |
| src/accounting/journal-rules.ts | `JournalRules` |
| src/accounting/invoice-rules.ts | `InvoiceRules` |
| src/accounting/expense-rules.ts | `ExpenseRules`, `ApprovalRules` |
| src/accounting/voucher-rules.ts | `VoucherRules` |
| src/application/invoice-workflows.ts | `InvoiceWorkflows` |
| src/application/voucher-workflows.ts | `VoucherWorkflows` |
| src/crm/purchase-fulfillment-rules.ts | `createPurchaseFulfillmentRules` |
| src/crm/commercial-lifecycle-rules.ts | `CommercialLifecycleRules` |
| src/commercial/administration-rules.ts | `AdministrationRules` |
| src/commercial/branch-rules.ts | `BranchRules` |
| src/application/approval-workflows.ts | `ApprovalWorkflows` |
| src/application/branch-workflows.ts | `BranchWorkflows` |
| src/core/tourism-rules.ts | `TourismRules` |
| src/application/tourism-workflows.ts | `TourismWorkflows` |
| src/core/umrah/business-rules.ts | `UmrahBusinessRules` |
| src/application/umrah-lifecycle-workflows.ts | `UmrahLifecycleWorkflows` |
| src/finance/query-rules.ts | `FinancialQueryRules` |
| src/application/manual-journal-workflows.ts | `ManualJournalWorkflows` |
| src/application/transfer-workflows.ts | `TransferWorkflows` |
| src/application/integrity-workflows.ts | `IntegrityWorkflows` |
| src/crm/party-business-rules.ts | `PartyNettingRules`, `PartyBusinessRules` |
| src/application/netting-workflows.ts | `NettingWorkflows` |
| src/application/expense-workflows.ts | `ExpenseWorkflows` |
| src/crm/lead-rules.ts | `CrmLeadRules` |
| src/accounting/manual-journal-rules.ts | `ManualJournalRules` |
| src/application/crm-leads.ts | `CrmLeadWorkflows` |
| src/application/quotation-workflows.ts | `QuotationWorkflows` |
| src/application/purchase-workflows.ts | `PurchaseWorkflows` |
| src/application/document-actions.ts | `DocumentWorkflows` |
| src/application/commercial-actions.ts | `CommercialWorkflows` |
| src/core/action-policy.ts | `ActionPolicy` |
| src/core/numbering.ts | `Numbering` |
| src/core/seed.ts | `Seed`, `SequenceMigration` |
| src/accounting/advanced.ts | `AccountingProgram`, `AdvancedAccounting` |
| src/persistence/state-patch.ts | `StatePatch` |
| src/persistence/server-store.ts | `ServerStore` |
| src/persistence/browser-store.ts | `DataStore`, `DB`, `DBEnsureAccountingLifecycleBase` |
| src/commercial/product.ts | `EditionDefinitions`, `CommercialPageModule`, `BranchScope`, `CommercialSupport`, `Commercial` |
| src/accounting/currency-periods.ts | `Currency`, `Periods` |
| src/accounting/engine.ts | `Accounting`, `ManualJournal` |
| src/accounting/invoices.ts | `Tax`, `Invoices`, `TaxLedgerLifecycleBase`, `InvoiceRemainingLifecycleBase`, `InvoiceCancelLifecycleBase`, `MasterData` |
| src/accounting/terms.ts | `paymentTermsAddDays`, `PaymentTerms` |
| src/accounting/expense-categories.ts | `ExpenseCategories` |
| src/accounting/transactions.ts | `Transactions`, `Approvals` |
| src/crm/purchase-order-fulfillment.ts | `PurchaseOrderFulfillment` |
| src/crm/crm.ts | `CRM`, `CRMAddPOLifecycleBase`, `CRMUpdatePOLifecycleBase`, `CRMConvertPOLifecycleBase` |
| src/core/delete-center.ts | `DeleteCenter` |
| src/documents/attachments-backup.ts | `AttachmentStore`, `Attachments`, `Backup`, `AutoOps` |
| src/security/auth.ts | `RolePermissions`, `Security`, `License`, `Auth` |
| src/commercial/data-exchange.ts | `CommercialData` |
| src/crm/unified-party.ts | `UnifiedParty` |
| src/crm/party360.ts | `Party360` |
| src/finance/insights.ts | `Insights`, `PartyFinance`, `PrintNarrativeStore`, `DocumentNarrative` |
| src/reports/printing.ts | `Print`, `Statements`, `PartyTransactions`, `Reports` |
| src/ui/navigation.ts | `Nav`, `adminNav`, `SuiteWorkspaceNav`, `PageTheme`, `PageGroup`, `RecentEntities`, `NumericUX`, `SearchSelect` |
| src/ui/delegated-actions.ts | `UIDelegatedActions` |
| src/ui/ui.ts | `UIDocument`, `SystemFontCatalog`, `systemFontEntry`, `ensureSystemFontAsset`, `UI`, `renderCurrentCommercial`, `openPageCommercial`, `initGlobalModalStack` |
| src/ui/data-table.ts | `_dataTableRenderBase`, `_dataTableFilterBase`, `_dataTableSortBase`, `_dataTableExportBase` |
| src/ui/forms.ts | `FormsDocument`, `Forms` |
| src/ui/forms-definitions.ts | `FormsDefinitions` |
| src/integrated/bridge.ts | `ERPIntegration` |
| src/core/umrah/runtime.ts | `UmrahCore_META`, `UmrahCore_S`, `UmrahCore_N`, `UmrahCore_deep`, `UmrahCore_today`, `UmrahCore_now`, `UmrahCore_localDateTime`, `UmrahCore_iid`, `UmrahCore_esc`, `UmrahCore_fmt`, `UmrahCore_money`, `UmrahCore_dateAdd`, `UmrahCore_monthsAdd`, `UmrahCore_daysBetween`, `UmrahCore_roomCap`, `UmrahCore_roomLabel`, `UmrahCore_vehicleCaps`, `UmrahCore_vehicleLabel`, `UmrahCore_programDisplay`, `UmrahCore_segLabel`, `UmrahCore_programTypeLabel`, `UmrahCore_travelerTitle`, `UmrahCore_travelersTitle`, `UmrahCore_hajjPermitStatusLabel`, `UmrahCore_bookingLabel`, `UmrahCore_programLabel`, `UmrahCore_tone`, `UmrahCore_Seed` |
| src/core/umrah/integration.ts | `UmrahCore_ERP` |
| src/core/umrah/data.ts | `UmrahCore_RootMap`, `UmrahCore_LocalUI`, `UmrahCore_DB`, `UmrahCore_scopePage`, `UmrahCore_Bridge`, `UmrahCore_Cost` |
| src/core/umrah/contracts-inventory.ts | `UmrahCore_Inventory` |
| src/core/umrah/contracts.ts | `UmrahCore_ContractCenter` |
| src/core/umrah/contracts-management.ts | `UmrahCore_ContractManagement` |
| src/core/umrah/procurement.ts | `UmrahCore_Procurement` |
| src/integrated/service-inventory.ts | `TourismServiceInventory` |
| src/core/umrah/guided.ts | `UmrahCore_QuickCreate`, `UmrahCore_Wizard`, `UmrahCore_SmartGuide`, `UmrahCore_Guided` |
| src/core/umrah/program-wizard.ts | `UmrahCore_ProgramWizard` |
| src/core/umrah/program-wizard-view.ts | `UmrahCore_ProgramWizardView` |
| src/core/umrah/booking-rooms.ts | `UmrahCore_BookingRooms` |
| src/core/umrah/operations.ts | `UmrahCore_travelerIdentityKey`, `UmrahCore_duplicateTravelerGroups`, `UmrahCore_duplicateTravelerIds`, `UmrahCore_Ops`, `UmrahCore_AdvancedPages` |
| src/core/umrah/operations-execution.ts | `UmrahCore_OperationsExecution` |
| src/core/umrah/workflow.ts | `UmrahCore_RequirementLabels`, `UmrahCore_defaultRequirements`, `UmrahCore_requirementsFromForm`, `UmrahCore_programReq`, `UmrahCore_reqSegmentType`, `UmrahCore_serviceCostCategory`, `UmrahCore_EnsureBase`, `UmrahCore_CreateProgramBase`, `UmrahCore_UpdateProgramBase`, `UmrahCore_UpdateTravelerBase` |
| src/core/umrah/insights.ts | `UmrahCore_Insights` |
| src/core/umrah/ui.ts | `UmrahCore_PageScope`, `UmrahCore_PageAllowed`, `UmrahCore_UI`, `UmrahCore_State`, `UmrahCore_isHistoryRow`, `UmrahCore_filterHistory`, `UmrahCore_historyToolbar`, `UmrahCore_travelerCategory`, `UmrahCore_visaStatusLabel`, `UmrahCore_ticketStatusLabel`, `UmrahCore_currencyOptions`, `UmrahCore_fxLabel`, `UmrahCore_treasuryOptions`, `UmrahCore_entityOptions`, `UmrahCore_selectProgram`, `UmrahCore_procurementSourceLabel`, `UmrahCore_integrationRows` |
| src/core/umrah/ui-pages.ts | `UmrahCore_Pages` |
| src/core/umrah/forms.ts | `UmrahCore_Forms` |
| src/core/umrah/forms-contracts.ts | `UmrahCore_ContractForms` |
| src/core/umrah/actions-print.ts | `UmrahCore_Actions`, `UmrahCore_PrintView` |
| src/documents/output-center.ts | `OutputCenter` |
| src/core/suites.ts | `CoreSuites` |
| src/ui/work-center.ts | `WorkCenter` |
| src/ui/clean-pages.ts | `CleanPages` |
| src/ui/pages.ts | `Pages` |
| src/commercial/pages.ts | `CommercialPages`, `BackupCenter`, `ArchiveCenter` |
| src/commercial/vendor-owner.ts | `VendorOwner` |
| src/ui/actions.ts | `ActionsDocument`, `Actions` |
| src/ui/commercial-action-views.ts | `ArchiveViewer`, `CommercialActionViews` |
| src/commercial/actions.ts | `CommercialActions` |
| src/ui/commercial-ux.ts | `CommercialUX`, `uxSave`, `uxRender`, `uxTopbar`, `uxOpen`, `uxWorkspace`, `uxHome`, `uxClose`, `uxEnter`, `uxDashboard`, `uxUserMenu`, `uxModal` |
| src/pwa.ts | `PWA` |
| src/bootstrap.ts | `composeBusinessClock`, `composeBusinessMoney`, `composeLegacyCrmDeps`, `composeLegacyVoucherDeps`, `composeLegacyCommercialDeps`, `composeLegacyActionDeps`, `composeLegacyJournalRules`, `composeLegacyInvoiceRules`, `composeLegacyInvoiceDeps`, `composeLegacyBranchDeps`, `composeLegacyBranchAccess`, `composeLegacyCommercialPermissions`, `composeLegacyApprovalDeps`, `composeLegacyTourismDeps`, `composeLegacyFinancialQueries`, `composeLegacyManualJournalDeps`, `composeLegacyTransferDeps`, `composeLegacyIntegrityDeps`, `composeLegacyUmrahLifecycleDeps`, `composeLegacyPurchaseFulfillment`, `composeLegacyNettingDeps`, `composeLegacyPartyNames`, `composeLegacyPhonePolicy`, `composeLegacyExpenseDeps` |

## MONKEY PATCH LOCATIONS

ARCH004 is a public-member assignment measurement, not solely function decoration: it also counts DB.data/session/navigation replacement. Before 68, after 39. UI's settings/modal additions and captured base implementations are constructed explicitly in the public literal. Native restore and UX/table wrappers remain where not safely replaced in this phase. Auth.enter's UX chain is replaced by a focused entry presenter. Expired Auth.user clearing is an Auth-owned method rather than an infrastructure assignment.

Retained UI footer/modal assignments are actual compatibility definitions required by unchanged source-presence smoke assertions; no comments or test edits substitute for them. They remain visible ratchet debt. Remaining DB.ensure/DB.save, data-table, CommercialUX navigation/notification wrappers and native UI.init are recorded for Phase 5 review, not silently renamed.

## WINDOW/GLOBALTHIS MUTATIONS

Before 11, after 10; all retained findings are in mobile.ts. ERP_MOBILE's initial publication and four offline/four connected-edition method installations preserve the Android integration contract and branch-specific sync/Promise behavior. window.fetch still provides the existing native /api/ URL/header/credentials routing for all legacy infrastructure requests. No new globalThis mutation.

The window.print replacement is removed: the sole source consumer is UIDelegatedActions' data-window-print route; it now uses an explicit current-print port configured at the original native hook point. Native title, fallback error/log and browser printing order are preserved. NativePrint.printHtmlA4/shareHtmlA4ToWhatsApp and all bridge contracts are untouched. This inventory concerns repository callers, not unobserved third-party scripts.

## INLINE/TEMPLATE GLOBAL CALLERS

Static index.html, CSS, assets/icons are unchanged. Existing inline roots and all original facade callable names/arities are preserved. data-form-*, data-ui-*, data-action-*, data-commercial-*, data-party-*, data-output-* and Umrah delegation stay mapped to the same public APIs. No new inline handler or ambient registration is introduced.

## PLATFORM API USERS

The following table lists all 39 starting source files containing the inspected browser/platform identifiers. It includes read-only access and references, not just mutations.

| Source | Identifier reference counts |
|---|---|
| src/core/runtime.ts | globalThis: 2, document: 2, setTimeout: 1, navigator: 2 |
| src/persistence/server-store.ts | sessionStorage: 1, localStorage: 2, document: 1, window: 4, location: 3, navigator: 2, setTimeout: 4, requestAnimationFrame: 2 |
| src/persistence/browser-store.ts | requestIdleCallback: 2, setTimeout: 3, localStorage: 7, requestAnimationFrame: 2, sessionStorage: 1, location: 1 |
| src/commercial/product.ts | localStorage: 4 |
| src/core/delete-center.ts | document: 1 |
| src/documents/attachments-backup.ts | setTimeout: 8, document: 4, globalThis: 3, localStorage: 2, window: 3, navigator: 5, sessionStorage: 1, location: 2 |
| src/security/auth.ts | globalThis: 2, document: 35, history: 4, location: 6, localStorage: 3, window: 2, sessionStorage: 4, navigator: 4, setTimeout: 6 |
| src/commercial/data-exchange.ts | document: 8, setTimeout: 1 |
| src/crm/unified-party.ts | document: 22, setTimeout: 3 |
| src/crm/party360.ts | requestAnimationFrame: 2, setTimeout: 7, document: 29 |
| src/reports/printing.ts | window: 4, document: 13, setTimeout: 4 |
| src/ui/navigation.ts | document: 5, window: 2, globalThis: 2 |
| src/ui/delegated-actions.ts | document: 5, setTimeout: 2, window: 1 |
| src/ui/ui.ts | document: 4, setTimeout: 9, window: 2, localStorage: 2, history: 3 |
| src/ui/data-table.ts | setTimeout: 3, document: 2 |
| src/ui/forms.ts | document: 1, window: 3, setTimeout: 3 |
| src/core/umrah/runtime.ts | globalThis: 1 |
| src/core/umrah/data.ts | sessionStorage: 3 |
| src/core/umrah/contracts-inventory.ts | document: 4 |
| src/core/umrah/contracts.ts | document: 2 |
| src/core/umrah/contracts-management.ts | history: 1 |
| src/core/umrah/guided.ts | document: 18, requestAnimationFrame: 1, setTimeout: 1 |
| src/core/umrah/program-wizard.ts | document: 5, setTimeout: 1, requestAnimationFrame: 1 |
| src/core/umrah/ui.ts | document: 1 |
| src/core/umrah/ui-pages.ts | history: 2, document: 1 |
| src/core/umrah/forms.ts | document: 10 |
| src/core/umrah/forms-contracts.ts | document: 2, setTimeout: 1 |
| src/documents/output-center.ts | document: 7 |
| src/ui/work-center.ts | document: 1 |
| src/ui/clean-pages.ts | history: 3 |
| src/ui/pages.ts | history: 4 |
| src/commercial/pages.ts | setTimeout: 4, document: 4 |
| src/ui/actions.ts | document: 1, window: 2 |
| src/ui/commercial-action-views.ts | document: 14 |
| src/commercial/actions.ts | document: 50, setTimeout: 3, location: 2 |
| src/ui/commercial-ux.ts | location: 5, document: 36, setTimeout: 3, localStorage: 4, window: 1 |
| src/mobile.ts | window: 37, document: 51, navigator: 1, location: 10, localStorage: 2, history: 3, requestAnimationFrame: 2, setTimeout: 7, sessionStorage: 2 |
| src/pwa.ts | window: 3, navigator: 2, location: 2, setTimeout: 1 |
| src/bootstrap.ts | location: 5, history: 1, document: 8, navigator: 2, window: 1, requestIdleCallback: 2, setTimeout: 1, localStorage: 1 |

BrowserPlatform now owns focused DOM/form lookup, native contact bridge/listener, PWA native/protocol/registration/load/update scheduling, native current printing/fallback, document-frame writing/printing/font readiness, frame/idle/timer scheduling, session-key removal and online reload. Each is used through an explicit port; no window/globalThis alias, dynamic property dispatch, universal event bus or EverythingService. Residual platform users remain visible above.

## Inspected scope and retained debt

Forms/forms-definitions: contact mechanics extracted; definition/field/submit schema and Phase 2 fast/strict paths retained. Pages/actions/navigation/delegated-actions/ui/data-table/work-center/clean-pages and commercial actions/views/UX were inspected; UI construction and delegated printing changed, other renderers remain for safe consolidation. Party360/UnifiedParty modal bodies moved to typed presenters; original queries/use cases remain single sources of truth. Auth permission/login/session decisions retained, entry screen/effects separated. Print fallback frame mechanics extracted, native A4 public call retained in Print. OutputCenter output and report markup remain unchanged and are compared. Bootstrap platform scheduling/online reload moves to BrowserPlatform; duplicate Phase 3 comment removed. Umrah data bridge's page/form/action callbacks use explicit compatibility ports; its remaining visual helpers and UI-pages/forms/contracts/actions-print/wizard templates remain unchanged. mobile.ts's native routing/state/navigation and PWA cache strategy are preserved; integrated/bridge.ts remains unchanged.
