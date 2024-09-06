import { Module } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { PRODUCT_SERVICE } from 'src/config/services';
import { envs } from 'src/config';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: PRODUCT_SERVICE,
        transport: Transport.TCP,
        options: {
          host: envs.productsMicroserviceOptions.host,
          port: envs.productsMicroserviceOptions.port
        }
      }
    ])
  ],
  controllers: [OrdersController],
  providers: [OrdersService, ],
})
export class OrdersModule {}
