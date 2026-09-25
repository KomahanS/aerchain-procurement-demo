import { corrugatedSeed } from "@/domain/seed/corrugated-seed";
import { PageHeader, PageBody } from "@/components/ui/page-header";

export default function SettingsPage() {
  const { tenant, dimensions, units, packagingConversions, products } = corrugatedSeed;
  const productsById = new Map(products.map((p) => [p.id, p]));
  const unitsById = new Map(units.map((u) => [u.id, u]));

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <PageHeader
        crumbs={[{ label: "Dashboard", href: "/" }, { label: "Settings" }]}
        title="Settings"
        subtitle={`${tenant.name} — standard unit catalog and product-specific packaging conversions.`}
      />
      <PageBody>
        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Standard unit catalog</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              Every tenant gets a predefined dimension/unit catalog. Configure a new unit only when the one you need doesn&apos;t already exist -- Aerchain never invents a conversion silently.
            </p>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {dimensions.map((dimension) => {
              const dimensionUnits = units.filter((u) => u.dimensionId === dimension.id);
              const preferredUnit = unitsById.get(dimension.preferredComparisonUnitId);
              return (
                <div key={dimension.id} className="px-5 py-4">
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {dimension.name} <span className="ml-1 text-xs font-normal text-slate-500 dark:text-slate-400">· preferred comparison unit: {preferredUnit?.symbol}</span>
                  </p>
                  <table className="mt-2 w-full max-w-xl border-collapse text-left text-sm">
                    <thead>
                      <tr className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <th className="py-1 pr-4 font-medium">Unit</th>
                        <th className="py-1 pr-4 font-medium">Symbol</th>
                        <th className="py-1 pr-4 font-medium">Base unit</th>
                        <th className="py-1 font-medium">Conversion to base</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dimensionUnits.map((unit) => (
                        <tr key={unit.id} className="text-slate-700 dark:text-slate-300">
                          <td className="py-1 pr-4">{unit.name}</td>
                          <td className="py-1 pr-4 font-mono text-xs">{unit.symbol}</td>
                          <td className="py-1 pr-4">{unit.isBaseUnit ? "Yes" : "No"}</td>
                          <td className="py-1">×{unit.conversionFactorToBase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-50">Product-specific packaging conversions</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              A packaging/selling-unit ratio for one product only -- never shared across products, and never inferred from a vendor&apos;s wording alone.
            </p>
          </div>
          <div className="px-5 py-4">
            {packagingConversions.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No packaging conversions configured yet.</p>
            ) : (
              <ul className="flex flex-col gap-2 text-sm">
                {packagingConversions.map((conversion) => {
                  const from = unitsById.get(conversion.fromUnitId);
                  const to = unitsById.get(conversion.toUnitId);
                  const product = productsById.get(conversion.productId);
                  return (
                    <li key={conversion.id} className="rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {product?.name} — 1 {from?.name} = {conversion.conversionFactor} {to?.name}
                      </p>
                      {conversion.notes && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{conversion.notes}</p>}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </PageBody>
    </main>
  );
}
