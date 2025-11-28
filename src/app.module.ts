import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersModule } from './orders/orders.module';
import { CacheModule } from './cache/cache.module';
import { DataModule } from './data/data.module';
import { JobsModule } from './jobs/jobs.module';
import { BullModule } from '@nestjs/bull';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost/nest'),
    BullModule.forRoot({
      redis: {
        host: 'localhost',
        port: 6379,
      },
    }),
    CacheModule,
    OrdersModule,
    DataModule,
    JobsModule,
    WebsocketModule,
  ],
})
export class AppModule {}
