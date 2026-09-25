import type { RFx } from "@/domain";
import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";

export interface RfxListItem {
  rfx: RFx;
  lineCount: number;
  vendorResponseCount: number;
  vendorNames: string[];
}

/**
 * Lists every RFx in the seed data. The current seed holds exactly one RFx
 * (corrugatedSeed.rfx) -- this reads that from the data rather than
 * hardcoding a count, so it reflects whatever the seed actually contains.
 */
export function getRfxList(): RfxListItem[] {
  const rfx = corrugatedSeed.rfx;
  const lineCount = corrugatedSeed.rfxLines.filter((line) => line.rfxId === rfx.id).length;
  const responses = getVendorResponseWorkspace(rfx.id);
  return [
    {
      rfx,
      lineCount,
      vendorResponseCount: responses.length,
      vendorNames: responses.map((response) => response.vendor.name),
    },
  ];
}
