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

/**
 * Domain contract for back-office user persistence and business invariants.
 * Enforces `createdAt` immutability, unique normalized email addresses,
 * and name-editing restrictions while a user account is `inactive`.
 */
export interface IUsersService {
  /**
   * Derives a salted `scrypt` password hash formatted as `salt:derivedKey`.
   *
   * @param plainPassword - Raw user password.
   */
  hashPassword(plainPassword: string): Promise<string>;

  /**
   * Performs constant-time (`timingSafeEqual`) verification of a plaintext password
   * against a stored `salt:derivedKey` hash.
   *
   * @param plainPassword - Candidate password supplied during authentication.
   * @param storedHash - Persisted `salt:derivedKey` password hash.
   */

  verifyPassword(plainPassword: string, storedHash: string): Promise<boolean>;

  /**
   * Creates a new user record with a hashed password.
   *
   * @param dto - Validated user creation payload.
   * @throws {BadRequestException} If `firstName` or `lastName` is blank after trimming.
   * @throws {ConflictException} If a user with the normalized email already exists.
   */
  create(dto: CreateUserDto): Promise<UserDocument>;

  /**
   * Retrieves a paginated list of users ordered newest-first.
   *
   * @param page - 1-based page index (clamped to `>= 1`).
   * @param limit - Page size (default `6`, clamped between `1` and `50`).
   */
  findWithPagination(page?: number, limit?: number): Promise<PaginatedUsers>;
  
  /**
   * Retrieves a single user document by MongoDB ObjectId.
   *
   * @param id - MongoDB ObjectId string.
   * @throws {NotFoundException} If the ID is malformed or no matching user exists.
   */
  findById(id: string): Promise<UserDocument>;

  /**
   * Retrieves a user document including `passwordHash` for sign-in credential verification.
   *
   * @param email - User email address (matched case-insensitively).
   */
  findByEmailWithPassword(email: string): Promise<UserDocument | null>;

  /**
   * Updates mutable user fields while enforcing domain invariants:
   * - Rejects any attempt to mutate `createdAt`.
   * - Blocks `firstName` or `lastName` changes while the user is `inactive`.
   * - Refreshes `updatedAt` on every modification.
   *
   * @param id - Target user ObjectId string.
   * @param dto - Partial update payload.
   * @throws {BadRequestException} If `createdAt` is supplied or inactive name-lock rules are violated.
   * @throws {NotFoundException} If the user does not exist.
   * @throws {ConflictException} If the updated email belongs to another user.
   */
  update(id: string, dto: UpdateUserDto & { createdAt?: unknown }): Promise<UserDocument>;

  /**
   * Atomically increments `loginsCounter` by `1` and refreshes `updatedAt`.
   *
   * @param id - Target user ObjectId string.
   */
  incrementLoginsCounter(id: string): Promise<UserDocument | null>;

  /**
   * Permanently deletes a user document by ID.
   *
   * @param id - Target user ObjectId string.
   * @throws {NotFoundException} If the ID is malformed or no matching user exists.
   */
  remove(id: string): Promise<void>;
}
