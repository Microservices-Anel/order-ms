import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(`OrderService`)
1
  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database connected`)
  } 
  create(createOrderDto: CreateOrderDto) {
    return 'This action adds a new order from Microservice';
  }

  findAll() {
    return `This action returns all orders`;
  }

  findOne(id: number) {
    return `This action returns a #${id} order`;
  }
  remove(id: number) {
    return `This action removes a #${id} order`;
  }
}
