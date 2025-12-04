import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SeedService } from 'src/seed/services/seed.service';
import { Order, OrderSchema } from 'src/orders/schemas/order.schema';
import { DataPoint, DataPointSchema } from 'src/data/schemas/data-point.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: DataPoint.name, schema: DataPointSchema },
    ]),
  ],
  providers: [SeedService],
  exports: [SeedService],
})
export class SeedModule {}
