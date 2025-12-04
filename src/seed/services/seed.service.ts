import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from 'src/orders/schemas/order.schema';
import { DataPoint } from 'src/data/schemas/data-point.schema';
import { OrderSeeder } from 'src/seed/seeders/order.seeder';
import { DataPointSeeder } from 'src/seed/seeders/data-point.seeder';

@Injectable()
export class SeedService {
  private orderSeeder: OrderSeeder;
  private dataPointSeeder: DataPointSeeder;

  constructor(
    @InjectModel(Order.name) private orderModel: Model<Order>,
    @InjectModel(DataPoint.name) private dataPointModel: Model<DataPoint>,
  ) {
    this.orderSeeder = new OrderSeeder(this.orderModel);
    this.dataPointSeeder = new DataPointSeeder(this.dataPointModel);
  }

  async seedAll(): Promise<void> {
    console.log('🌱 Starting database seeding...\n');

    await this.clearAll();

    await this.orderSeeder.seed(50);
    await this.dataPointSeeder.seed(100);

    console.log('\n✅ Database seeding completed!');
  }

  async clearAll(): Promise<void> {
    console.log('🗑️  Clearing database...\n');

    await this.orderSeeder.clear();
    await this.dataPointSeeder.clear();

    console.log('');
  }

  async seedOrders(count: number = 50): Promise<void> {
    await this.orderSeeder.seed(count);
  }

  async seedDataPoints(count: number = 100): Promise<void> {
    await this.dataPointSeeder.seed(count);
  }
}
