import { BadRequestException, HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaClient } from '@prisma/client';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto, OrderPaginationDto } from './dto';
import { PRODUCT_SERVICE } from 'src/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService extends PrismaClient implements OnModuleInit {

  constructor(
    @Inject(PRODUCT_SERVICE) private readonly productClient: ClientProxy
  ) {
    super();
  }

  private readonly logger = new Logger(`OrderService`)
1
  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Database connected`)
  } 
  async create(createOrderDto: CreateOrderDto) {
    try {
    
      //1- Validate products
      const productsIds = createOrderDto.items.map( item => item.productId);
      const products: any[] = await firstValueFrom(
        this.productClient.send({ cmd: 'validate_products'}, productsIds)
      ) 

      //2- calculate total amount and total items
      const totalAmount = createOrderDto.items.reduce( (acc, orderItem) => {
        const price = products.find( product => product.id === orderItem.productId).price;

        return price * orderItem.qantity;

      }, 0)
      
      const totalItems = createOrderDto.items.reduce( (acc, orderItem) => { 
        return acc + orderItem.qantity
      }, 0)

      //3- Create order in database
      const order = await this.order.create({
        data: {
          totalAmount: totalAmount,
          totalItems: totalItems,
          OrderItem: {
            createMany: {
              data: createOrderDto.items.map( item => ({
                quantity: item.qantity,
                productId: item.productId,
                price: products.find( product => product.id === item.productId).price
              }))
            }
          }
        },
        include: {
          OrderItem: {
            select: {
              price: true,
              quantity: true,
              productId: true

            }
          }
        }
      })

      return {
        ...order,
        OrderItem: order.OrderItem.map( item => ({
          ...item,
          name: products.find( product => product.id === item.productId).name
        }))
      };

      
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Check logs for more information`
      })
    }


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
      },
      include: {
        OrderItem: {
          select: {
            price: true,
            quantity: true,
            productId: true
          }
        }
      }
    });

    if( !order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} not found`
      })
    }

    const productsIds = order.OrderItem.map( item => item.productId);

    const products: any[] = await firstValueFrom(
      this.productClient.send({ cmd: 'validate_products'}, productsIds)
    ) 

    return {
      ...order,
      OrderItem: order.OrderItem.map( item => ({
        ...item,
        name: products.find( product => product.id === item.productId).name
      }))
    };
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
