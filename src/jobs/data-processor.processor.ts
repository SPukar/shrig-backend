import {
  InjectQueue,
  OnQueueCompleted,
  OnQueueFailed,
  OnQueueStalled,
  Process,
  Processor,
} from '@nestjs/bull';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Job, Queue } from 'bull';
import { Model } from 'mongoose';
import { CacheService } from 'src/cache/cache.service';
import {
  DataPoint,
  DataPointDocument,
} from 'src/data/schemas/data-point.schema';
import { ProcessDataJob } from './types/job.types';

@Injectable()
@Processor('data-processing')
export class DataProcessorService {
  private readonly logger = new Logger(DataProcessorService.name);

  constructor(
    @InjectQueue('data-processing') private dataQueue: Queue,
    @InjectModel(DataPoint.name)
    private dataPointModel: Model<DataPointDocument>,
    private readonly cacheService: CacheService,
  ) {}
  @Process('process_data')
  async processDataJob(job: Job<ProcessDataJob>) {
    const { data, batch_id, priority } = job.data;

    try {
      this.logger.log(
        `Processing data batch ${batch_id} with ${data.length} points`,
      );

      await job.progress(10);

      const docs = data.map((point) => ({
        ...point,
        timestamp: point.timestamp || new Date(),
      }));
      const savedData = await this.dataPointModel.insertMany(docs);
      await job.progress(50);

      const timeAgo = new Date(Date.now() - 5 * 60 * 1000);
      const statsResult = await this.dataPointModel.aggregate([
        { $match: { timestamp: { $gte: timeAgo } } },
        {
          $group: {
            _id: null,
            total_points: { $sum: 1 },
            avg_value: { $avg: '$value' },
            min_value: { $min: '$value' },
            max_value: { $max: '$value' },
          },
        },
      ]);

      const stats = statsResult[0] || {
        total_point: 0,
        avg_value: 0,
        min_value: 0,
        max_value: 0,
      };
      await job.progress(70);

      await this.cacheService.set('realtime_stats', stats, 60);
      await job.progress(80);

      this.logger.log(`Successfully processed data batch ${batch_id}`);

      await job.progress(100);

      return {
        batch_id,
        processed_count: savedData.length,
        stats,
      };
    } catch (error) {
      this.logger.error(`Error processing data batch ${batch_id}:`, error);
      throw error;
    }
  }

  async addDataProcessingJob(data: any[], priority: number = 0) {
    const batch_id = `batch_${Date.now}_${Math.random().toString(36).substring(2, 9)}`;

    await this.dataQueue.add(
      'process_data',
      {
        data,
        batch_id,
        priority,
      },
      {
        priority,
        delay: 0,
      },
    );

    this.logger.log(`Added data processing job for batch ${batch_id}`);
  }

  @OnQueueCompleted()
  onCompleted(job: Job, result: any) {
    this.logger.log(`Job ${job.id} completed with result:`, result);
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed`, error);
  }

  @OnQueueStalled()
  onStalled(job: Job) {
    this.logger.warn(`Job ${job.id} stalled`);
  }
}
