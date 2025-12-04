import { faker } from '@faker-js/faker';
import { Model } from 'mongoose';
import { DataPoint } from 'src/data/schemas/data-point.schema';

export class DataPointSeeder {
  constructor(private readonly dataPointModel: Model<DataPoint>) {}

  async seed(count: number = 100): Promise<void> {
    console.log(`Seeding ${count} data points...`);

    const dataPoints: Partial<DataPoint>[] = [];
    const types = ['temperature', 'humidity', 'pressure', 'speed', 'voltage'];
    const sensorIds = Array.from({ length: 10 }, (_, i) => `SENSOR-${i + 1}`);

    for (let i = 0; i < count; i++) {
      const type = faker.helpers.arrayElement(types);

      // Generate realistic values based on type
      let value: number;
      switch (type) {
        case 'temperature':
          value = faker.number.float({ min: -10, max: 40, fractionDigits: 2 });
          break;
        case 'humidity':
          value = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
          break;
        case 'pressure':
          value = faker.number.float({
            min: 980,
            max: 1050,
            fractionDigits: 2,
          });
          break;
        case 'speed':
          value = faker.number.float({ min: 0, max: 200, fractionDigits: 2 });
          break;
        case 'voltage':
          value = faker.number.float({ min: 0, max: 24, fractionDigits: 2 });
          break;
        default:
          value = faker.number.float({ min: 0, max: 100, fractionDigits: 2 });
      }

      dataPoints.push({
        type,
        value,
        metadata: {
          sensor_id: faker.helpers.arrayElement(sensorIds),
          location: faker.location.city(),
          unit: this.getUnit(type),
          accuracy: faker.number.float({
            min: 95,
            max: 99.9,
            fractionDigits: 2,
          }),
        },
        timestamp: faker.date.recent({ days: 30 }),
      });
    }

    await this.dataPointModel.insertMany(dataPoints);
    console.log(`✓ Seeded ${count} data points successfully`);
  }

  async clear(): Promise<void> {
    await this.dataPointModel.deleteMany({});
    console.log('✓ Cleared all data points');
  }

  private getUnit(type: string): string {
    const units: Record<string, string> = {
      temperature: '°C',
      humidity: '%',
      pressure: 'hPa',
      speed: 'km/h',
      voltage: 'V',
    };
    return units[type] || 'unit';
  }
}
