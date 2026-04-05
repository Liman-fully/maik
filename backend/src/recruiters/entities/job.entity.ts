// 从 jobs 模块重新导出所有 Job 相关实体和枚举
// 避免两个 entity 映射到同一张表
export {
  Job,
  JobStatus,
  JobType,
  JobPriority,
  JobApplication,
  ApplicationStatus,
  ApplicationSource,
  JobFavorite,
} from '../../jobs/entities/job.entity';
