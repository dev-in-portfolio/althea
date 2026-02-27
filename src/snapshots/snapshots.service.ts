import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class SnapshotsService {
  constructor(private db: DbService) {}

  async createSnapshot(
    userId: string,
    documentId: string,
    body: string,
    summary: string,
    diffAdded: number,
    diffRemoved: number
  ) {
    const doc = await this.db.query(
      'select id from documents where id = $1 and user_id = $2',
      [documentId, userId]
    );
    if (!doc.rows.length) throw new NotFoundException('Document not found.');

    const latest = await this.db.query<{ version: number }>(
      'select version from snapshots where document_id = $1 order by version desc limit 1',
      [documentId]
    );
    const nextVersion = latest.rows.length ? latest.rows[0].version + 1 : 1;
    const created = await this.db.query(
      `insert into snapshots (document_id, version, body, summary, diff_added, diff_removed)
       values ($1, $2, $3, $4, $5, $6)
       returning id, document_id, version, summary, diff_added, diff_removed, created_at`,
      [documentId, nextVersion, body, summary, diffAdded, diffRemoved]
    );
    return created.rows[0];
  }

  async listSnapshots(userId: string, documentId: string) {
    const doc = await this.db.query(
      'select id from documents where id = $1 and user_id = $2',
      [documentId, userId]
    );
    if (!doc.rows.length) throw new NotFoundException('Document not found.');

    const result = await this.db.query(
      `select id, version, summary, diff_added, diff_removed, created_at
       from snapshots
       where document_id = $1
       order by version desc`,
      [documentId]
    );
    return result.rows;
  }

  async getSnapshot(userId: string, snapshotId: string) {
    const result = await this.db.query(
      `select s.id, s.document_id, s.version, s.body, s.summary, s.diff_added, s.diff_removed, s.created_at
       from snapshots s
       join documents d on d.id = s.document_id
       where s.id = $1 and d.user_id = $2`,
      [snapshotId, userId]
    );
    if (!result.rows.length) throw new NotFoundException('Snapshot not found.');
    return result.rows[0];
  }

  async getLatest(userId: string, documentId: string) {
    const result = await this.db.query(
      `select s.id, s.document_id, s.version, s.body, s.summary, s.diff_added, s.diff_removed, s.created_at
       from snapshots s
       join documents d on d.id = s.document_id
       where s.document_id = $1 and d.user_id = $2
       order by s.version desc
       limit 1`,
      [documentId, userId]
    );
    if (!result.rows.length) throw new NotFoundException('Snapshot not found.');
    return result.rows[0];
  }

  async compare(userId: string, documentId: string, v1: number, v2: number) {
    const rows = await this.db.query(
      `select version, summary, diff_added, diff_removed
       from snapshots s
       join documents d on d.id = s.document_id
       where s.document_id = $1 and d.user_id = $2 and s.version in ($3, $4)`,
      [documentId, userId, v1, v2]
    );
    const versionA = rows.rows.find((row) => row.version === v1);
    const versionB = rows.rows.find((row) => row.version === v2);
    if (!versionA || !versionB) throw new NotFoundException('Snapshot not found.');
    return {
      versionA: v1,
      versionB: v2,
      added: versionB.diff_added,
      removed: versionB.diff_removed,
      summaryA: versionA.summary,
      summaryB: versionB.summary
    };
  }
}
