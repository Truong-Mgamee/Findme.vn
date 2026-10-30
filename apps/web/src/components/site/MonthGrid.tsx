import type { MonthCell } from '@/lib/almanac';

/** Solar month grid (Mon-first) with lunar day under each solar day. */
export function MonthGrid({ cells, firstWeekday, weekdays, legendHuangdao, legendLunarStart, today }: { cells: MonthCell[]; firstWeekday: number; weekdays: string[]; legendHuangdao: string; legendLunarStart: string; today: string }) {
  const lead = (firstWeekday + 6) % 7; // JS Sunday=0 → Monday-first offset
  return (
    <div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-black/60" role="row">
        {weekdays.map((w) => (
          <div key={w} role="columnheader" className="py-1">{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" data-testid="month-grid">
        {Array.from({ length: lead }).map((_, i) => (
          <div key={`lead-${i}`} aria-hidden />
        ))}
        {cells.map((c) => (
          <div
            key={c.date}
            data-testid="day-cell"
            data-date={c.date}
            data-lunar={`${c.lunarMonth}/${c.lunarDay}`}
            className={`min-h-16 rounded-lg border p-1 text-sm ${c.huangdao ? 'border-jade/40 bg-jade/5' : 'border-black/10 bg-white'} ${c.date === today ? 'ring-2 ring-gold' : ''} ${c.weekday === 0 ? 'text-vermilion' : ''}`}
          >
            <div className="flex items-baseline justify-between">
              <span className="font-semibold">{c.day}</span>
              <span className="text-[10px] text-black/40">{c.dayGanzhiHan}</span>
            </div>
            <div className={`text-xs ${c.lunarMonthStart ? 'font-semibold text-gold' : 'text-black/60'}`}>
              {c.lunarMonthStart ? `${c.lunarDay}/${c.lunarMonth}${c.isLeapMonth ? '*' : ''}` : c.lunarDay}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex gap-4 text-xs text-black/60">
        <span><span className="mr-1 inline-block h-3 w-3 rounded border border-jade/40 bg-jade/5 align-middle" />{legendHuangdao}</span>
        <span><span className="mr-1 font-semibold text-gold">1/n</span>{legendLunarStart}</span>
      </p>
    </div>
  );
}
