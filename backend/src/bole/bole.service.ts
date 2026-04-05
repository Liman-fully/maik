import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BoleProfile, BoleReferral, BoleLevel, ReferralStatus } from './entities/bole.entity';
import { User } from '../users/entities/user.entity';
import { CreditsService } from '../credits/credits.service';
import { TransactionCategory } from '../credits/entities/credit-transaction.entity';

// 等级配置
const LEVEL_CONFIG: Record<BoleLevel, {
  requiredReferrals: number;
  maxResumes: number;
  maxMonthlyReferrals: number;
}> = {
  [BoleLevel.B0]: { requiredReferrals: 0, maxResumes: 10, maxMonthlyReferrals: 3 },
  [BoleLevel.B1]: { requiredReferrals: 1, maxResumes: 50, maxMonthlyReferrals: 10 },
  [BoleLevel.B2]: { requiredReferrals: 5, maxResumes: 200, maxMonthlyReferrals: 999 },
  [BoleLevel.B3]: { requiredReferrals: 20, maxResumes: 999, maxMonthlyReferrals: 999 },
  [BoleLevel.B4]: { requiredReferrals: 50, maxResumes: 999, maxMonthlyReferrals: 999 },
};

@Injectable()
export class BoleService {
  constructor(
    @InjectRepository(BoleProfile)
    private boleRepo: Repository<BoleProfile>,
    @InjectRepository(BoleReferral)
    private referralRepo: Repository<BoleReferral>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    private creditsService: CreditsService,
    private dataSource: DataSource,
  ) {}

  async getOrCreateProfile(userId: string): Promise<BoleProfile> {
    let profile = await this.boleRepo.findOne({
      where: { user_id: userId },
      relations: ['user'],
    });

    if (!profile) {
      // 自动创建 B0 级别档案
      profile = this.boleRepo.create({
        user_id: userId,
        level: BoleLevel.B0,
        max_resumes: LEVEL_CONFIG[BoleLevel.B0].maxResumes,
        max_monthly_referrals: LEVEL_CONFIG[BoleLevel.B0].maxMonthlyReferrals,
      });
      await this.boleRepo.save(profile);
    }

    return profile;
  }

  async applyForBole(userId: string, introduction: string, specialties: string[]): Promise<BoleProfile> {
    const profile = await this.getOrCreateProfile(userId);

    if (profile.level !== BoleLevel.B0) {
      throw new BadRequestException('您已经是伯乐了');
    }

    // 更新申请信息
    profile.introduction = introduction;
    profile.specialties = specialties;
    await this.boleRepo.save(profile);

    // 自动升级到 B1
    profile.level = BoleLevel.B1;
    profile.max_resumes = LEVEL_CONFIG[BoleLevel.B1].maxResumes;
    profile.max_monthly_referrals = LEVEL_CONFIG[BoleLevel.B1].maxMonthlyReferrals;
    await this.boleRepo.save(profile);

    return profile;
  }

  async getReferrals(userId: string, page: number, limit: number, status?: string) {
    const profile = await this.getOrCreateProfile(userId);

    const where: any = { bole_id: profile.id };
    if (status) {
      where.status = status;
    }

    const [items, total] = await this.referralRepo.findAndCount({
      where,
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

  async referCandidate(userId: string, resumeId: string, jobId?: string): Promise<BoleReferral> {
    const profile = await this.getOrCreateProfile(userId);

    // 检查当月推荐次数
    if (profile.monthly_referrals >= profile.max_monthly_referrals) {
      throw new BadRequestException('本月推荐次数已用完');
    }

    // 创建推荐记录
    const referral = this.referralRepo.create({
      bole_id: profile.id,
      resume_id: resumeId,
      job_id: jobId,
      status: ReferralStatus.PENDING,
    });

    await this.referralRepo.save(referral);

    // 更新统计
    profile.total_referrals += 1;
    profile.monthly_referrals += 1;
    await this.boleRepo.save(profile);

    return referral;
  }

  async getBoleResumes(userId: string, page: number, limit: number) {
    // TODO: 实现简历库查询
    // 这里需要从伯乐简历关联表获取
    return {
      items: [],
      total: 0,
      page,
      limit,
      has_more: false,
    };
  }

  async addResumeToPool(userId: string, resumeId: string) {
    const profile = await this.getOrCreateProfile(userId);

    if (profile.available_resumes >= profile.max_resumes) {
      throw new BadRequestException('简历库已满');
    }

    // TODO: 实现添加简历到简历库
    profile.available_resumes += 1;
    await this.boleRepo.save(profile);

    return { success: true, message: '添加成功' };
  }

  async getBoleStats(userId: string) {
    const profile = await this.getOrCreateProfile(userId);

    return {
      level: profile.level,
      total_referrals: profile.total_referrals,
      successful_referrals: profile.successful_referrals,
      total_earnings: profile.total_earnings,
      pending_earnings: profile.pending_earnings,
      monthly_referrals: profile.monthly_referrals,
      max_monthly_referrals: profile.max_monthly_referrals,
      available_resumes: profile.available_resumes,
      max_resumes: profile.max_resumes,
      rating: profile.rating,
      rating_count: profile.rating_count,
      commission_rate: profile.commission_rate,
    };
  }

  async upgradeLevel(boleId: string, newLevel: string): Promise<BoleProfile> {
    const profile = await this.boleRepo.findOne({ where: { id: boleId } });
    if (!profile) {
      throw new NotFoundException('伯乐档案不存在');
    }

    const level = newLevel as BoleLevel;
    if (!Object.values(BoleLevel).includes(level)) {
      throw new BadRequestException('无效的等级');
    }

    profile.level = level;
    profile.max_resumes = LEVEL_CONFIG[level].maxResumes;
    profile.max_monthly_referrals = LEVEL_CONFIG[level].maxMonthlyReferrals;

    await this.boleRepo.save(profile);
    return profile;
  }

  // 处理推荐成功（内部方法）
  async handleSuccessfulReferral(referralId: string) {
    const referral = await this.referralRepo.findOne({
      where: { id: referralId },
      relations: ['bole'],
    });

    if (!referral || referral.status === ReferralStatus.HIRED) {
      return;
    }

    // 更新状态
    referral.status = ReferralStatus.HIRED;
    referral.hired_at = new Date();
    await this.referralRepo.save(referral);

    // 更新伯乐统计
    const profile = referral.bole;
    profile.successful_referrals += 1;

    // 检查是否需要升级
    const nextLevel = this.getNextLevel(profile.level);
    if (nextLevel && profile.successful_referrals >= LEVEL_CONFIG[nextLevel].requiredReferrals) {
      profile.level = nextLevel;
      profile.max_resumes = LEVEL_CONFIG[nextLevel].maxResumes;
      profile.max_monthly_referrals = LEVEL_CONFIG[nextLevel].maxMonthlyReferrals;
    }

    await this.boleRepo.save(profile);

    // 发放奖励积分
    const rewardPoints = 150;
    await this.creditsService.addCredits(
      profile.user_id,
      rewardPoints,
      TransactionCategory.REFERRAL_REWARD,
      '推荐成功奖励',
      referralId,
    );
  }

  private getNextLevel(currentLevel: BoleLevel): BoleLevel | null {
    const levels = [BoleLevel.B0, BoleLevel.B1, BoleLevel.B2, BoleLevel.B3, BoleLevel.B4];
    const currentIndex = levels.indexOf(currentLevel);
    if (currentIndex < levels.length - 1) {
      return levels[currentIndex + 1];
    }
    return null;
  }
}
