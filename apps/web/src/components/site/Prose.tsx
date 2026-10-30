import { renderMarkdown } from '@/lib/markdown';
import type { Atom } from '@/lib/atoms';

/** Renders a published atom (markdown) when present; renders nothing otherwise so pages degrade gracefully. */
export function AtomBlock({ atom, heading = true }: { atom: Atom | undefined; heading?: boolean }) {
  if (!atom) return null;
  return (
    <section className="prose-md mt-6 rounded-xl bg-white p-5 shadow-sm" data-atom-key={atom.key}>
      {heading && <h2 className="!mt-0">{atom.title}</h2>}
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(atom.bodyMd) }} />
    </section>
  );
}

export function Card({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-xl bg-white p-5 shadow-sm ${className}`}>
      {title && <h2 className="mb-3 text-lg font-semibold">{title}</h2>}
      {children}
    </section>
  );
}

export function Dl({ rows }: { rows: Array<[string, React.ReactNode]> }) {
  return (
    <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-black/60">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}
