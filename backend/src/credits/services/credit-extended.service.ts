import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { CreditTransaction, TransactionType, TransactionCategory } from '../entities/credit-transaction.entity';
import { CreditPackage } from '../entities/credit-package.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { Job } from '../../recruiters/entities/job.entity';
import { Resume } from '../../resumes/entities/resume.entity';

// 积分消费场景定义
export enum CreditConsumptionScene {
  // 简历相关
  VIEW_RESUME_DETAIL = 'view_resume_detail', // 查看简历详情
  DOWNLOAD_RESUME = 'download_resume', // 下载简历
  CONTACT_CANDIDATE = 'contact_candidate', // 联系候选人
  
  // 职位相关
  POST_JOB = 'post_job', // 发布职位
  BOOST_JOB = 'boost_job', // 提升职位
  REFRESH_JOB = 'refresh_job', // 刷新职位
  
  // 搜索相关
  ADVANCED_SEARCH = 'advanced_search', // 高级搜索
  SAVE_SEARCH = 'save_search', // 保存搜索条件
  
  // 推荐相关
  GET_RESUME_RECOMMENDATIONS = 'get_resume_recommendations', // 获取简历推荐
  GET_JOB_RECOMMENDATIONS = 'get_job_recommendations', // 获取职位推荐
  
  // 其他
  VERIFY_RESUME = 'verify_resume', // 简历认证
  PROMOTE_PROFILE = 'promote_profile', // 个人资料推广
}

// 积分获取场景定义
export enum CreditEarningScene {
  // 用户行为
  DAILY_LOGIN = 'daily_login', // 每日登录
  COMPLETE_PROFILE = 'complete_profile', // 完善资料
  VERIFY_EMAIL = 'verify_email', // 验证邮箱
  VERIFY_PHONE = 'verify_phone', // 验证手机
  
  // 内容贡献
  UPLOAD_RESUME = 'upload_resume', // 上传简历
  UPDATE_RESUME = 'update_resume', // 更新简历
  SHARE_EXPERIENCE = 'share_experience', // 分享经验
  
  // 互动行为
  RESPOND_TO_MESSAGE = 'respond_to_message', // 回复消息
  ACCEPT_INTERVIEW = 'accept_interview', // 接受面试
  LEAVE_REVIEW = 'leave_review', // 留下评价
  
  // 邀请系统
  INVITE_FRIEND = 'invite_friend', // 邀请好友
  FRIEND_REGISTER = 'friend_register', // 好友注册
  FRIEND_COMPLETE_PROFILE = 'friend_complete_profile', // 好友完善资料
  
  // 充值奖励
  FIRST_RECHARGE = 'first_recharge', // 首次充值
  RECHARGE_BONUS = 'recharge_bonus', // 充值赠送
}

// 积分价格配置
export interface CreditPricing {
  scene: CreditConsumptionScene | CreditEarningScene;
  basePoints: number; // 基础积分
  userRoleMultiplier?: Record<UserRole, number>; // 角色系数
  dynamicAdjustment?: boolean; // 是否动态调整
  maxPerDay?: number; // 每日上限
  cooldownMinutes?: number; // 冷却时间（分钟）
}

@Injectable()
export class CreditExtendedService {
  private readonly logger = new Logger(CreditExtendedService.name);
  private readonly pricingConfig: CreditPricing[] = [
    // 消费场景
    { scene: CreditConsumptionScene.VIEW_RESUME_DETAIL, basePoints: 5, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.DOWNLOAD_RESUME, basePoints: 20, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.CONTACT_CANDIDATE, basePoints: 15, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.POST_JOB, basePoints: 50, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.BOOST_JOB, basePoints: 30, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.REFRESH_JOB, basePoints: 10, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.ADVANCED_SEARCH, basePoints: 10, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    { scene: CreditConsumptionScene.GET_RESUME_RECOMMENDATIONS, basePoints: 25, userRoleMultiplier: { 
      [UserRole.SEEKER]: 1.0, [UserRole.HR]: 0.8, [UserRole.HEADHUNTER]: 0.9, [UserRole.ADMIN]: 0,
      [UserRole.JOB_SEEKER]: 1.0, [UserRole.USER]: 1.0, [UserRole.GUEST]: 1.0,
      [UserRole.MODERATOR]: 0.5, [UserRole.SUPER_MODERATOR]: 0.3, [UserRole.RECRUITER]: 0.9,
      [UserRole.VERIFIED_USER]: 0.8
    } },
    
    // 赚取场景
    { scene: CreditEarningScene.DAILY_LOGIN, basePoints: 1, maxPerDay: 1 },
    { scene: CreditEarningScene.COMPLETE_PROFILE, basePoints: 50, maxPerDay: 1 },
    { scene: CreditEarningScene.VERIFY_EMAIL, basePoints: 20, maxPerDay: 1 },
    { scene: CreditEarningScene.VERIFY_PHONE, basePoints: 30, maxPerDay: 1 },
    { scene: CreditEarningScene.UPLOAD_RESUME, basePoints: 100, maxPerDay: 3 },
    { scene: CreditEarningScene.UPDATE_RESUME, basePoints: 20, maxPerDay: 5 },
    { scene: CreditEarningScene.RESPOND_TO_MESSAGE, basePoints: 5, maxPerDay: 10 },
    { scene: CreditEarningScene.INVITE_FRIEND, basePoints: 100, dynamicAdjustment: true },
    { scene: CreditEarningScene.FRIEND_REGISTER, basePoints: 200, dynamicAdjustment: true },
  ];

  constructor(
    @InjectRepository(CreditTransaction)
    private readonly transactionRepo: Repository<CreditTransaction>,
    @InjectRepository(CreditPackage)
    private readonly packageRepo: Repository<CreditPackage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Job)
    private readonly jobRepo: Repository<Job>,
    @InjectRepository(Resume)
    private readonly resumeRepo: Repository<Resume>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * 消费积分（扩展版）
   */
  async consumeCredits(
    userId: string,
    scene: CreditConsumptionScene,
    metadata?: {
      targetId?: string; // 目标ID（如简历ID、职位ID）
      targetType?: string; // 目标类型
      extraData?: any; // 额外数据
    },
  ): Promise<{ success: boolean; pointsSpent: number; newBalance: number; message: string }> {
    try {
      // 获取用户信息
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('用户不存在');
      }

      // 检查用户权限
      if (!this.canUserConsume(user, scene)) {
        throw new Error('用户没有权限进行此操作');
      }

      // 获取价格配置
      const priceConfig = this.getPricingConfig(scene);
      if (!priceConfig) {
        throw new Error('未找到价格配置');
      }

      // 计算实际消耗积分
      let pointsToSpend = priceConfig.basePoints;
      
      // 应用角色系数
      if (priceConfig.userRoleMultiplier && priceConfig.userRoleMultiplier[user.role] !== undefined) {
        pointsToSpend *= priceConfig.userRoleMultiplier[user.role];
      }

      // 检查冷却时间
      if (priceConfig.cooldownMinutes) {
        const lastTransaction = await this.getLastTransaction(userId, scene);
        if (lastTransaction && this.isInCooldown(lastTransaction, priceConfig.cooldownMinutes)) {
          throw new Error(`操作冷却中，请等待${priceConfig.cooldownMinutes}分钟后再试`);
        }
      }

      // 检查每日上限
      if (priceConfig.maxPerDay) {
        const todayCount = await this.getTodayTransactionCount(userId, scene);
        if (todayCount >= priceConfig.maxPerDay) {
          throw new Error(`今日已达操作上限（${priceConfig.maxPerDay}次）`);
        }
      }

      // 检查余额
      if (user.credit_points < pointsToSpend) {
        throw new Error(`积分不足，需要${pointsToSpend}积分，当前余额${user.credit_points}积分`);
      }

      // 执行消费（事务）
      const result = await this.dataSource.transaction(async (manager) => {
        // 更新用户积分
        user.credit_points -= pointsToSpend;
        await manager.save(user);

        // 创建交易记录
        const transaction = manager.create(CreditTransaction, {
          user_id: userId,
          amount: -pointsToSpend,
          balance_after: user.credit_points,
          type: TransactionType.SPEND,
          category: this.mapSceneToCategory(scene),
          description: this.generateDescription(scene, metadata),
          related_id: metadata?.targetId,
          metadata: metadata?.extraData,
        });

        await manager.save(transaction);

        // 记录消费统计
        await this.recordConsumptionStat(userId, scene, pointsToSpend);

        return {
          success: true,
          pointsSpent: pointsToSpend,
          newBalance: user.credit_points,
          transactionId: transaction.id,
        };
      });

      this.logger.log(`用户 ${userId} 消费积分: ${scene} - ${pointsToSpend}积分`);

      return {
        success: true,
        pointsSpent: pointsToSpend,
        newBalance: result.newBalance,
        message: '消费成功',
      };
    } catch (error) {
      this.logger.error(`积分消费失败: ${error.message}`, error.stack);
      return {
        success: false,
        pointsSpent: 0,
        newBalance: 0,
        message: error.message,
      };
    }
  }

  /**
   * 赚取积分（扩展版）
   */
  async earnCredits(
    userId: string,
    scene: CreditEarningScene,
    metadata?: {
      sourceId?: string; // 来源ID
      sourceType?: string; // 来源类型
      extraData?: any; // 额外数据
    },
  ): Promise<{ success: boolean; pointsEarned: number; newBalance: number; message: string }> {
    try {
      // 获取用户信息
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) {
        throw new Error('用户不存在');
      }

      // 获取奖励配置
      const rewardConfig = this.getPricingConfig(scene);
      if (!rewardConfig) {
        throw new Error('未找到奖励配置');
      }

      // 计算实际奖励积分
      let pointsToEarn = rewardConfig.basePoints;

      // 动态调整（例如邀请系统）
      if (rewardConfig.dynamicAdjustment) {
        pointsToEarn = await this.calculateDynamicReward(user, scene, metadata);
      }

      // 检查每日上限
      if (rewardConfig.maxPerDay) {
        const todayCount = await this.getTodayTransactionCount(userId, scene);
        if (todayCount >= rewardConfig.maxPerDay) {
          throw new Error(`今日已达奖励上限（${rewardConfig.maxPerDay}次）`);
        }
      }

      // 检查冷却时间
      if (rewardConfig.cooldownMinutes) {
        const lastTransaction = await this.getLastTransaction(userId, scene);
        if (lastTransaction && this.isInCooldown(lastTransaction, rewardConfig.cooldownMinutes)) {
          throw new Error(`操作冷却中，请等待${rewardConfig.cooldownMinutes}分钟后再试`);
        }
      }

      // 执行赚取（事务）
      const result = await this.dataSource.transaction(async (manager) => {
        // 更新用户积分
        user.credit_points += pointsToEarn;
        await manager.save(user);

        // 创建交易记录
        const transaction = manager.create(CreditTransaction, {
          user_id: userId,
          amount: pointsToEarn,
          balance_after: user.credit_points,
          type: TransactionType.EARN,
          category: this.mapSceneToCategory(scene),
          description: this.generateEarningDescription(scene, metadata),
          related_id: metadata?.sourceId,
          metadata: metadata?.extraData,
        });

        await manager.save(transaction);

        // 记录赚取统计
        await this.recordEarningStat(userId, scene, pointsToEarn);

        return {
          success: true,
          pointsEarned: pointsToEarn,
          newBalance: user.credit_points,
          transactionId: transaction.id,
        };
      });

      this.logger.log(`用户 ${userId} 赚取积分: ${scene} - ${pointsToEarn}积分`);

      // 更新用户信任分
      await this.updateTrustScore(userId);

      return {
        success: true,
        pointsEarned: pointsToEarn,
        newBalance: result.newBalance,
        message: '积分已到账',
      };
    } catch (error) {
      this.logger.error(`积分赚取失败: ${error.message}`, error.stack);
      return {
        success: false,
        pointsEarned: 0,
        newBalance: 0,
        message: error.message,
      };
    }
  }

  /**
   * 获取积分统计
   */
  async getCreditStats(userId: string): Promise<{
    balance: number;
    trustScore: number;
    todayEarned: number;
    todaySpent: number;
    totalEarned: number;
    totalSpent: number;
    topEarningScenes: Array<{ scene: string; points: number; count: number }>;
    topSpendingScenes: Array<{ scene: string; points: number; count: number }>;
  }> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEarned = await this.transactionRepo.sum('amount', {
      user_id: userId,
      type: TransactionType.EARN,
      created_at: Between(today, new Date()),
    }) || 0;

    const todaySpent = Math.abs(await this.transactionRepo.sum('amount', {
      user_id: userId,
      type: TransactionType.SPEND,
      created_at: Between(today, new Date()),
    }) || 0);

    const totalEarned = await this.transactionRepo.sum('amount', {
      user_id: userId,
      type: TransactionType.EARN,
    }) || 0;

    const totalSpent = Math.abs(await this.transactionRepo.sum('amount', {
      user_id: userId,
      type: TransactionType.SPEND,
    }) || 0);

    // 获取热门赚取场景
    const topEarningScenes = await this.transactionRepo
      .createQueryBuilder('t')
      .select('t.category', 'scene')
      .addSelect('SUM(t.amount)', 'points')
      .addSelect('COUNT(t.id)', 'count')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.EARN })
      .groupBy('t.category')
      .orderBy('points', 'DESC')
      .limit(5)
      .getRawMany();

    // 获取热门消费场景
    const topSpendingScenes = await this.transactionRepo
      .createQueryBuilder('t')
      .select('t.category', 'scene')
      .addSelect('SUM(ABS(t.amount))', 'points')
      .addSelect('COUNT(t.id)', 'count')
      .where('t.user_id = :userId', { userId })
      .andWhere('t.type = :type', { type: TransactionType.SPEND })
      .groupBy('t.category')
      .orderBy('points', 'DESC')
      .limit(5)
      .getRawMany();

    return {
      balance: user.credit_points,
      trustScore: user.trust_score || 0,
      todayEarned,
      todaySpent,
      totalEarned,
      totalSpent,
      topEarningScenes,
      topSpendingScenes,
    };
  }

  /**
   * 获取积分套餐推荐（基于用户行为）
   */
  async getRecommendedPackages(userId: string): Promise<CreditPackage[]> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }

    // 获取用户消费习惯
    const spendingStats = await this.getCreditStats(userId);
    
    // 获取所有活跃套餐
    const allPackages = await this.packageRepo.find({
      where: { is_active: true },
      order: { sort_order: 'ASC' },
    });

    // 根据用户行为推荐
    const recommended: CreditPackage[] = [];
    
    // 新用户推荐体验包
    if (spendingStats.totalSpent === 0) {
      const starterPackage = allPackages.find(pkg => pkg.sort_order === 1);
      if (starterPackage) recommended.push(starterPackage);
    }

    // 高频消费用户推荐超值包
    if (spendingStats.todaySpent > 50) {
      const valuePackage = allPackages.find(pkg => pkg.is_popular);
      if (valuePackage) recommended.push(valuePackage);
    }

    // 大额消费用户推荐企业包
    if (spendingStats.totalSpent > 500) {
      const enterprisePackage = allPackages.find(pkg => pkg.sort_order === 5);
      if (enterprisePackage) recommended.push(enterprisePackage);
    }

    // 确保至少有一个推荐
    if (recommended.length === 0 && allPackages.length > 0) {
      recommended.push(allPackages[0]);
    }

    return recommended;
  }

  /**
   * 检查是否可以消费
   */
  private canUserConsume(user: User, scene: CreditConsumptionScene): boolean {
    // 管理员免费
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // HR和Recruiter可以消费
    if ([UserRole.HR, UserRole.RECRUITER].includes(user.role)) {
      return true;
    }

    // 求职者只能查看和申请
    if (user.role === UserRole.JOB_SEEKER) {
      const allowedScenes = [
        CreditConsumptionScene.GET_JOB_RECOMMENDATIONS,
        CreditConsumptionScene.PROMOTE_PROFILE,
      ];
      return allowedScenes.includes(scene);
    }

    return false;
  }

  /**
   * 获取价格配置
   */
  private getPricingConfig(scene: CreditConsumptionScene | CreditEarningScene): CreditPricing | undefined {
    return this.pricingConfig.find(config => config.scene === scene);
  }

  /**
   * 获取最后交易记录
   */
  private async getLastTransaction(userId: string, scene: string): Promise<CreditTransaction | null> {
    const category = this.mapSceneToCategory(scene as any);
    return this.transactionRepo.findOne({
      where: {
        user_id: userId,
        category,
      },
      order: { created_at: 'DESC' },
    });
  }

  /**
   * 检查是否在冷却时间内
   */
  private isInCooldown(transaction: CreditTransaction, cooldownMinutes: number): boolean {
    const now = new Date();
    const lastTime = new Date(transaction.created_at);
    const diffMinutes = (now.getTime() - lastTime.getTime()) / (1000 * 60);
    return diffMinutes < cooldownMinutes;
  }

  /**
   * 获取今日交易次数
   */
  private async getTodayTransactionCount(userId: string, scene: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const category = this.mapSceneToCategory(scene as any);
    
    return this.transactionRepo.count({
      where: {
        user_id: userId,
        category,
        created_at: Between(today, new Date()),
      },
    });
  }

  /**
   * 场景映射到交易类别
   */
  private mapSceneToCategory(scene: CreditConsumptionScene | CreditEarningScene): TransactionCategory {
    const mapping: Record<string, TransactionCategory> = {
      // 消费场景
      [CreditConsumptionScene.VIEW_RESUME_DETAIL]: TransactionCategory.RESUME_VIEW,
      [CreditConsumptionScene.DOWNLOAD_RESUME]: TransactionCategory.RESUME_DOWNLOAD,
      [CreditConsumptionScene.CONTACT_CANDIDATE]: TransactionCategory.CONTACT,
      [CreditConsumptionScene.POST_JOB]: TransactionCategory.JOB_POST,
      [CreditConsumptionScene.BOOST_JOB]: TransactionCategory.JOB_BOOST,
      [CreditConsumptionScene.REFRESH_JOB]: TransactionCategory.JOB_REFRESH,
      [CreditConsumptionScene.ADVANCED_SEARCH]: TransactionCategory.SEARCH,
      [CreditConsumptionScene.GET_RESUME_RECOMMENDATIONS]: TransactionCategory.RECOMMENDATION,
      
      // 赚取场景
      [CreditEarningScene.DAILY_LOGIN]: TransactionCategory.ACTIVITY,
      [CreditEarningScene.COMPLETE_PROFILE]: TransactionCategory.PROFILE_COMPLETION,
      [CreditEarningScene.VERIFY_EMAIL]: TransactionCategory.VERIFICATION,
      [CreditEarningScene.VERIFY_PHONE]: TransactionCategory.VERIFICATION,
      [CreditEarningScene.UPLOAD_RESUME]: TransactionCategory.RESUME_UPLOAD,
      [CreditEarningScene.UPDATE_RESUME]: TransactionCategory.RESUME_UPDATE,
      [CreditEarningScene.RESPOND_TO_MESSAGE]: TransactionCategory.INTERACTION,
      [CreditEarningScene.INVITE_FRIEND]: TransactionCategory.INVITATION,
      [CreditEarningScene.FRIEND_REGISTER]: TransactionCategory.INVITATION,
    };

    return mapping[scene] || TransactionCategory.OTHER;
  }

  /**
   * 生成消费描述
   */
  private generateDescription(scene: CreditConsumptionScene, metadata?: any): string {
    const descriptions: Record<CreditConsumptionScene, string> = {
      [CreditConsumptionScene.VIEW_RESUME_DETAIL]: `查看简历详情${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.DOWNLOAD_RESUME]: `下载简历${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.CONTACT_CANDIDATE]: `联系候选人${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.POST_JOB]: `发布职位${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.BOOST_JOB]: `提升职位曝光${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.REFRESH_JOB]: `刷新职位${metadata?.targetId ? ` (ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.ADVANCED_SEARCH]: '高级搜索',
      [CreditConsumptionScene.SAVE_SEARCH]: '保存搜索条件',
      [CreditConsumptionScene.GET_RESUME_RECOMMENDATIONS]: `获取简历推荐${metadata?.targetId ? ` (职位ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.GET_JOB_RECOMMENDATIONS]: `获取职位推荐${metadata?.targetId ? ` (简历ID: ${metadata.targetId})` : ''}`,
      [CreditConsumptionScene.VERIFY_RESUME]: '简历认证',
      [CreditConsumptionScene.PROMOTE_PROFILE]: '个人资料推广',
    };

    return descriptions[scene] || '积分消费';
  }

  /**
   * 生成赚取描述
   */
  private generateEarningDescription(scene: CreditEarningScene, metadata?: any): string {
    const descriptions: Record<CreditEarningScene, string> = {
      [CreditEarningScene.DAILY_LOGIN]: '每日登录奖励',
      [CreditEarningScene.COMPLETE_PROFILE]: '完善个人资料',
      [CreditEarningScene.VERIFY_EMAIL]: '验证邮箱',
      [CreditEarningScene.VERIFY_PHONE]: '验证手机',
      [CreditEarningScene.UPLOAD_RESUME]: '上传简历',
      [CreditEarningScene.UPDATE_RESUME]: '更新简历',
      [CreditEarningScene.SHARE_EXPERIENCE]: '分享经验',
      [CreditEarningScene.RESPOND_TO_MESSAGE]: '回复消息',
      [CreditEarningScene.ACCEPT_INTERVIEW]: '接受面试邀请',
      [CreditEarningScene.LEAVE_REVIEW]: '留下评价',
      [CreditEarningScene.INVITE_FRIEND]: `邀请好友${metadata?.sourceId ? ` (邀请码: ${metadata.sourceId})` : ''}`,
      [CreditEarningScene.FRIEND_REGISTER]: `好友注册成功${metadata?.sourceId ? ` (邀请人: ${metadata.sourceId})` : ''}`,
      [CreditEarningScene.FRIEND_COMPLETE_PROFILE]: `好友完善资料${metadata?.sourceId ? ` (邀请人: ${metadata.sourceId})` : ''}`,
      [CreditEarningScene.FIRST_RECHARGE]: '首次充值奖励',
      [CreditEarningScene.RECHARGE_BONUS]: '充值赠送',
    };

    return descriptions[scene] || '积分奖励';
  }

  /**
   * 计算动态奖励
   */
  private async calculateDynamicReward(user: User, scene: CreditEarningScene, metadata?: any): Promise<number> {
    const baseConfig = this.getPricingConfig(scene);
    if (!baseConfig) return 0;

    let reward = baseConfig.basePoints;

    // 邀请系统：根据邀请数量调整奖励
    if (scene === CreditEarningScene.INVITE_FRIEND || scene === CreditEarningScene.FRIEND_REGISTER) {
      const inviteCount = await this.getUserInviteCount(user.id);
      if (inviteCount > 10) reward *= 1.5; // 邀请达人奖励
      if (inviteCount > 50) reward *= 2; // 邀请专家奖励
    }

    return Math.round(reward);
  }

  /**
   * 获取用户邀请数量
   */
  private async getUserInviteCount(userId: string): Promise<number> {
    return this.transactionRepo.count({
      where: {
        user_id: userId,
        category: TransactionCategory.INVITATION,
      },
    });
  }

  /**
   * 记录消费统计
   */
  private async recordConsumptionStat(userId: string, scene: CreditConsumptionScene, points: number): Promise<void> {
    // TODO: 实现消费统计记录
    this.logger.debug(`记录消费统计: ${userId} - ${scene} - ${points}积分`);
  }

  /**
   * 记录赚取统计
   */
  private async recordEarningStat(userId: string, scene: CreditEarningScene, points: number): Promise<void> {
    // TODO: 实现赚取统计记录
    this.logger.debug(`记录赚取统计: ${userId} - ${scene} - ${points}积分`);
  }

  /**
   * 更新用户信任分
   */
  private async updateTrustScore(userId: string): Promise<void> {
    try {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      if (!user) return;

      // 计算信任分（基于积分活跃度、资料完整度等）
      let trustScore = 50; // 基础分

      // 积分活跃度
      const totalEarned = await this.transactionRepo.sum('amount', {
        user_id: userId,
        type: TransactionType.EARN,
      }) || 0;

      if (totalEarned > 1000) trustScore += 20;
      else if (totalEarned > 500) trustScore += 10;
      else if (totalEarned > 100) trustScore += 5;

      // 资料完整度（简化处理）
      if (user.is_verified) trustScore += 10;
      // 暂时注释掉phone_verified检查，待User实体添加该字段
      // if (user.phone_verified) trustScore += 10;

      // 限制在0-100之间
      trustScore = Math.max(0, Math.min(100, trustScore));

      user.trust_score = trustScore;
      await this.userRepo.save(user);
    } catch (error) {
      this.logger.error(`更新信任分失败: ${error.message}`);
    }
  }
}