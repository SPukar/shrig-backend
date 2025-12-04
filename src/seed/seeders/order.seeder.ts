import { faker } from '@faker-js/faker';
import { Model } from 'mongoose';
import { Order } from 'src/orders/schemas/order.schema';
import { OrderStatus } from 'src/orders/types/order.types';

export class OrderSeeder {
  constructor(private readonly orderModel: Model<Order>) {}

  async seed(count: number = 50): Promise<void> {
    console.log(`Seeding ${count} orders...`);

    const orders: Partial<Order>[] = [];
    const statuses: OrderStatus[] = Object.values(OrderStatus);

    for (let i = 0; i < count; i++) {
      const quantity = faker.number.int({ min: 1, max: 10 });
      const price = parseFloat(faker.commerce.price({ min: 10, max: 1000 }));

      orders.push({
        customerName: faker.person.fullName(),
        customerEmail: faker.internet.email().toLowerCase(),
        productName: faker.commerce.productName(),
        quantity,
        price,
        totalAmount: quantity * price,
        status: faker.helpers.arrayElement(statuses),
      });
    }

    await this.orderModel.insertMany(orders);
    console.log(`✓ Seeded ${count} orders successfully`);
  }

  async clear(): Promise<void> {
    await this.orderModel.deleteMany({});
    console.log('✓ Cleared all orders');
  }
}
