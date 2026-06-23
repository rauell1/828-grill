import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

function buildSql(): NeonQueryFunction<false, false> {
  const raw = (process.env.DATABASE_URL ?? '')
    .replace(/^﻿/, '')   // strip BOM
    .trim()
    .replace(/^["']|["']$/g, ''); // strip stray quotes
  const base = raw.includes('?') ? raw.split('?')[0] : raw;
  return neon(base);
}

let _sql: NeonQueryFunction<false, false> | undefined;

export function getSql(): NeonQueryFunction<false, false> {
  if (!_sql) _sql = buildSql();
  return _sql;
}
