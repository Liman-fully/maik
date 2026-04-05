import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite, FavoriteType } from './entities/favorite.entity';
import { Job } from '../recruiters/entities/job.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getFavoriteJobs(userId: string, page = 1, limit = 10) {
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { userId, type: FavoriteType.JOB },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const targetIds = favorites.map((f) => f.targetId);
    const jobs = targetIds.length
      ? await this.jobRepository.findByIds(targetIds)
      : [];

    // 保持收藏顺序
    const jobMap = new Map(jobs.map((j) => [j.id, j]));
    const items = favorites.map((fav) => {
      const job = jobMap.get(fav.targetId);
      if (!job) return null;
      return {
        id: fav.id,
        targetId: fav.targetId,
        note: fav.note,
        createdAt: fav.createdAt,
        job: {
          id: job.id,
          title: job.title,
          company_name: job.company_name,
          company_logo: job.company_logo,
          location: job.location,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          salary_currency: job.salary_currency,
          job_type: job.type,
          status: job.status,
          experience_min: job.experience_min,
          education_level: job.education_level,
          required_skills: job.required_skills,
          description: job.description,
          created_at: job.created_at,
        },
      };
    }).filter(Boolean);

    return {
      items,
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async getFavoriteTalents(userId: string, page = 1, limit = 10) {
    const [favorites, total] = await this.favoriteRepository.findAndCount({
      where: { userId, type: FavoriteType.TALENT },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    const targetIds = favorites.map((f) => f.targetId);
    const users = targetIds.length
      ? await this.userRepository.findByIds(targetIds)
      : [];

    const userMap = new Map(users.map((u) => [u.id, u]));
    const items = favorites.map((fav) => {
      const user = userMap.get(fav.targetId);
      if (!user) return null;
      return {
        id: fav.id,
        targetId: fav.targetId,
        note: fav.note,
        createdAt: fav.createdAt,
        talent: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar_url,
          bio: user.bio,
          location: user.location,
          position: user.position,
          company: user.company,
          experience_years: user.experience_years,
          industry: user.industry,
          role: user.role,
          is_verified: user.is_verified,
        },
      };
    }).filter(Boolean);

    return {
      items,
      total,
      page,
      limit,
      has_more: page * limit < total,
    };
  }

  async addFavoriteJob(userId: string, jobId: string) {
    const job = await this.jobRepository.findOne({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException('职位不存在');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId, targetId: jobId, type: FavoriteType.JOB },
    });
    if (existing) {
      throw new ConflictException('已收藏该职位');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      targetId: jobId,
      type: FavoriteType.JOB,
    });

    return this.favoriteRepository.save(favorite);
  }

  async removeFavoriteJob(userId: string, jobId: string) {
    const result = await this.favoriteRepository.delete({
      userId,
      targetId: jobId,
      type: FavoriteType.JOB,
    });

    if (result.affected === 0) {
      throw new NotFoundException('收藏不存在');
    }

    return { success: true, message: '已取消收藏' };
  }

  async addFavoriteTalent(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new ConflictException('不能收藏自己');
    }

    const user = await this.userRepository.findOne({
      where: { id: targetUserId },
    });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    const existing = await this.favoriteRepository.findOne({
      where: { userId, targetId: targetUserId, type: FavoriteType.TALENT },
    });
    if (existing) {
      throw new ConflictException('已收藏该人才');
    }

    const favorite = this.favoriteRepository.create({
      userId,
      targetId: targetUserId,
      type: FavoriteType.TALENT,
    });

    return this.favoriteRepository.save(favorite);
  }

  async removeFavoriteTalent(userId: string, targetUserId: string) {
    const result = await this.favoriteRepository.delete({
      userId,
      targetId: targetUserId,
      type: FavoriteType.TALENT,
    });

    if (result.affected === 0) {
      throw new NotFoundException('收藏不存在');
    }

    return { success: true, message: '已取消收藏' };
  }
}
