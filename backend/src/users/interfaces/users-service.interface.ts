import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserDocument } from '../schemas/user.schema';

export interface PaginatedUsers {
  items: UserDocument[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUsersService {
  hashPassword(plainPassword: string): Promise<string>;
  verifyPassword(plainPassword: string, storedHash: string): Promise<boolean>;
  create(dto: CreateUserDto): Promise<UserDocument>;
  findWithPagination(page?: number, limit?: number): Promise<PaginatedUsers>;
  findById(id: string): Promise<UserDocument>;
  findByEmailWithPassword(email: string): Promise<UserDocument | null>;
  update(id: string, dto: UpdateUserDto & { createdAt?: unknown }): Promise<UserDocument>;
  incrementLoginsCounter(id: string): Promise<UserDocument | null>;
  remove(id: string): Promise<void>;
}
