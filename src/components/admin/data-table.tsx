import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface Column<T> {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
  /** Hide in the mobile card layout */
  hideOnCard?: boolean;
  primary?: boolean;
}

/**
 * Table on desktop, stacked cards on small screens — no horizontal scrolling
 * needed on phones.
 */
export function DataTable<T>({ rows, columns, rowKey, caption, empty, actions }: { rows: T[]; columns: Column<T>[]; rowKey: (row: T) => string; caption: string; empty?: ReactNode; actions?: (row: T) => ReactNode }) {
  if (!rows.length) return <>{empty}</>;
  const primary = columns.find((c) => c.primary) ?? columns[0];
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg border border-line bg-surface md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">{caption}</caption>
          <thead className="bg-sand/60">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn("px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.1em] text-muted", c.className)}>
                  {c.label}
                </th>
              ))}
              {actions && (
                <th scope="col" className="px-4 py-3 text-right">
                  <span className="sr-only">Actions</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={rowKey(r)} className="border-t border-line transition-colors hover:bg-ivory">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3 align-middle text-ink", c.className)}>
                    {c.render(r)}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(r)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="grid gap-3 md:hidden" aria-label={caption}>
        {rows.map((r) => (
          <li key={rowKey(r)} className="rounded-lg border border-line bg-surface p-4">
            <div className="font-semibold text-ink">{primary.render(r)}</div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              {columns
                .filter((c) => c !== primary && !c.hideOnCard)
                .map((c) => (
                  <div key={c.key}>
                    <dt className="text-xs text-muted">{c.label}</dt>
                    <dd className="text-ink">{c.render(r)}</dd>
                  </div>
                ))}
            </dl>
            {actions && <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">{actions(r)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export function AdminHeader({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-4xl text-ink">{title}</h1>
        {description && <p className="mt-1 text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
