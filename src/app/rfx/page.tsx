import Link from "next/link";
import { PageHeader, PageBody } from "@/components/ui/page-header";
import { getRfxList } from "./view-model";
import { RfxTable } from "./rfx-table";

export default function RfxListPage() {
  const items = getRfxList();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "RFx" }]}
        title="RFx"
        subtitle="Create, monitor and analyze sourcing events."
        actions={
          <Link
            href="/rfx/new"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
          >
            + Create RFx
          </Link>
        }
      />
      <PageBody>
        <RfxTable items={items} />
      </PageBody>
    </main>
  );
}
