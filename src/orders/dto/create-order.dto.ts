import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { OrderStatus } from '../types/order.types';

export class CreateOrderDto {
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  customer_name: string;

  @IsEmail()
  @MaxLength(255)
  customer_email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  product_name: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;
}
