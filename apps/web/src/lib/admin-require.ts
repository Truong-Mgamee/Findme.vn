import 'server-only';
import { redirect } from 'next/navigation';
import { isAdmin } from './admin-guard';

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) redirect('/admin/login');
}
