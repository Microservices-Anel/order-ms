import { BadRequestException, HttpStatus, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, OrderPaginationDto } from './dto';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  private readonly logger = new Logger(`OrderService`)
1
  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database connected`)
  } 
  create(createOrderDto: CreateOrderDto) {
    return this.order.create({
      data: createOrderDto
    })

  }

  async findAll(orderPaginationDto: OrderPaginationDto) {

    const { status, limit, page } = orderPaginationDto;
    const totalPages = await this.order.count({
      where: {
        status
      }
    })
    const currentPage = page
    const perPage = orderPaginationDto.limit;

    return {
      data: await this.order.findMany({
        skip: ( currentPage - 1 ) * perPage,
        take: perPage,
        where: {
          status
        }
      }),
      meta: {
        total: totalPages,
        page: currentPage,
        lastPage: Math.ceil( totalPages / perPage)
      },
    }
  }

  async findOne(id: string) {


    const order = await this.order.findFirst({
      where: {
        id
      }
    })

    if( !order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    return order
  }
  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const order = await this.findOne(changeOrderStatusDto.id)

    if( order.status === changeOrderStatusDto.status) {
      return order;
    }


    return this.order.update({
      where: {
        id: changeOrderStatusDto.id
      },
      data: {
        status: changeOrderStatusDto.status
      }
    })

  }
}
