import { Injectable, NotFoundException } from '@nestjs/common';
import { QueryOrderDto } from './dto/query-order.dto';
import { OrderRepository } from './orders.repository';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private orderRepository: OrderRepository) {}

  async getOrders(query: QueryOrderDto) {
    const result = await this.orderRepository.findAll(query);

    return result;
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findById(id);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async searchOrders(searchTerm: string, pagination: QueryOrderDto) {
    const result = await this.orderRepository.search(searchTerm, pagination);
    return result;
  }

  async createOrder(orderData: CreateOrderDto) {
    const order = await this.orderRepository.create(orderData);
    return order;
  }

  async createBatchOrders(orders: CreateOrderDto[]) {
    if (orders.length === 0) {
      throw new Error('No orders provided for batch creation');
    }

    if (orders.length > 1000) {
      throw new Error('Batch size too large. Maximum 1000 orders per batch');
    }

    const createdOrders = await this.orderRepository.createBatch(orders);

    return createdOrders;
  }

  async getOrderStats() {
    const stats = await this.orderRepository.getStats();
    return stats;
  }
}
