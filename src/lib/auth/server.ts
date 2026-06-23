import { cookies } from 'next/headers';
import { verifyToken, COOKIE_NAME } from '../session';
import { getSql } from '../db';

export const auth = {
  async getSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return { data: null };

    const userId = verifyToken(token);
    if (!userId) return { data: null };

    const sql = getSql();
    const rows = await sql`SELECT id, name, email FROM "User" WHERE id = ${userId} LIMIT 1`;
    if (!rows.length) return { data: null };

    const u = rows[0];
    return { data: { user: { id: u.id as string, name: u.name as string, email: u.email as string } } };
  },
};
