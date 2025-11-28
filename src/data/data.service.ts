import { Injectable, Logger } from '@nestjs/common';
import { DataRepository } from './data.repository';
import { CreateDataPointDto } from './dto/create-data-point.dto';
import { CacheService } from 'src/cache/cache.service';
import { DataProcessorService } from 'src/jobs/data-processor.processor';
import { QueryDataDto } from './dto/query-data.dto';

@Injectable()
export class DataService {
  private readonly logger = new Logger(DataService.name);

  private readonly CACHE_KEY = {
    DATA_STATS: 'data:stats',
    REALTIME_STATS: 'data:realtime_stats',
    DATA_HISTORY: (query: string) => `data:history:${query}`,
  };

  constructor(
    private readonly dataRepository: DataRepository,
    private readonly cacheService: CacheService,
    private readonly dataProcessorService: DataProcessorService,
  ) {}

  async ingestData(
    dataPoints: CreateDataPointDto[],
  ): Promise<{ batch_id: string; queued: boolean }> {
    if (dataPoints.length === 0) {
      throw new Error('No data points provided');
    }

    this.validateDataPoints(dataPoints);

    if (dataPoints.length <= 10) {
      await this.dataRepository.create(dataPoints);

      await this.invalidateDataCaches();

      return {
        batch_id: `immediate_${Date.now()}`,
        queued: false,
      };
    }

    const batch_id = `batch_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 9)}`;
    await this.dataProcessorService.addDataProcessingJob(dataPoints, 1);

    return {
      batch_id,
      queued: true,
    };
  }

  async getDataHistory(query: QueryDataDto) {
    const cacheKey = this.CACHE_KEY.DATA_HISTORY(JSON.stringify(query));

    const cachedResult = await this.cacheService.get(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    const result = await this.dataRepository.findAll(query);

    await this.cacheService.set(cacheKey, result, 120);

    return result;
  }

  async getDataStats() {
    const cacheKey = this.CACHE_KEY.DATA_STATS;

    const cachedStats = await this.cacheService.getMultiLevel(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const stats = await this.dataRepository.getStats();

    await this.cacheService.setMultiLevel(cacheKey, stats, 300);

    return stats;
  }

  async getRealtimeStats() {
    const cacheKey = this.CACHE_KEY.REALTIME_STATS;

    const cachedStats = await this.cacheService.get(cacheKey);
    if (cachedStats) {
      return cachedStats;
    }

    const stats = await this.dataRepository.getRealtimeStats(5);

    await this.cacheService.set(cacheKey, stats, 30);

    return stats;
  }

  async ingestHighThroughputData(dataStream): Promise<void> {
    const BATCH_SIZE = 1000;
    const batches: CreateDataPointDto[][] = [];

    for (let i = 0; i < dataStream.length; i += BATCH_SIZE) {
      batches.push(dataStream.slice(i, i + BATCH_SIZE));
    }

    const promises = batches.map(async (batch, index) => {
      const priority = index < 3 ? 2 : 1;
      return this.dataProcessorService.addDataProcessingJob(batch, priority);
    });

    await Promise.all(promises);
    this.logger.log(
      `Queued ${batches.length} batches for high-throughput processing`,
    );
  }

  async aggregateData(
    type: string,
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week' = 'hour',
  ): Promise<
    Array<{
      timestamp: Date;
      count: number;
      avg_value: number;
      sum_value: number;
    }>
  > {
    return this.dataRepository.aggregateData(
      type,
      startDate,
      endDate,
      interval,
    );
  }

  private validateDataPoints(dataPoints: CreateDataPointDto[]) {
    for (const point of dataPoints) {
      if (!point.type || typeof point.type !== 'string') {
        throw new Error(
          'Invalid data point: type is required and must be a string',
        );
      }

      if (typeof point.value !== 'number') {
        throw new Error('Invalid data point: value must be a number');
      }

      if (point.metadata && typeof point.metadata !== 'object') {
        throw new Error('Invalid data point: metadata must be an object');
      }
    }
  }

  private async invalidateDataCaches(): Promise<void> {
    try {
      await Promise.all([
        this.cacheService.del(this.CACHE_KEY.DATA_STATS),
        this.cacheService.del(this.CACHE_KEY.REALTIME_STATS),
        this.cacheService.invalidatePattern('data:history:*'),
      ]);
    } catch (error) {
      this.logger.error('Cache invalidation failed:', error);
      throw error;
    }
  }
}
