import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CacheModule } from 'src/cache/cache.module';
import { DataPoint, DataPointSchema } from 'src/data/schemas/data-point.schema';
import { DataProcessorService } from './data-processor.processor';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'data-processing',
    }),
    MongooseModule.forFeature([
      { name: DataPoint.name, schema: DataPointSchema },
    ]),
    CacheModule,
  ],
  providers: [DataProcessorService],
  exports: [DataProcessorService],
})
export class JobsModule {}
