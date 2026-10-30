import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-guard';
import { runDailyOracleJob } from '@/lib/admin-api';

export const runtime = 'nodejs';

/** POST /api/admin/jobs {date, locales?, force?} → POST /v1/admin/jobs/daily-oracle */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { date?: string; locales?: string[]; force?: boolean };
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const r = await runDailyOracleJob(body.date, body.locales, body.force ?? false);
  if (!r.ok) return NextResponse.json({ error: 'upstream', message: r.message }, { status: r.status || 502 });
  return NextResponse.json(r.data);
}
