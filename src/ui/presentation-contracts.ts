import type { PresentationDomPort, PresentationScheduler } from '../platform/platform-contracts';
import type { NettingFields } from '../application/business-contracts';
interface PartyPresentationBase {
    dom: PresentationDomPort;
    close(): unknown;
    icon(name: string): string;
}
interface Party360PresentationDeps extends PartyPresentationBase {
    base(type: string, id: string): {
        x: {
            name: string;
        };
        cfg: {
            icon: string;
        };
    };
    shell(type: string, id: string): string;
    loadTab(type: string, id: string, tab: string): unknown;
}
interface UnifiedPartyPresentationDeps extends PartyPresentationBase {
    scheduler: PresentationScheduler;
    notify(message: string, kind?: string): unknown;
    reopen(type: string, id: string): unknown;
    child<T>(work: () => T): T;
    confirm(title: string, message: string, work: () => Promise<void>, options: {
        label: string;
        danger: boolean;
    }): unknown;
    escape(value: string): string;
    money(value: number, currency: string): string;
    today(): string;
    roleLabel(type: string): string;
    roleIcon(type: string): string;
    linkCandidates(type: string, id: string, target: string): {
        id: string;
        no?: string;
        name?: string;
        phone?: string;
    }[];
    linkRole(type: string, id: string, target: string, targetId: string): Promise<unknown>;
    nettingPairs(type: string, id: string): {
        key: string;
        max: number;
        currency: string;
        payable: {
            label: string;
            available: number;
        };
        receivable: {
            label: string;
            available: number;
        };
    }[];
    postNetting(type: string, id: string, fields: NettingFields): Promise<{
        no: string;
    }>;
    reverseNetting(id: string, reason: string): Promise<unknown>;
    netting(id: string): {
        no: string;
    } | undefined;
}
export type { Party360PresentationDeps, UnifiedPartyPresentationDeps };
