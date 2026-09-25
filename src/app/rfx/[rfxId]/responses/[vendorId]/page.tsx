import Link from "next/link";
import { notFound } from "next/navigation";
import { ResponseIntelligenceView } from "@/app/analyze-response/intelligence/intelligence-view";
import { getResponseIntelligence } from "@/app/analyze-response/intelligence/view-model";
import { getVendorResponseWorkspace } from "@/domain/seed/vendor-response-workspace";

export default async function VendorResponseIntelligencePage({
  params,
}: {
  params: Promise<{ rfxId: string; vendorId: string }>;
}) {
  const { rfxId, vendorId } = await params;
  const responses = getVendorResponseWorkspace(rfxId);
  const match = responses.find((response) => response.vendor.id === vendorId);
  if (!match) notFound();

  const intelligence = getResponseIntelligence(rfxId, match.vendorResponse.id);
  if (!intelligence) notFound();

  return (
    <div className="flex flex-col gap-4">
      <Link href={`/rfx/${rfxId}/responses`} className="w-fit text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
        ← All vendor responses
      </Link>
      <ResponseIntelligenceView intelligence={intelligence} analystHref={`/rfx/${rfxId}/responses/${vendorId}/analyst`} />
    </div>
  );
}
