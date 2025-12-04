import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { SeedService } from 'src/seed/services/seed.service';
import { SeedModule } from './seed.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get seed service
  const seedService = app.select(SeedModule).get(SeedService);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  try {
    switch (command) {
      case 'all':
        await seedService.seedAll();
        break;
      case 'clear':
        await seedService.clearAll();
        break;
      case 'orders':
        const orderCount = parseInt(args[1]) || 50;
        await seedService.clearAll();
        await seedService.seedOrders(orderCount);
        break;
      case 'datapoints':
        const dataCount = parseInt(args[1]) || 100;
        await seedService.clearAll();
        await seedService.seedDataPoints(dataCount);
        break;
      default:
        console.log('Unknown command. Available commands:');
        console.log('  all - Seed all data (default)');
        console.log('  clear - Clear all data');
        console.log('  orders [count] - Seed only orders');
        console.log('  datapoints [count] - Seed only data points');
    }
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();
