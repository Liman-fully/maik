import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { CreditTransaction, TransactionType, TransactionCategory } from './entities/credit-transaction.entity';
import { CreditPackage } from './entities/credit-package.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CreditsService {
  constructor(
    @InjectRepository(CreditTransaction)
    private transactionRepo: Repository<CreditTransaction>,
    @InjectRepository(CreditPackage)
    private packageRepo: Repository<CreditPackage>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private dataSource: DataSource,
  ) {}

  async getBalance(userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }
    return {
      balance: user.credit_points,
      trust_score: user.trust_score,
    };
  }

  async getTransactions(userId: string, page: number, limit: number) {
    const [items, total] = await this.transactionRepo.findAndCount({
      where: { user_id: userId },
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
      has_more: total > page * limit,
    };
  }

  async getPackages() {
    return this.packageRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC', price: 'ASC' },
    });
  }

  async createPurchaseOrder(userId: string, packageId: string) {
    const pkg = await this.packageRepo.findOne({ where: { id: packageId } });
    if (!pkg) {
      throw new NotFoundException('套餐不存在');
    }

    // TODO: 集成支付系统（微信支付/支付宝）
    // 这里先模拟直接充值
    const totalPoints = pkg.points + pkg.bonus_points;

    await this.addCredits(
      userId,
      totalPoints,
      TransactionCategory.RECHARGE,
      `充值${pkg.name}：${pkg.points}积分${pkg.bonus_points > 0 ? `+${pkg.bonus_points}赠送` : ''}`,
      pkg.id,
    );

    return {
      success: true,
      points_added: totalPoints,
      message: '充值成功',
    };
  }

  async addCredits(
    userId: string,
    amount: number,
    category: TransactionCategory,
    description: string,
    relatedId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 获取用户并加锁
      const user = await manager.findOne(User, { 
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 更新余额
      user.credit_points += amount;
      await manager.save(user);

      // 创建交易记录
      const transaction = manager.create(CreditTransaction, {
        user_id: userId,
        amount,
        balance_after: user.credit_points,
        type: TransactionType.EARN,
        category,
        description,
        related_id: relatedId,
      });

      await manager.save(transaction);

      return {
        balance: user.credit_points,
        transaction,
      };
    });
  }

  async spendCredits(
    userId: string,
    amount: number,
    category: TransactionCategory,
    description: string,
    relatedId?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      // 获取用户并加锁
      const user = await manager.findOne(User, {
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('用户不存在');
      }

      // 检查余额
      if (user.credit_points < amount) {
        throw new BadRequestException('积分不足');
      }

      // 扣除积分
      user.credit_points -= amount;
      await manager.save(user);

      // 创建交易记录
      const transaction = manager.create(CreditTransaction, {
        user_id: userId,
        amount: -amount,
        balance_after: user.credit_points,
        type: TransactionType.SPEND,
        category,
        description,
        related_id: relatedId,
      });

      await manager.save(transaction);

      return {
        balance: user.credit_points,
        transaction,
      };
    });
  }

  // 初始化默认积分套餐
  async initDefaultPackages() {
    const count = await this.packageRepo.count();
    if (count > 0) return;

    const packages = [
      { name: '体验包', points: 108, price: 9.9, bonus_points: 0, sort_order: 1 },
      { name: '标准包', points: 270, price: 29, bonus_points: 18, sort_order: 2 },
      { name: '超值包', points: 450, price: 49, bonus_points: 50, is_popular: true, sort_order: 3 },
      { name: '专业包', points: 900, price: 99, bonus_points: 100, sort_order: 4 },
      { name: '企业包', points: 2700, price: 299, bonus_points: 300, sort_order: 5 },
    ];

    for (const pkg of packages) {
      await this.packageRepo.save(this.packageRepo.create(pkg));
    }
  }
}
