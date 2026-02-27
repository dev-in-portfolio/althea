import 'server-only';
import { getDbError, getPool } from './db';

function requirePool() {
  const pool = getPool();
  if (!pool) {
    throw new Error(getDbError() || 'Database unavailable.');
  }
  return pool;
}

function buildSortClause(sort?: string) {
  switch (sort) {
    case 'created_at_asc':
      return 'r.created_at asc';
    case 'amount_desc':
      return 'r.amount_cents desc nulls last';
    case 'amount_asc':
      return 'r.amount_cents asc nulls last';
    case 'vendor_asc':
      return 'r.vendor asc';
    case 'vendor_desc':
      return 'r.vendor desc';
    case 'created_at_desc':
    default:
      return 'r.created_at desc';
  }
}

export async function ensureUser(uid: string) {
  const pool = requirePool();
  await pool.query('insert into users (uid) values ($1) on conflict do nothing', [uid]);
}

export async function createReceipt(uid: string, input: { title: string; vendor: string; amountCents?: number | null; receiptDate?: string | null }) {
  const pool = requirePool();
  const result = await pool.query(
    `insert into receipts (uid, title, vendor, amount_cents, receipt_date)
     values ($1, $2, $3, $4, $5) returning id`,
    [uid, input.title.trim(), input.vendor.trim(), input.amountCents ?? null, input.receiptDate ?? null]
  );
  return result.rows[0];
}

export async function finalizeReceipt(uid: string, id: string, input: { storagePath: string; mimeType: string }) {
  const pool = requirePool();
  const result = await pool.query(
    `update receipts
     set storage_path = $1, mime_type = $2, status = 'ready'
     where id = $3 and uid = $4
     returning id, storage_path`,
    [input.storagePath, input.mimeType, id, uid]
  );
  return result.rows[0] || null;
}

export async function listReceipts(
  uid: string,
  params: { tag?: string; q?: string; from?: string; to?: string; status?: string; limit?: number; sort?: string }
) {
  const pool = requirePool();
  const values: any[] = [uid];
  let idx = 2;
  const filters: string[] = ['r.uid = $1'];

  if (params.q) {
    const terms = params.q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      values.push(`%${term}%`);
      filters.push(`(lower(r.vendor) like $${idx} or lower(r.title) like $${idx})`);
      idx += 1;
    }
  }
  if (params.from) {
    values.push(params.from);
    filters.push(`r.receipt_date >= $${idx}`);
    idx += 1;
  }
  if (params.to) {
    values.push(params.to);
    filters.push(`r.receipt_date <= $${idx}`);
    idx += 1;
  }
  if (params.tag) {
    values.push(params.tag.toLowerCase());
    filters.push(`exists (
      select 1 from receipt_tags rt
      join tags t on t.id = rt.tag_id
      where rt.receipt_id = r.id and lower(t.name) = $${idx}
    )`);
    idx += 1;
  }
  if (params.status && ['pending', 'ready'].includes(params.status)) {
    values.push(params.status);
    filters.push(`r.status = $${idx}`);
    idx += 1;
  }

  values.push(Math.min(params.limit ?? 50, 200));
  const orderBy = buildSortClause(params.sort);

  const result = await pool.query(
    `select r.id, r.title, r.vendor, r.amount_cents, r.receipt_date, r.storage_path, r.mime_type, r.status, r.created_at
     from receipts r
     where ${filters.join(' and ')}
     order by ${orderBy}
     limit $${idx}`,
    values
  );
  return result.rows;
}

export async function listReceiptsBefore(
  uid: string,
  params: { before: string; tag?: string; q?: string; from?: string; to?: string; status?: string; limit?: number; sort?: string }
) {
  const pool = requirePool();
  const values: any[] = [uid];
  let idx = 2;
  const filters: string[] = ['r.uid = $1'];

  if (params.q) {
    const terms = params.q.toLowerCase().split(/\s+/).filter(Boolean);
    for (const term of terms) {
      values.push(`%${term}%`);
      filters.push(`(lower(r.vendor) like $${idx} or lower(r.title) like $${idx})`);
      idx += 1;
    }
  }
  if (params.from) {
    values.push(params.from);
    filters.push(`r.receipt_date >= $${idx}`);
    idx += 1;
  }
  if (params.to) {
    values.push(params.to);
    filters.push(`r.receipt_date <= $${idx}`);
    idx += 1;
  }
  if (params.tag) {
    values.push(params.tag.toLowerCase());
    filters.push(`exists (
      select 1 from receipt_tags rt
      join tags t on t.id = rt.tag_id
      where rt.receipt_id = r.id and lower(t.name) = $${idx}
    )`);
    idx += 1;
  }
  if (params.status && ['pending', 'ready'].includes(params.status)) {
    values.push(params.status);
    filters.push(`r.status = $${idx}`);
    idx += 1;
  }

  values.push(params.before);
  filters.push(`r.created_at < $${idx}`);
  idx += 1;

  values.push(Math.min(params.limit ?? 50, 200));
  const orderBy = buildSortClause(params.sort);

  const result = await pool.query(
    `select r.id, r.title, r.vendor, r.amount_cents, r.receipt_date, r.storage_path, r.mime_type, r.status, r.created_at
     from receipts r
     where ${filters.join(' and ')}
     order by ${orderBy}
     limit $${idx}`,
    values
  );
  return result.rows;
}

export async function getReceipt(uid: string, id: string) {
  const pool = requirePool();
  const receipt = await pool.query(
    `select id, title, vendor, amount_cents, receipt_date, storage_path, mime_type, status, created_at
     from receipts where id = $1 and uid = $2`,
    [id, uid]
  );
  if (receipt.rowCount === 0) return null;
  const tags = await pool.query(
    `select t.id, t.name from tags t
     join receipt_tags rt on rt.tag_id = t.id
     where rt.receipt_id = $1 and t.uid = $2
     order by t.name asc`,
    [id, uid]
  );
  return { ...receipt.rows[0], tags: tags.rows };
}

export async function updateReceipt(
  uid: string,
  id: string,
  input: { title?: string; vendor?: string; amountCents?: number | null; receiptDate?: string | null }
) {
  const pool = requirePool();
  const fields: string[] = [];
  const values: any[] = [uid, id];
  let idx = 3;

  if (input.title !== undefined) {
    fields.push(`title = $${idx}`);
    values.push(input.title.trim());
    idx += 1;
  }
  if (input.vendor !== undefined) {
    fields.push(`vendor = $${idx}`);
    values.push(input.vendor.trim());
    idx += 1;
  }
  if (input.amountCents !== undefined) {
    fields.push(`amount_cents = $${idx}`);
    values.push(input.amountCents);
    idx += 1;
  }
  if (input.receiptDate !== undefined) {
    fields.push(`receipt_date = $${idx}`);
    values.push(input.receiptDate);
    idx += 1;
  }

  if (fields.length === 0) return null;

  const result = await pool.query(
    `update receipts set ${fields.join(', ')} where uid = $1 and id = $2 returning id, title, vendor, amount_cents, receipt_date, storage_path, mime_type, status, created_at`,
    values
  );
  return result.rows[0] || null;
}

export async function addTag(uid: string, receiptId: string, name: string) {
  const pool = requirePool();
  const tagRes = await pool.query(
    'insert into tags (uid, name) values ($1, $2) on conflict (uid, name) do update set name = excluded.name returning id, name',
    [uid, name.trim().toLowerCase()]
  );
  const tagId = tagRes.rows[0].id;
  await pool.query(
    'insert into receipt_tags (receipt_id, tag_id) values ($1, $2) on conflict do nothing',
    [receiptId, tagId]
  );
  return tagRes.rows[0];
}

export async function removeTag(uid: string, receiptId: string, tagId: string) {
  const pool = requirePool();
  const result = await pool.query(
    `delete from receipt_tags rt
     using tags t
     where rt.tag_id = t.id and rt.receipt_id = $1 and t.uid = $2 and t.id = $3
     returning t.id, t.name`,
    [receiptId, uid, tagId]
  );
  return result.rows[0] || null;
}

export async function listTags(uid: string, limit = 20) {
  const pool = requirePool();
  const result = await pool.query(
    'select id, name from tags where uid = $1 order by name asc limit $2',
    [uid, Math.min(limit, 50)]
  );
  return result.rows;
}

export async function deleteReceipt(uid: string, id: string) {
  const pool = requirePool();
  const result = await pool.query('delete from receipts where id = $1 and uid = $2 returning storage_path', [id, uid]);
  return result.rows[0] || null;
}
