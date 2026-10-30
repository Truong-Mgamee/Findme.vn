import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-guard';
import { createAtom, type AtomCreate } from '@/lib/admin-api';

export const runtime = 'nodejs';

/** POST /api/admin/atoms → POST /v1/admin/atoms (new version). */
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => null)) as AtomCreate | null;
  if (!body?.key || !body.locale || !body.tradition || !body.title || !body.body_md) return NextResponse.json({ error: 'bad_request' }, { status: 400 });
  const r = await createAtom(body);
  if (!r.ok) return NextResponse.json({ error: 'upstream', message: r.message }, { status: r.status || 502 });
  return NextResponse.json(r.data, { status: 201 });
}
