import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

// 简历解析任务接口
export interface ResumeParseJobData {
  resumeId: string;
  userId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileHash: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

@Injectable()
export class ResumeParserQueueService {
  private readonly logger = new Logger(ResumeParserQueueService.name);

  constructor(@InjectQueue('resume-parser') private readonly queue: Queue) {}

  /**
   * 添加简历解析任务到队列
   */
  async addResumeParseJob(jobData: ResumeParseJobData): Promise<string> {
    try {
      this.logger.log(`添加简历解析任务: ${jobData.resumeId}`);

      const job = await this.queue.add('parse-resume', jobData, {
        jobId: `resume-parse-${jobData.resumeId}`,
        attempts: 3, // 重试3次
        backoff: {
          type: 'exponential',
          delay: 5000, // 5秒后重试
        },
        removeOnComplete: true, // 完成后移除
        removeOnFail: false, // 失败后保留用于调试
        priority: this.getPriorityValue(jobData.priority),
      });

      this.logger.log(`简历解析任务已添加: ${job.id}`);
      return job.id.toString();
    } catch (error) {
      this.logger.error(`添加简历解析任务失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 批量添加简历解析任务
   */
  async addBatchResumeParseJobs(jobsData: ResumeParseJobData[]): Promise<string[]> {
    const jobIds: string[] = [];

    for (const jobData of jobsData) {
      try {
        const jobId = await this.addResumeParseJob(jobData);
        jobIds.push(jobId);
      } catch (error) {
        this.logger.error(`添加批量任务失败: ${jobData.resumeId}`, error);
        // 继续处理其他任务
      }
    }

    this.logger.log(`批量添加完成，共 ${jobIds.length}/${jobsData.length} 个任务`);
    return jobIds;
  }

  /**
   * 获取队列状态
   */
  async getQueueStatus(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const counts = await this.queue.getJobCounts();
      return {
        waiting: counts.waiting,
        active: counts.active,
        completed: counts.completed,
        failed: counts.failed,
        delayed: counts.delayed,
      };
    } catch (error) {
      this.logger.error(`获取队列状态失败: ${error.message}`);
      return {
        waiting: 0,
        active: 0,
        completed: 0,
        failed: 0,
        delayed: 0,
      };
    }
  }

  /**
   * 获取任务详情
   */
  async getJobInfo(jobId: string): Promise<any> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return { exists: false };
      }

      const state = await job.getState();
      const progress = await job.progress();

      return {
        exists: true,
        id: job.id,
        data: job.data,
        state,
        progress,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
        failedReason: job.failedReason,
        attemptsMade: job.attemptsMade,
      };
    } catch (error) {
      this.logger.error(`获取任务信息失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 重试失败的任务
   */
  async retryFailedJobs(count: number = 10): Promise<number> {
    try {
      const failedJobs = await this.queue.getFailed(0, count - 1);
      let retriedCount = 0;

      for (const job of failedJobs) {
        await job.retry();
        retriedCount++;
      }

      this.logger.log(`重试了 ${retriedCount} 个失败任务`);
      return retriedCount;
    } catch (error) {
      this.logger.error(`重试失败任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清理已完成的任务
   */
  async cleanCompletedJobs(days: number = 7): Promise<number> {
    try {
      const completedJobs = await this.queue.getCompleted(0, -1);
      const cutoffTime = Date.now() - days * 24 * 60 * 60 * 1000;
      let cleanedCount = 0;

      for (const job of completedJobs) {
        if (job.finishedOn && job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }

      this.logger.log(`清理了 ${cleanedCount} 个已完成任务`);
      return cleanedCount;
    } catch (error) {
      this.logger.error(`清理已完成任务失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 暂停队列处理
   */
  async pauseQueue(): Promise<void> {
    try {
      await this.queue.pause();
      this.logger.log('队列已暂停');
    } catch (error) {
      this.logger.error(`暂停队列失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 恢复队列处理
   */
  async resumeQueue(): Promise<void> {
    try {
      await this.queue.resume();
      this.logger.log('队列已恢复');
    } catch (error) {
      this.logger.error(`恢复队列失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 获取优先级数值
   */
  private getPriorityValue(priority?: 'low' | 'normal' | 'high' | 'urgent'): number {
    switch (priority) {
      case 'low':
        return 10;
      case 'normal':
        return 50;
      case 'high':
        return 100;
      case 'urgent':
        return 1000;
      default:
        return 50;
    }
  }

  /**
   * 获取队列统计信息
   */
  async getQueueStatistics(): Promise<{
    totalJobs: number;
    successRate: number;
    averageProcessingTime: number;
    peakActiveJobs: number;
  }> {
    try {
      const counts = await this.queue.getJobCounts();
      const total = counts.waiting + counts.active + counts.completed + counts.failed + counts.delayed;
      
      // 计算成功率
      const successRate = counts.completed > 0 
        ? Math.round((counts.completed / (counts.completed + counts.failed)) * 100) 
        : 0;

      // 获取最近100个已完成任务的处理时间
      const completedJobs = await this.queue.getCompleted(0, 99);
      let totalTime = 0;
      let processedCount = 0;

      for (const job of completedJobs) {
        if (job.processedOn && job.finishedOn) {
          totalTime += job.finishedOn - job.processedOn;
          processedCount++;
        }
      }

      const averageProcessingTime = processedCount > 0 
        ? Math.round(totalTime / processedCount) 
        : 0;

      return {
        totalJobs: total,
        successRate,
        averageProcessingTime,
        peakActiveJobs: counts.active, // 简化处理，实际应该统计峰值
      };
    } catch (error) {
      this.logger.error(`获取队列统计失败: ${error.message}`);
      return {
        totalJobs: 0,
        successRate: 0,
        averageProcessingTime: 0,
        peakActiveJobs: 0,
      };
    }
  }
}