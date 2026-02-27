import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class DocumentsService {
  constructor(private db: DbService) {}

  async createDocument(userId: string, title: string) {
    const created = await this.db.query(
      `insert into documents (user_id, title)
       values ($1, $2)
       returning id, title, created_at`,
      [userId, title]
    );
    return created.rows[0];
  }

  async listDocuments(userId: string) {
    const result = await this.db.query(
      `select d.id, d.title, d.created_at,
              (select count(*)::int from snapshots s where s.document_id = d.id) as snapshot_count
       from documents d
       where d.user_id = $1
       order by d.created_at desc`,
      [userId]
    );
    return result.rows;
  }

  async getDocument(userId: string, docId: string) {
    const result = await this.db.query(
      `select id, title, created_at
       from documents
       where id = $1 and user_id = $2`,
      [docId, userId]
    );
    if (!result.rows.length) throw new NotFoundException('Document not found.');
    return result.rows[0];
  }

  async deleteDocument(userId: string, docId: string) {
    const result = await this.db.query(
      'delete from documents where id = $1 and user_id = $2',
      [docId, userId]
    );
    return { ok: (result.rowCount ?? 0) > 0 };
  }
}
