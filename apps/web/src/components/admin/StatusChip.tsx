const COLORS: Record<string, string> = {
  draft: 'bg-black/10 text-black/70',
  reviewed: 'bg-gold/20 text-yellow-900',
  published: 'bg-jade/15 text-jade',
  archived: 'bg-black/5 text-black/40 line-through',
};

export function StatusChip({ status, label }: { status: string; label?: string }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${COLORS[status] ?? 'bg-black/10'}`}>{label ?? status}</span>;
}
