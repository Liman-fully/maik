import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BusinessCard, CardView } from './entities/card.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class CardService {
  constructor(
    @InjectRepository(BusinessCard)
    private cardRepo: Repository<BusinessCard>,
    @InjectRepository(CardView)
    private viewRepo: Repository<CardView>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getOrCreateCard(userId: string): Promise<BusinessCard> {
    let card = await this.cardRepo.findOne({
      where: { user_id: userId },
    });

    if (!card) {
      const user = await this.userRepo.findOne({ where: { id: userId } });
      
      // 自动创建名片
      card = this.cardRepo.create({
        user_id: userId,
        name: user?.username || user?.email?.split('@')[0] || '未设置',
        title: user?.position || '职位未设置',
        company: user?.company || '公司未设置',
        phone: user?.phone,
        email: user?.email,
        avatar_url: user?.avatar_url,
      });

      await this.cardRepo.save(card);
    }

    return card;
  }

  async getPublicCard(id: string): Promise<BusinessCard> {
    const card = await this.cardRepo.findOne({
      where: { id, is_public: true },
    });

    if (!card) {
      throw new NotFoundException('名片不存在或已设为私密');
    }

    return card;
  }

  async create(userId: string, data: any): Promise<BusinessCard> {
    // 检查是否已有名片
    const existing = await this.cardRepo.findOne({ where: { user_id: userId } });
    if (existing) {
      // 更新现有名片
      Object.assign(existing, data);
      return this.cardRepo.save(existing);
    }

    const card = this.cardRepo.create({
      ...data,
      user_id: userId,
    });

    const savedCard = await this.cardRepo.save(card);
    // TypeORM的save方法返回的是实体或实体数组，这里我们需要确保返回单个实体
    return Array.isArray(savedCard) ? savedCard[0] : savedCard;
  }

  async update(userId: string, data: any): Promise<BusinessCard> {
    const card = await this.getOrCreateCard(userId);
    Object.assign(card, data);
    return this.cardRepo.save(card);
  }

  async generateShareLink(userId: string) {
    const card = await this.getOrCreateCard(userId);
    
    // 增加分享次数
    card.share_count += 1;
    await this.cardRepo.save(card);

    // 生成分享链接
    const shareUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/card/${card.id}`;
    
    // TODO: 生成二维码图片
    
    return {
      share_url: shareUrl,
      qr_code_url: card.qr_code_url,
      card_id: card.id,
    };
  }

  async recordView(cardId: string, viewerId?: string, ip?: string, source?: string) {
    const card = await this.cardRepo.findOne({ where: { id: cardId } });
    if (!card) {
      throw new NotFoundException('名片不存在');
    }

    // 记录浏览
    const view = this.viewRepo.create({
      card_id: cardId,
      viewer_id: viewerId,
      viewer_ip: ip,
      source,
    });

    await this.viewRepo.save(view);

    // 更新浏览次数
    card.view_count += 1;
    await this.cardRepo.save(card);

    return { success: true };
  }

  async getStats(userId: string) {
    const card = await this.getOrCreateCard(userId);

    // 获取最近浏览统计
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [weekViews, monthViews] = await Promise.all([
      this.viewRepo.count({
        where: { card_id: card.id, created_at: { $gte: lastWeek } as any },
      }),
      this.viewRepo.count({
        where: { card_id: card.id, created_at: { $gte: lastMonth } as any },
      }),
    ]);

    return {
      total_views: card.view_count,
      total_shares: card.share_count,
      week_views: weekViews,
      month_views: monthViews,
    };
  }

  async getViews(userId: string, page: number, limit: number) {
    const card = await this.getOrCreateCard(userId);

    const [items, total] = await this.viewRepo.findAndCount({
      where: { card_id: card.id },
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
}
