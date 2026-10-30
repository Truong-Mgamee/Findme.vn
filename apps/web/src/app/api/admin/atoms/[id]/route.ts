import { NextResponse, type NextRequest } from 'next/server';
import { isAdmin } from '@/lib/admin-guard';
import { updateAtom, type AtomPatch } from '@/lib/admin-api';

export const runtime = 'nodejs';

/** PUT /api/admin/atoms/:id {title?, bodyMd?, status?, reviewer?} — browser → (cookie check) → API with X-Admin-Token. */
export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const patch = (await req.json().catch(() => ({}))) as AtomPatch;
  const r = await updateAtom(id, patch);
  if (!r.ok) return NextResponse.json({ error: 'upstream', message: r.message }, { status: r.status || 502 });
  return NextResponse.json(r.data);
}
