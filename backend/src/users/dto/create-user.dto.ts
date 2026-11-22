import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { PASSWORD_CONFIG } from '../../common/constants';
import { UserStatus } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({ example: 'Grace' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Hopper' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'grace@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: PASSWORD_CONFIG.MIN_LENGTH, example: 'StrongPass123' })
  @IsString()
  @MinLength(PASSWORD_CONFIG.MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
  })
  password: string;

  @ApiPropertyOptional({ enum: UserStatus, default: UserStatus.ACTIVE })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;
}
