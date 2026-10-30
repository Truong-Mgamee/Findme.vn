import type { ReactNode } from 'react';

export function Panel({ title, children, className = '' }: { title?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-night-2 p-4 ${className}`}>
      {title && <h2 className="mb-3 text-base font-semibold text-gold-2">{title}</h2>}
      {children}
    </section>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warn' | 'error' }) {
  const c = tone === 'error' ? 'border-vermilion/50 bg-vermilion/10' : tone === 'warn' ? 'border-gold/50 bg-gold/10' : 'border-white/20 bg-white/5';
  return <div className={`rounded-xl border px-4 py-3 text-sm ${c}`}>{children}</div>;
}

export function Table({ head, rows }: { head: ReactNode[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-white/60">
            {head.map((h, i) => (
              <th key={i} className="pb-2 pr-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-white/10">
              {r.map((c, j) => (
                <td key={j} className="py-1.5 pr-3 align-top">{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export const btn = 'inline-flex items-center justify-center rounded-full bg-gold px-4 py-2 text-sm font-semibold text-night hover:bg-gold-2 disabled:opacity-50';
export const btnGhost = 'inline-flex items-center justify-center rounded-full border border-white/25 px-4 py-2 text-sm hover:bg-white/10 disabled:opacity-50';
export const input = 'w-full rounded-lg border border-white/20 bg-night px-3 py-2 text-sm text-white placeholder:text-white/40';
