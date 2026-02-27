import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './db/db.module';
import { AuthLiteModule } from './authlite/authlite.module';
import { DocumentsModule } from './documents/documents.module';
import { SnapshotsModule } from './snapshots/snapshots.module';
import { AppController } from './app.controller';
import { RequestIdMiddleware } from './request-id.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DbModule,
    AuthLiteModule,
    DocumentsModule,
    SnapshotsModule
  ],
  controllers: [AppController]
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
