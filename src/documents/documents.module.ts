import { Module } from '@nestjs/common';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';
import { DbModule } from '../db/db.module';
import { AuthLiteModule } from '../authlite/authlite.module';

@Module({
  imports: [DbModule, AuthLiteModule],
  providers: [DocumentsService],
  controllers: [DocumentsController]
})
export class DocumentsModule {}
