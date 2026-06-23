import { auth } from './auth/server';

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? process.env.ADMIN_EMAIL ?? '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export async function getAdminSession() {
  const { data: session } = await auth.getSession();
  if (!session?.user) return null;
  // If no admin emails configured, any authenticated user can access admin (demo mode)
  if (ADMIN_EMAILS.length > 0) {
    if (!ADMIN_EMAILS.includes(session.user.email?.toLowerCase() ?? '')) return null;
  }
  return session;
}
