import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';

// 权限定义
export enum Permission {
  // 用户管理
  USER_VIEW = 'user_view',
  USER_CREATE = 'user_create',
  USER_UPDATE = 'user_update',
  USER_DELETE = 'user_delete',
  USER_BAN = 'user_ban',
  
  // 简历管理
  RESUME_VIEW = 'resume_view',
  RESUME_CREATE = 'resume_create',
  RESUME_UPDATE = 'resume_update',
  RESUME_DELETE = 'resume_delete',
  RESUME_DOWNLOAD = 'resume_download',
  RESUME_VERIFY = 'resume_verify',
  RESUME_PARSER_MANAGE = 'resume_parser_manage',
  
  // 职位管理
  JOB_VIEW = 'job_view',
  JOB_CREATE = 'job_create',
  JOB_UPDATE = 'job_update',
  JOB_DELETE = 'job_delete',
  JOB_PUBLISH = 'job_publish',
  JOB_CLOSE = 'job_close',
  JOB_BOOST = 'job_boost',
  
  // 申请管理
  APPLICATION_VIEW = 'application_view',
  APPLICATION_CREATE = 'application_create',
  APPLICATION_UPDATE = 'application_update',
  APPLICATION_DELETE = 'application_delete',
  APPLICATION_REVIEW = 'application_review',
  APPLICATION_INTERVIEW = 'application_interview',
  APPLICATION_OFFER = 'application_offer',
  
  // 积分管理
  CREDIT_VIEW = 'credit_view',
  CREDIT_RECHARGE = 'credit_recharge',
  CREDIT_CONSUME = 'credit_consume',
  CREDIT_MANAGE = 'credit_manage',
  CREDIT_PACKAGE_MANAGE = 'credit_package_manage',
  
  // 内容管理
  CONTENT_VIEW = 'content_view',
  CONTENT_CREATE = 'content_create',
  CONTENT_UPDATE = 'content_update',
  CONTENT_DELETE = 'content_delete',
  CONTENT_APPROVE = 'content_approve',
  
  // 系统管理
  SYSTEM_CONFIG = 'system_config',
  SYSTEM_MONITOR = 'system_monitor',
  SYSTEM_BACKUP = 'system_backup',
  SYSTEM_LOG = 'system_log',
  SYSTEM_USER_ROLE = 'system_user_role',
}

// 角色权限配置
export interface RolePermissionConfig {
  role: UserRole;
  permissions: Permission[];
  description: string;
  level: number; // 权限等级，数字越大权限越高
}

@Injectable()
export class RolePermissionService {
  private readonly logger = new Logger(RolePermissionService.name);
  
  // 角色权限映射
  private readonly rolePermissions: RolePermissionConfig[] = [
    {
      role: UserRole.ADMIN,
      permissions: Object.values(Permission), // 所有权限
      description: '系统管理员',
      level: 100,
    },
    {
      role: UserRole.SUPER_MODERATOR,
      permissions: [
        // 用户管理
        Permission.USER_VIEW,
        Permission.USER_UPDATE,
        Permission.USER_BAN,
        
        // 简历管理
        Permission.RESUME_VIEW,
        Permission.RESUME_DELETE,
        Permission.RESUME_VERIFY,
        Permission.RESUME_PARSER_MANAGE,
        
        // 职位管理
        Permission.JOB_VIEW,
        Permission.JOB_DELETE,
        
        // 内容管理
        Permission.CONTENT_VIEW,
        Permission.CONTENT_DELETE,
        Permission.CONTENT_APPROVE,
        
        // 系统管理
        Permission.SYSTEM_MONITOR,
        Permission.SYSTEM_LOG,
      ],
      description: '超级版主',
      level: 90,
    },
    {
      role: UserRole.MODERATOR,
      permissions: [
        // 用户管理
        Permission.USER_VIEW,
        
        // 简历管理
        Permission.RESUME_VIEW,
        Permission.RESUME_VERIFY,
        
        // 内容管理
        Permission.CONTENT_VIEW,
        Permission.CONTENT_APPROVE,
        
        // 系统管理
        Permission.SYSTEM_LOG,
      ],
      description: '版主',
      level: 80,
    },
    {
      role: UserRole.HR,
      permissions: [
        // 简历管理
        Permission.RESUME_VIEW,
        Permission.RESUME_DOWNLOAD,
        
        // 职位管理
        Permission.JOB_VIEW,
        Permission.JOB_CREATE,
        Permission.JOB_UPDATE,
        Permission.JOB_DELETE,
        Permission.JOB_PUBLISH,
        Permission.JOB_CLOSE,
        Permission.JOB_BOOST,
        
        // 申请管理
        Permission.APPLICATION_VIEW,
        Permission.APPLICATION_REVIEW,
        Permission.APPLICATION_INTERVIEW,
        Permission.APPLICATION_OFFER,
        
        // 积分管理
        Permission.CREDIT_VIEW,
        Permission.CREDIT_CONSUME,
      ],
      description: '企业HR',
      level: 70,
    },
    {
      role: UserRole.RECRUITER,
      permissions: [
        // 简历管理
        Permission.RESUME_VIEW,
        Permission.RESUME_DOWNLOAD,
        
        // 职位管理
        Permission.JOB_VIEW,
        Permission.JOB_CREATE,
        Permission.JOB_UPDATE,
        Permission.JOB_DELETE,
        Permission.JOB_PUBLISH,
        Permission.JOB_CLOSE,
        
        // 申请管理
        Permission.APPLICATION_VIEW,
        Permission.APPLICATION_REVIEW,
        Permission.APPLICATION_INTERVIEW,
        
        // 积分管理
        Permission.CREDIT_VIEW,
        Permission.CREDIT_CONSUME,
      ],
      description: '猎头',
      level: 60,
    },
    {
      role: UserRole.JOB_SEEKER,
      permissions: [
        // 简历管理（自己的）
        Permission.RESUME_VIEW,
        Permission.RESUME_CREATE,
        Permission.RESUME_UPDATE,
        Permission.RESUME_DELETE,
        
        // 职位管理（查看）
        Permission.JOB_VIEW,
        
        // 申请管理（自己的）
        Permission.APPLICATION_VIEW,
        Permission.APPLICATION_CREATE,
        Permission.APPLICATION_UPDATE,
        Permission.APPLICATION_DELETE,
        
        // 积分管理（自己的）
        Permission.CREDIT_VIEW,
        Permission.CREDIT_RECHARGE,
      ],
      description: '求职者',
      level: 50,
    },
    {
      role: UserRole.VERIFIED_USER,
      permissions: [
        // 基础权限
        Permission.RESUME_VIEW,
        Permission.RESUME_CREATE,
        Permission.RESUME_UPDATE,
        
        // 职位查看
        Permission.JOB_VIEW,
        
        // 积分查看
        Permission.CREDIT_VIEW,
      ],
      description: '认证用户',
      level: 40,
    },
    {
      role: UserRole.USER,
      permissions: [
        // 最小权限
        Permission.RESUME_VIEW,
        Permission.RESUME_CREATE,
        Permission.JOB_VIEW,
        Permission.CREDIT_VIEW,
      ],
      description: '普通用户',
      level: 30,
    },
    {
      role: UserRole.GUEST,
      permissions: [
        // 只读权限
        Permission.JOB_VIEW,
        Permission.RESUME_VIEW,
      ],
      description: '游客',
      level: 10,
    },
  ];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * 检查用户是否有权限
   */
  async checkPermission(userId: string, permission: Permission): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return false;
      }

      return this.hasPermission(user.role, permission);
    } catch (error) {
      this.logger.error(`检查权限失败: ${error.message}`, error.stack);
      return false;
    }
  }

  /**
   * 检查用户是否有任意一个权限
   */
  async checkAnyPermission(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (await this.checkPermission(userId, permission)) {
        return true;
      }
    }
    return false;
  }

  /**
   * 检查用户是否有所有权限
   */
  async checkAllPermissions(userId: string, permissions: Permission[]): Promise<boolean> {
    for (const permission of permissions) {
      if (!(await this.checkPermission(userId, permission))) {
        return false;
      }
    }
    return true;
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }

    const config = this.rolePermissions.find(rp => rp.role === user.role);
    return config ? [...config.permissions] : [];
  }

  /**
   * 获取用户角色信息
   */
  async getUserRoleInfo(userId: string): Promise<{
    role: UserRole;
    description: string;
    level: number;
    permissions: Permission[];
  }> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('用户不存在');
    }

    const config = this.rolePermissions.find(rp => rp.role === user.role);
    if (!config) {
      throw new Error('角色配置不存在');
    }

    return {
      role: user.role,
      description: config.description,
      level: config.level,
      permissions: [...config.permissions],
    };
  }

  /**
   * 检查角色是否有权限
   */
  hasPermission(role: UserRole, permission: Permission): boolean {
    const config = this.rolePermissions.find(rp => rp.role === role);
    if (!config) {
      return false;
    }

    return config.permissions.includes(permission);
  }

  /**
   * 获取角色层级
   */
  getRoleLevel(role: UserRole): number {
    const config = this.rolePermissions.find(rp => rp.role === role);
    return config ? config.level : 0;
  }

  /**
   * 检查是否可以操作目标用户（基于角色层级）
   */
  async canOperateUser(operatorId: string, targetUserId: string): Promise<boolean> {
    try {
      const operator = await this.userRepository.findOne({ where: { id: operatorId } });
      const targetUser = await this.userRepository.findOne({ where: { id: targetUserId } });

      if (!operator || !targetUser) {
        return false;
      }

      // 不能操作自己（管理员除外）
      if (operator.id === targetUser.id && operator.role !== UserRole.ADMIN) {
        return false;
      }

      // 检查角色层级
      const operatorLevel = this.getRoleLevel(operator.role);
      const targetLevel = this.getRoleLevel(targetUser.role);

      return operatorLevel > targetLevel;
    } catch (error) {
      this.logger.error(`检查用户操作权限失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查是否可以操作目标资源
   */
  async canOperateResource(
    userId: string,
    resourceType: 'resume' | 'job' | 'application',
    resourceId: string,
    action: 'view' | 'edit' | 'delete',
  ): Promise<boolean> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        return false;
      }

      // 管理员有所有权限
      if (user.role === UserRole.ADMIN) {
        return true;
      }

      // 根据资源类型检查
      switch (resourceType) {
        case 'resume':
          return await this.canOperateResume(user, resourceId, action);
        case 'job':
          return await this.canOperateJob(user, resourceId, action);
        case 'application':
          return await this.canOperateApplication(user, resourceId, action);
        default:
          return false;
      }
    } catch (error) {
      this.logger.error(`检查资源操作权限失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 检查是否可以操作简历
   */
  private async canOperateResume(
    user: User,
    resumeId: string,
    action: 'view' | 'edit' | 'delete',
  ): Promise<boolean> {
    // TODO: 实现简历权限检查
    // 简化处理：HR和Recruiter可以查看公开简历
    if (['hr', 'recruiter', 'admin'].includes(user.role) && action === 'view') {
      return true;
    }

    // 求职者只能操作自己的简历
    if (user.role === UserRole.JOB_SEEKER) {
      // 需要检查简历是否属于该用户
      return true; // 简化处理
    }

    return false;
  }

  /**
   * 检查是否可以操作职位
   */
  private async canOperateJob(
    user: User,
    jobId: string,
    action: 'view' | 'edit' | 'delete',
  ): Promise<boolean> {
    // TODO: 实现职位权限检查
    // 所有用户都可以查看公开职位
    if (action === 'view') {
      return true;
    }

    // HR和Recruiter可以操作自己发布的职位
    if (['hr', 'recruiter'].includes(user.role)) {
      // 需要检查职位是否属于该用户
      return true; // 简化处理
    }

    // 管理员可以操作所有职位
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return false;
  }

  /**
   * 检查是否可以操作申请
   */
  private async canOperateApplication(
    user: User,
    applicationId: string,
    action: 'view' | 'edit' | 'delete',
  ): Promise<boolean> {
    // TODO: 实现申请权限检查
    // 求职者可以操作自己的申请
    if (user.role === UserRole.JOB_SEEKER) {
      // 需要检查申请是否属于该用户
      return true; // 简化处理
    }

    // HR和Recruiter可以查看相关职位的申请
    if (['hr', 'recruiter'].includes(user.role) && action === 'view') {
      return true;
    }

    // 管理员可以操作所有申请
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    return false;
  }

  /**
   * 获取用户可管理的角色列表（用于角色分配）
   */
  async getAssignableRoles(userId: string): Promise<UserRole[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      return [];
    }

    const userLevel = this.getRoleLevel(user.role);
    
    // 只能分配比自己层级低的角色
    return this.rolePermissions
      .filter(config => config.level < userLevel)
      .map(config => config.role);
  }

  /**
   * 分配用户角色
   */
  async assignUserRole(operatorId: string, targetUserId: string, newRole: UserRole): Promise<boolean> {
    try {
      // 检查操作者权限
      if (!(await this.canOperateUser(operatorId, targetUserId))) {
        return false;
      }

      // 检查是否可以分配该角色
      const assignableRoles = await this.getAssignableRoles(operatorId);
      if (!assignableRoles.includes(newRole)) {
        return false;
      }

      // 更新用户角色
      await this.userRepository.update(targetUserId, { role: newRole });
      
      this.logger.log(`用户 ${operatorId} 将用户 ${targetUserId} 角色更新为 ${newRole}`);
      return true;
    } catch (error) {
      this.logger.error(`分配用户角色失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取角色权限报告
   */
  getRolePermissionReport(): Array<{
    role: UserRole;
    description: string;
    level: number;
    permissionCount: number;
    permissions: string[];
  }> {
    return this.rolePermissions.map(config => ({
      role: config.role,
      description: config.description,
      level: config.level,
      permissionCount: config.permissions.length,
      permissions: config.permissions,
    }));
  }

  /**
   * 验证权限配置
   */
  validatePermissionConfig(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查权限是否存在重复
    const seen = new Set<string>();
    for (const config of this.rolePermissions) {
      if (seen.has(config.role)) {
        errors.push(`重复的角色配置: ${config.role}`);
      }
      seen.add(config.role);
    }

    // 检查层级逻辑
    for (const config of this.rolePermissions) {
      for (const otherConfig of this.rolePermissions) {
        if (config.role !== otherConfig.role && config.level <= otherConfig.level) {
          // 检查权限包含关系：高等级角色应该包含低等级角色的所有权限
          const missingPermissions = otherConfig.permissions.filter(
            perm => !config.permissions.includes(perm)
          );
          
          if (missingPermissions.length > 0 && config.level > otherConfig.level) {
            errors.push(
              `角色 ${config.role} (等级 ${config.level}) 缺少低等级角色 ${otherConfig.role} 的权限: ${missingPermissions.join(', ')}`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}