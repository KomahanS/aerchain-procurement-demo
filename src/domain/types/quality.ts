import type { Id, ISODateString } from "./common";

/**
 * Quality/technical/delivery eligibility for one vendor response line,
 * kept separate from Price so it can filter comparison without affecting
 * commercial figures.
 */
export interface QualityResponse {
  id: Id;
  vendorResponseId: Id;
  rfxLineId: Id;
  criteria: Record<string, string | number | boolean>;
  passed: boolean;
  notes?: string;
  evidenceIds: Id[];
  evaluatedAt: ISODateString;
}
