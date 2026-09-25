import { notFound } from "next/navigation";
import { getComparison } from "./view-model";
import { ComparisonGrid } from "./comparison-grid";

export default async function ComparisonPage({ params }: { params: Promise<{ rfxId: string }> }) {
  const { rfxId } = await params;
  const comparison = getComparison(rfxId);
  if (!comparison) notFound();

  return <ComparisonGrid comparison={comparison} rfxId={rfxId} />;
}
