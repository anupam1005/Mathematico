import { AppDataSource } from '../config/data-source';
import { User } from '../entities/User';
import { BaseRepository } from './base.repository';

export class UserRepository extends BaseRepository<User> {
  constructor() {
    super(AppDataSource.getRepository(User));
  }

  async create(user: User): Promise<User> {
    try {
      const newUser = this.repository.create(user);
      await this.repository.save(newUser);
      return newUser;
    } catch (error: any) {
      console.error('Error creating user:', error);
      if (error.code === '23505') { // Unique violation error code
        throw new Error('Email already in use');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async markEmailAsVerified(userId: string): Promise<void> {
    await this.repository.update(userId, { isEmailVerified: true } as any);
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.repository.update(userId, { password: hashedPassword } as any);
  }

  async getUserWithRoles(userId: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .where('user.id = :userId', { userId })
      .getOne();
  }

  async searchUsers(query: string, page: number = 1, limit: number = 10) {
    const [data, total] = await this.repository
      .createQueryBuilder('user')
      .where('user.name ILIKE :query', { query: `%${query}%` })
      .orWhere('user.email ILIKE :query', { query: `%${query}%` })
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
