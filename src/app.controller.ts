import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { DbService } from './db/db.service';
import { DeviceKeyGuard } from './authlite/device-key.guard';

@Controller('api')
export class AppController {
  constructor(private db: DbService) {}

  @Get('health')
  async health() {
    const result = await this.db.query('select now() as now');
    return {
      ok: true,
      dbTime: result.rows[0].now,
      uptimeSeconds: Math.round(process.uptime()),
      version: 'v1'
    };
  }

  @UseGuards(DeviceKeyGuard)
  @Get('status')
  async status(@Req() req: any) {
    const [docs, snapshots] = await Promise.all([
      this.db.query(
        'select count(*)::int as count from documents where user_id = $1',
        [req.userId]
      ),
      this.db.query(
        `select count(*)::int as count
         from snapshots s
         join documents d on d.id = s.document_id
         where d.user_id = $1`,
        [req.userId]
      )
    ]);
    return { documents: docs.rows[0].count, snapshots: snapshots.rows[0].count };
  }
}
