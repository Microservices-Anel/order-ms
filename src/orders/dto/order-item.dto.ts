import { IsNumber, IsPositive } from "class-validator";



export class OrderItemDto {

    @IsNumber()
    @IsPositive()
    productId: number;


    @IsNumber()
    @IsPositive()
    qantity: number;


    @IsNumber()
    @IsPositive()
    price: number;


}