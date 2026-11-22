import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { PASSWORD_CONFIG } from '../../common/constants';

export class SignUpDto {
  @ApiProperty({ example: 'Paul' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Walker' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'paul@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: PASSWORD_CONFIG.MIN_LENGTH, example: 'StrongPass123' })
  @IsString()
  @MinLength(PASSWORD_CONFIG.MIN_LENGTH, {
    message: `Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`,
  })
  password: string;
}