import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SnapshotsService } from './snapshots.service';
import { DeviceKeyGuard } from '../authlite/device-key.guard';
import { CreateSnapshotDto } from './dto/create-snapshot.dto';

@Controller('api')
@UseGuards(DeviceKeyGuard)
export class SnapshotsController {
  constructor(private snapshots: SnapshotsService) {}

  @Post('documents/:id/snapshots')
  create(@Req() req: any, @Param('id') id: string, @Body() dto: CreateSnapshotDto) {
    return this.snapshots.createSnapshot(
      req.userId,
      id,
      dto.body,
      dto.summary ?? '',
      dto.diffAdded ?? 0,
      dto.diffRemoved ?? 0
    );
  }

  @Get('documents/:id/snapshots')
  list(@Req() req: any, @Param('id') id: string) {
    return this.snapshots.listSnapshots(req.userId, id);
  }

  @Get('snapshots/:id')
  get(@Req() req: any, @Param('id') id: string) {
    return this.snapshots.getSnapshot(req.userId, id);
  }

  @Get('documents/:id/latest')
  latest(@Req() req: any, @Param('id') id: string) {
    return this.snapshots.getLatest(req.userId, id);
  }

  @Get('documents/:id/compare')
  compare(
    @Req() req: any,
    @Param('id') id: string,
    @Query('v1') v1: string,
    @Query('v2') v2: string
  ) {
    return this.snapshots.compare(req.userId, id, Number(v1), Number(v2));
  }
}
