import Link from "next/link";
import type { ReactNode } from "react";

export interface Crumb {
  label: string;
  href?: string;
}

/** Shared page header: breadcrumb trail + title/subtitle + optional right-aligned actions. Answers "where am I?" on every screen. */
export function PageHeader({
  crumbs,
  title,
  subtitle,
  actions,
  children,
}: {
  crumbs: Crumb[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 border-b border-slate-200 bg-white px-4 py-6 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3">
        <nav className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
          {crumbs.map((crumb, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-300 dark:text-slate-700">/</span>}
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-slate-900 hover:underline dark:hover:text-slate-100">
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-slate-100">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </header>
  );
}

/** Consistent max-width content wrapper used below PageHeader on every page. */
export function PageBody({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-10">{children}</div>;
}
