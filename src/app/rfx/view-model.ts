import type { RFx } from "@/domain";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";

export interface RfxListItem {
  rfx: RFx;
  lineCount: number;
  vendorResponseCount: number;
  vendorNames: string[];
  /** Open exceptions across every response received for this RFx. */
  openIssueCount: number;
  /** Most recent activity timestamp: the RFx itself, or its latest vendor response. */
  updatedAt: string;
}

/**
 * Lists every RFx in the seed data (now multi-RFx: corrugatedSeed.rfxList),
 * with the same per-RFx facts the RFx list/Dashboard need -- all derived
 * from existing seed data, nothing hardcoded.
 */
export function getRfxList(): RfxListItem[] {
  return corrugatedSeed.rfxList.map((rfx) => {
    const lineCount = corrugatedSeed.rfxLines.filter((line) => line.rfxId === rfx.id).length;
    const responses = getVendorResponseWorkspace(rfx.id);
    const openIssueCount = responses.reduce((sum, response) => sum + response.stats.openExceptions, 0);
    const updatedAt = responses.reduce(
      (latest, response) => (response.vendorResponse.receivedAt > latest ? response.vendorResponse.receivedAt : latest),
      rfx.createdAt,
    );
    return {
      rfx,
      lineCount,
      vendorResponseCount: responses.length,
      vendorNames: responses.map((response) => response.vendor.name),
      openIssueCount,
      updatedAt,
    };
  });
}

export function getRfxListItem(rfxId: string): RfxListItem | undefined {
  return getRfxList().find((item) => item.rfx.id === rfxId);
}
