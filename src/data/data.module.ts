import { Module } from '@nestjs/common';
import { DataController } from './data.controller';
import { DataService } from './data.service';
import { MongooseModule } from '@nestjs/mongoose';
import { DataPoint, DataPointSchema } from './schemas/data-point.schema';
import { CacheModule } from 'src/cache/cache.module';
import { JobsModule } from 'src/jobs/jobs.module';
import { DataRepository } from './data.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: DataPoint.name,
        schema: DataPointSchema,
      },
    ]),
    CacheModule,
    JobsModule,
  ],
  controllers: [DataController],
  providers: [DataService, DataRepository],
  exports: [DataService],
})
export class DataModule {}
