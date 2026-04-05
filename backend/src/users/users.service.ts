import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Redis } from 'ioredis';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @Inject('REDIS_CLIENT')
    private readonly redisClient: Redis,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // 检查邮箱是否已存在
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });
    if (existingUser) {
      throw new ConflictException('邮箱已被注册');
    }

    // 检查手机号是否已存在（如果有）
    if (createUserDto.phone) {
      const existingPhone = await this.usersRepository.findOne({
        where: { phone: createUserDto.phone },
      });
      if (existingPhone) {
        throw new ConflictException('手机号已被注册');
      }
    }

    // 生成盐和密码哈希
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(createUserDto.password, salt);

    // 创建用户
    const user = this.usersRepository.create({
      ...createUserDto,
      password_hash,
      password_salt: salt,
    });

    // 设置默认角色
    if (!user.role) {
      user.role = UserRole.SEEKER;
    }

    // 设置显示名称
    if (!user.username) {
      user.username = createUserDto.email.split('@')[0];
    }

    const savedUser = await this.usersRepository.save(user);

    // 清除相关缓存
    await this.clearUserCache(savedUser.id);

    return savedUser;
  }

  async findAll(
    page = 1,
    limit = 20,
    filters?: {
      role?: UserRole;
      status?: string;
      search?: string;
    },
  ): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const query = this.usersRepository.createQueryBuilder('user');

    // 应用过滤条件
    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.status) {
      query.andWhere('user.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      query.andWhere(
        '(user.email ILIKE :search OR user.username ILIKE :search OR user.phone ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    // 计算总数
    const total = await query.getCount();

    // 分页查询
    const users = await query
      .skip((page - 1) * limit)
      .take(limit)
      .orderBy('user.created_at', 'DESC')
      .getMany();

    return {
      users,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<User> {
    // 尝试从缓存获取
    const cacheKey = `user:${id}`;
    const cachedUser = await this.redisClient.get(cacheKey);
    
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 缓存用户信息（缓存10分钟）
    await this.redisClient.setex(cacheKey, 600, JSON.stringify(user));
    
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByPhone(phone: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { phone } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { username } });
  }

  async findById(id: string): Promise<User> {
    return this.findOne(id);
  }

  async validatePassword(email: string, password: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    if (!user) {
      return false;
    }
    return bcrypt.compare(password, user.password_hash);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // 更新字段
    Object.assign(user, updateUserDto);

    const updatedUser = await this.usersRepository.save(user);

    // 清除缓存
    await this.clearUserCache(id);

    return updatedUser;
  }

  async updatePassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.findOne(id);

    // 验证旧密码
    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new BadRequestException('旧密码不正确');
    }

    // 生成新密码
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    user.password_hash = password_hash;
    user.password_salt = salt;

    await this.usersRepository.save(user);

    // 清除缓存
    await this.clearUserCache(id);
  }

  async resetPassword(email: string, newPassword: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    user.password_hash = password_hash;
    user.password_salt = salt;

    await this.usersRepository.save(user);

    // 清除缓存
    await this.clearUserCache(user.id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    // 软删除：标记为禁用状态
    user.status = UserStatus.BANNED;
    await this.usersRepository.save(user);

    // 清除缓存
    await this.clearUserCache(id);
  }

  async updateLoginStats(id: string, ip: string): Promise<void> {
    await this.usersRepository.update(id, {
      last_login_at: new Date(),
      last_login_ip: ip,
      login_count: () => 'login_count + 1',
    });

    // 清除缓存
    await this.clearUserCache(id);
  }

  async addCreditPoints(id: string, points: number): Promise<User> {
    const user = await this.findOne(id);
    user.credit_points += points;
    
    const updatedUser = await this.usersRepository.save(user);
    
    // 清除缓存
    await this.clearUserCache(id);
    
    return updatedUser;
  }

  async updateTrustScore(id: string, score: number): Promise<User> {
    const user = await this.findOne(id);
    user.trust_score = Math.min(Math.max(score, 0), 100);
    
    const updatedUser = await this.usersRepository.save(user);
    
    // 清除缓存
    await this.clearUserCache(id);
    
    return updatedUser;
  }

  async incrementConnections(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.total_connections += 1;
    
    const updatedUser = await this.usersRepository.save(user);
    
    // 清除缓存
    await this.clearUserCache(id);
    
    return updatedUser;
  }

  async completeOnboarding(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.is_onboarding_completed = true;
    
    const updatedUser = await this.usersRepository.save(user);
    
    // 清除缓存
    await this.clearUserCache(id);
    
    return updatedUser;
  }

  private async clearUserCache(id: string): Promise<void> {
    const cacheKeys = [
      `user:${id}`,
      `user:stats:${id}`,
    ];
    
    await Promise.all(cacheKeys.map(key => this.redisClient.del(key)));
  }
}