import { Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DataPoint, DataPointDocument } from './schemas/data-point.schema';
import { Model } from 'mongoose';
import { CreateDataPointDto } from './dto/create-data-point.dto';
import { QueryDataDto } from './dto/query-data.dto';
import { DataPoint as DataPointType, DataStats } from './types/data.types';

export class DataRepository {
  private readonly logger = new Logger(DataRepository.name);

  constructor(
    @InjectModel(DataPoint.name)
    private dataPointModel: Model<DataPointDocument>,
  ) {}

  async create(dataPoints: CreateDataPointDto[]) {
    if (dataPoints.length === 0) return [];

    try {
      const docs = dataPoints.map((point) => ({
        ...point,
        timestamp: point.timestamp || new Date(),
      }));
      const savedDataPoints = await this.dataPointModel.insertMany(docs);

      return savedDataPoints.map(this.transformDataPoint);
    } catch (error) {
      this.logger.error('Error creating data points:', error);
      throw error;
    }
  }

  async findAll(query: QueryDataDto) {
    const { page = 1, limit = 50, type, startDate, endDate } = query;

    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = startDate;
      if (endDate) filter.timestamp.$lte = endDate;
    }

    try {
      const [data, total] = await Promise.all([
        this.dataPointModel
          .find(filter)
          .sort({ timestamp: -1 })
          .skip(skip)
          .limit(limit)
          .lean(),
        this.dataPointModel.countDocuments(filter),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: data.map(this.transformDataPoint),
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      this.logger.error('Error fetching data points:', error);
      throw error;
    }
  }

  async getStats(): Promise<DataStats> {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            total_points: { $sum: 1 },
            avg_value: { $avg: '$value' },
            min_value: { $min: '$value' },
            max_value: { $max: '$value' },
          },
        },
      ];

      const typeStatsPipeline = [
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ];

      const [statsResult, typeStatsResult] = await Promise.all([
        this.dataPointModel.aggregate(pipeline),
        this.dataPointModel.aggregate(typeStatsPipeline),
      ]);

      const stats = statsResult[0] || {
        total_points: 0,
        avg_value: 0,
        min_value: 0,
        max_value: 0,
      };

      const dataByType: Record<string, number> = {};
      typeStatsResult.forEach((row) => {
        dataByType[row._id] = row.count;
      });

      return {
        total_points: stats.total_points,
        avg_value: stats.avg_value || 0,
        min_value: stats.min_value || 0,
        max_value: stats.max_value || 0,
        data_by_type: dataByType,
      };
    } catch (error) {
      this.logger.error('Error fetching data stats:', error);
      throw error;
    }
  }

  async getRealtimeStats(minutes: number = 5): Promise<DataStats> {
    const cutoffTime = new Date(Date.now() - minutes * 60 * 1000);

    try {
      const pipeline = [
        {
          $match: {
            timestamp: { $gte: cutoffTime },
          },
        },
        {
          $group: {
            _id: null,
            total_points: { $sum: 1 },
            avg_value: { $avg: '$value' },
            min_value: { $min: '$value' },
            max_value: { $max: '$value' },
          },
        },
      ];

      const typeStatsPipeline = [
        {
          $match: {
            timestamp: { $gte: cutoffTime },
          },
        },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
          },
        },
      ];

      const [statsResult, typeStatsResult] = await Promise.all([
        this.dataPointModel.aggregate(pipeline),
        this.dataPointModel.aggregate(typeStatsPipeline),
      ]);

      const stats = statsResult[0] || {
        total_points: 0,
        avg_value: 0,
        min_value: 0,
        max_value: 0,
      };

      const dataByType: Record<string, number> = {};
      typeStatsResult.forEach((row) => {
        dataByType[row._id] = row.count;
      });

      return {
        total_points: stats.total_points,
        avg_value: stats.avg_value || 0,
        min_value: stats.min_value || 0,
        max_value: stats.max_value || 0,
        data_by_type: dataByType,
      };
    } catch (error) {
      this.logger.error('Error fetching realtime data stats:', error);
      throw error;
    }
  }

  async aggregateData(
    type: string,
    startDate: Date,
    endDate: Date,
    interval: 'hour' | 'day' | 'week',
  ) {
    const intervalMap = {
      hour: {
        $dateToString: { format: '%Y-%m-%d %H:00:00', date: '$timestamp' },
      },
      day: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
      week: { $dateToString: { format: '%Y-W%V', date: '$timestamp' } },
    };

    try {
      const result = await this.dataPointModel.aggregate([
        {
          $match: {
            type: type,
            timestamp: { $gte: { startDate, $lte: endDate } },
          },
        },
        {
          $group: {
            _id: intervalMap[interval],
            count: { $sum: 1 },
            avg_value: { $avg: '$value' },
            sum_value: { $sum: '$value' },
          },
        },
        {
          $sort: { _id: 1 },
        },
      ]);

      return result.map((row: any) => ({
        timestamp: new Date(row.id),
        count: row.count,
        avg_value: row.avg_value,
        sum_value: row.sum_value,
      }));
    } catch (error) {
      this.logger.error('Error aggregating data:', error);
      throw error;
    }
  }

  private transformDataPoint(dataPoint: any): DataPointType {
    return {
      id: dataPoint._id?.toString() || dataPoint.id,
      type: dataPoint.type,
      value: dataPoint.value,
      metadata: dataPoint.metadata,
      timestamp: dataPoint.timestamp,
    };
  }
}
