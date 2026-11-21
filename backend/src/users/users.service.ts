import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { Model, Types } from 'mongoose';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { IUsersService, PaginatedUsers } from './interfaces/users-service.interface';
import { User, UserDocument, UserStatus } from './schemas/user.schema';

const scrypt = promisify(scryptCallback);

@Injectable()
export class UsersService implements IUsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) { }

  async hashPassword(plainPassword: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(plainPassword, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verifyPassword(plainPassword: string, storedHash: string): Promise<boolean> {
    const [salt, keyHex] = storedHash.split(':');
    if (!salt || !keyHex) return false;
    const keyBuffer = Buffer.from(keyHex, 'hex');
    const derivedKey = (await scrypt(plainPassword, salt, 64)) as Buffer;
    if (keyBuffer.length !== derivedKey.length) return false;
    return timingSafeEqual(keyBuffer, derivedKey);
  }

  async create(dto: CreateUserDto): Promise<UserDocument> {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const existing = await this.userModel.exists({ email: normalizedEmail });
    if (existing) {
      throw new ConflictException('A user with this email already exists');
    }

    const passwordHash = await this.hashPassword(dto.password);
    const created = new this.userModel({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      email: normalizedEmail,
      passwordHash,
      status: dto.status ?? UserStatus.ACTIVE,
      loginsCounter: 0,
    });

    return created.save();
  }

  async findWithPagination(page = 1, limit = 6): Promise<PaginatedUsers> {
    const safePage = Math.max(1, Math.floor(page));
    const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));
    const skip = (safePage - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.userModel
        .find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(safeLimit)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async findById(id: string): Promise<UserDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.trim().toLowerCase() })
      .select('+passwordHash')
      .exec();
  }

  async update(id: string, dto: UpdateUserDto & { createdAt?: unknown }): Promise<UserDocument> {
    if ('createdAt' in dto && dto.createdAt !== undefined) {
      throw new BadRequestException('Creation time cannot be updated');
    }

    const user = await this.findById(id);

    const isAttemptingNameChange =
      (dto.firstName !== undefined && dto.firstName.trim() !== user.firstName) ||
      (dto.lastName !== undefined && dto.lastName.trim() !== user.lastName);

    if (user.status === UserStatus.INACTIVE && isAttemptingNameChange) {
      throw new BadRequestException(
        'First Name and Last Name cannot be updated while the user is inactive',
      );
    }

    if (dto.email !== undefined) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const duplicate = await this.userModel.exists({
          email: normalizedEmail,
          _id: { $ne: user._id },
        });
        if (duplicate) {
          throw new ConflictException('A user with this email already exists');
        }
        user.email = normalizedEmail;
      }
    }

    if (dto.firstName !== undefined) {
      user.firstName = dto.firstName.trim();
    }
    if (dto.lastName !== undefined) {
      user.lastName = dto.lastName.trim();
    }
    if (dto.status !== undefined) {
      user.status = dto.status;
    }

    user.updatedAt = new Date();
    return user.save();
  }

  async incrementLoginsCounter(id: string): Promise<UserDocument | null> {
    return this.userModel
      .findByIdAndUpdate(
        id,
        { $inc: { loginsCounter: 1 }, $set: { updatedAt: new Date() } },
        { new: true },
      )
      .exec();
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('User not found');
    }
    const deleted = await this.userModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('User not found');
    }
  }
}
