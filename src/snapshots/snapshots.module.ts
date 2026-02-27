import { Module } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { SnapshotsController } from './snapshots.controller';
import { DbModule } from '../db/db.module';
import { AuthLiteModule } from '../authlite/authlite.module';

@Module({
  imports: [DbModule, AuthLiteModule],
  providers: [SnapshotsService],
  controllers: [SnapshotsController]
})
export class SnapshotsModule {}
