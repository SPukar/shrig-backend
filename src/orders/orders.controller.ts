import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Query,
} from '@nestjs/common';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  private logger = new Logger(OrdersController.name);

  constructor(private ordersService: OrdersService) {}

  @Get()
  async getOrders(@Query() query: QueryOrderDto) {
    const startTime = Date.now();
    const result = await this.ordersService.getOrders(query);

    const responseTime = Date.now() - startTime;
    this.logger.log(`Orders fetched in ${responseTime}ms`);

    return {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('stats')
  async getOrdersStats() {
    const startTime = Date.now();

    const stats = await this.ordersService.getOrderStats();

    const responseTime = Date.now() - startTime;
    this.logger.log(`Order stats fetched in ${responseTime}ms`);

    const response = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    };
    return response;
  }

  @Get('search')
  async searchOrders(
    @Query('q') searchTerm: string,
    @Query() query: QueryOrderDto,
  ) {
    const startTime = Date.now();

    if (!searchTerm) {
      const response = {
        success: false,
        message: 'Search term is required',
        timestamp: new Date().toISOString(),
      };
      return response;
    }

    const result = await this.ordersService.searchOrders(searchTerm, query);

    const responseTime = Date.now() - startTime;
    this.logger.log(`Orders search completed in ${responseTime}ms`);

    const response = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    };

    return response;
  }

  @Get(':id')
  async getOrderById(@Query('id') id: string) {
    const order = await this.ordersService.getOrderById(id);

    if (!order) {
      const response = {
        success: false,
        message: 'Order not found',
        timestamp: new Date().toISOString(),
      };
      return response;
    }

    const response = {
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    };

    return response;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createOrder(@Body() createOrderDto: CreateOrderDto) {
    if (Array.isArray(createOrderDto)) {
      const orders = await this.ordersService.createBatchOrders(createOrderDto);
      const response = {
        success: true,
        data: orders,
        message: `${orders.length} orders created successfully`,
        timestamp: new Date().toISOString(),
      };

      return response;
    }

    const order = await this.ordersService.createOrder(createOrderDto);

    const response = {
      success: true,
      data: order,
      message: 'Order created successfully',
      timestamp: new Date().toISOString(),
    };

    return response;
  }
}
