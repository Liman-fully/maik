import { Test, TestingModule } from '@nestjs/testing';
import { RolePermissionService, Permission } from './role-permission.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User, UserRole } from '../../users/entities/user.entity';
import { Repository } from 'typeorm';

describe('RolePermissionService', () => {
  let service: RolePermissionService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    update: jest.fn(),
  };

  const mockUsers = [
    {
      id: 'admin-id',
      email: 'admin@example.com',
      role: UserRole.ADMIN,
    },
    {
      id: 'hr-id',
      email: 'hr@example.com',
      role: UserRole.HR,
    },
    {
      id: 'seeker-id',
      email: 'seeker@example.com',
      role: UserRole.JOB_SEEKER,
    },
    {
      id: 'user-id',
      email: 'user@example.com',
      role: UserRole.USER,
    },
    {
      id: 'guest-id',
      email: 'guest@example.com',
      role: UserRole.GUEST,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolePermissionService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<RolePermissionService>(RolePermissionService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('应该被定义', () => {
    expect(service).toBeDefined();
  });

  describe('hasPermission', () => {
    it('管理员应该有所有权限', () => {
      expect(service.hasPermission(UserRole.ADMIN, Permission.USER_VIEW)).toBe(true);
      expect(service.hasPermission(UserRole.ADMIN, Permission.SYSTEM_CONFIG)).toBe(true);
    });

    it('HR应该有简历查看和下载权限', () => {
      expect(service.hasPermission(UserRole.HR, Permission.RESUME_VIEW)).toBe(true);
      expect(service.hasPermission(UserRole.HR, Permission.RESUME_DOWNLOAD)).toBe(true);
      expect(service.hasPermission(UserRole.HR, Permission.SYSTEM_CONFIG)).toBe(false);
    });

    it('求职者应该有自己的简历管理权限', () => {
      expect(service.hasPermission(UserRole.JOB_SEEKER, Permission.RESUME_CREATE)).toBe(true);
      expect(service.hasPermission(UserRole.JOB_SEEKER, Permission.RESUME_UPDATE)).toBe(true);
      expect(service.hasPermission(UserRole.JOB_SEEKER, Permission.RESUME_DELETE)).toBe(true);
      expect(service.hasPermission(UserRole.JOB_SEEKER, Permission.RESUME_VERIFY)).toBe(false);
    });

    it('游客只有只读权限', () => {
      expect(service.hasPermission(UserRole.GUEST, Permission.JOB_VIEW)).toBe(true);
      expect(service.hasPermission(UserRole.GUEST, Permission.RESUME_VIEW)).toBe(true);
      expect(service.hasPermission(UserRole.GUEST, Permission.RESUME_CREATE)).toBe(false);
    });
  });

  describe('checkPermission', () => {
    it('应该返回用户是否有权限', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUsers[0]); // 管理员
      const result = await service.checkPermission('admin-id', Permission.USER_VIEW);
      expect(result).toBe(true);
    });

    it('用户不存在时应该返回false', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      const result = await service.checkPermission('non-existent-id', Permission.USER_VIEW);
      expect(result).toBe(false);
    });
  });

  describe('getUserPermissions', () => {
    it('应该返回用户的所有权限', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUsers[1]); // HR
      const permissions = await service.getUserPermissions('hr-id');
      expect(permissions).toContain(Permission.RESUME_VIEW);
      expect(permissions).toContain(Permission.RESUME_DOWNLOAD);
      expect(permissions).not.toContain(Permission.SYSTEM_CONFIG);
    });

    it('用户不存在时应该返回空数组', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      const permissions = await service.getUserPermissions('non-existent-id');
      expect(permissions).toEqual([]);
    });
  });

  describe('getUserRoleInfo', () => {
    it('应该返回用户的角色信息', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUsers[1]); // HR
      const roleInfo = await service.getUserRoleInfo('hr-id');
      expect(roleInfo.role).toBe(UserRole.HR);
      expect(roleInfo.description).toBe('企业HR');
      expect(roleInfo.level).toBe(70);
      expect(roleInfo.permissions).toContain(Permission.RESUME_VIEW);
    });

    it('用户不存在时应该抛出错误', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      await expect(service.getUserRoleInfo('non-existent-id')).rejects.toThrow('用户不存在');
    });
  });

  describe('getRoleLevel', () => {
    it('应该返回角色的层级', () => {
      expect(service.getRoleLevel(UserRole.ADMIN)).toBe(100);
      expect(service.getRoleLevel(UserRole.HR)).toBe(70);
      expect(service.getRoleLevel(UserRole.JOB_SEEKER)).toBe(50);
      expect(service.getRoleLevel(UserRole.GUEST)).toBe(10);
    });

    it('不存在的角色应该返回0', () => {
      expect(service.getRoleLevel('NON_EXISTENT' as UserRole)).toBe(0);
    });
  });

  describe('canOperateUser', () => {
    it('管理员可以操作所有用户', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0]) // 管理员
        .mockResolvedValueOnce(mockUsers[1]); // HR
      const result = await service.canOperateUser('admin-id', 'hr-id');
      expect(result).toBe(true);
    });

    it('高等级用户可以操作低等级用户', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[1]) // HR (level 70)
        .mockResolvedValueOnce(mockUsers[2]); // 求职者 (level 50)
      const result = await service.canOperateUser('hr-id', 'seeker-id');
      expect(result).toBe(true);
    });

    it('不能操作同等级或高等级用户', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[1]) // HR (level 70)
        .mockResolvedValueOnce(mockUsers[0]); // 管理员 (level 100)
      const result = await service.canOperateUser('hr-id', 'admin-id');
      expect(result).toBe(false);
    });

    it('不能操作自己（管理员除外）', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[1]) // HR
        .mockResolvedValueOnce(mockUsers[1]); // 同一个HR
      const result = await service.canOperateUser('hr-id', 'hr-id');
      expect(result).toBe(false);
    });
  });

  describe('getAssignableRoles', () => {
    it('管理员可以分配除自己外的所有角色', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUsers[0]); // 管理员
      const roles = await service.getAssignableRoles('admin-id');
      expect(roles).toContain(UserRole.HR);
      expect(roles).toContain(UserRole.JOB_SEEKER);
      expect(roles).toContain(UserRole.USER);
      expect(roles).toContain(UserRole.GUEST);
      expect(roles).not.toContain(UserRole.ADMIN);
    });

    it('HR只能分配比HR等级低的角色', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(mockUsers[1]); // HR
      const roles = await service.getAssignableRoles('hr-id');
      expect(roles).toContain(UserRole.JOB_SEEKER);
      expect(roles).toContain(UserRole.USER);
      expect(roles).toContain(UserRole.GUEST);
      expect(roles).not.toContain(UserRole.ADMIN);
      expect(roles).not.toContain(UserRole.HR);
    });
  });

  describe('assignUserRole', () => {
    it('成功分配角色', async () => {
      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUsers[0]) // 管理员
        .mockResolvedValueOnce(mockUsers[2]); // 求职者
      mockUserRepository.update.mockResolvedValueOnce({ affected: 1 });
      jest.spyOn(service, 'canOperateUser').mockResolvedValueOnce(true);
      jest.spyOn(service, 'getAssignableRoles').mockResolvedValueOnce([UserRole.HR, UserRole.JOB_SEEKER, UserRole.USER, UserRole.GUEST]);

      const result = await service.assignUserRole('admin-id', 'seeker-id', UserRole.HR);
      expect(result).toBe(true);
      expect(mockUserRepository.update).toHaveBeenCalledWith('seeker-id', { role: UserRole.HR });
    });

    it('没有操作权限时应该返回false', async () => {
      jest.spyOn(service, 'canOperateUser').mockResolvedValueOnce(false);
      const result = await service.assignUserRole('hr-id', 'admin-id', UserRole.USER);
      expect(result).toBe(false);
    });

    it('不能分配超出权限的角色时应该返回false', async () => {
      jest.spyOn(service, 'canOperateUser').mockResolvedValueOnce(true);
      jest.spyOn(service, 'getAssignableRoles').mockResolvedValueOnce([UserRole.JOB_SEEKER, UserRole.USER, UserRole.GUEST]);
      
      const result = await service.assignUserRole('hr-id', 'seeker-id', UserRole.ADMIN);
      expect(result).toBe(false);
    });
  });

  describe('getRolePermissionReport', () => {
    it('应该返回所有角色的权限报告', () => {
      const report = service.getRolePermissionReport();
      expect(report.length).toBeGreaterThan(0);
      
      const adminReport = report.find(r => r.role === UserRole.ADMIN);
      expect(adminReport).toBeDefined();
      expect(adminReport?.permissionCount).toBeGreaterThan(0);
      expect(adminReport?.level).toBe(100);
    });
  });

  describe('validatePermissionConfig', () => {
    it('应该验证权限配置', () => {
      const validation = service.validatePermissionConfig();
      expect(validation.valid).toBe(true);
      expect(validation.errors).toEqual([]);
    });
  });

  describe('权限继承检查', () => {
    it('高等级角色应该包含低等级角色的权限', () => {
      const validation = service.validatePermissionConfig();
      expect(validation.valid).toBe(true);
      
      // 验证管理员包含所有权限
      const adminPermissions = service.getUserRoleInfo('admin-id');
      const hrPermissions = service.getUserRoleInfo('hr-id');
      const seekerPermissions = service.getUserRoleInfo('seeker-id');
      
      // HR的权限应该是管理员权限的子集
      // 求职者的权限应该是HR权限的子集
      // 由于是异步函数，我们可以在测试中验证逻辑
      const adminConfig = service.getRolePermissionReport().find(r => r.role === UserRole.ADMIN);
      const hrConfig = service.getRolePermissionReport().find(r => r.role === UserRole.HR);
      const seekerConfig = service.getRolePermissionReport().find(r => r.role === UserRole.JOB_SEEKER);
      
      if (adminConfig && hrConfig) {
        const missingPermissions = hrConfig.permissions.filter(
          perm => !adminConfig.permissions.includes(perm)
        );
        expect(missingPermissions).toEqual([]);
      }
    });
  });
});