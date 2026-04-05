import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { INestApplication } from '@nestjs/common';

/**
 * Swagger配置和文档生成
 */
export class SwaggerConfig {
  /**
   * 创建Swagger配置
   */
  static createConfig() {
    return new DocumentBuilder()
      .setTitle('脉刻(MAIK) API文档')
      .setDescription('跨时代简历流动平台 - 后端API接口文档')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: '请输入JWT Token',
          in: 'header',
        },
        'access-token',
      )
      .addApiKey(
        {
          type: 'apiKey',
          name: 'x-api-key',
          in: 'header',
        },
        'api-key',
      )
      .addTag('认证', '用户认证相关接口')
      .addTag('用户', '用户管理相关接口')
      .addTag('简历', '简历管理相关接口')
      .addTag('职位', '职位管理相关接口')
      .addTag('申请', '职位申请相关接口')
      .addTag('积分', '积分管理相关接口')
      .addTag('内容', '内容管理相关接口')
      .addTag('系统', '系统管理相关接口')
      .addServer('http://localhost:3000', '本地开发环境')
      .addServer('http://150.158.51.199:3000', '生产环境')
      .build();
  }

  /**
   * 设置Swagger文档
   */
  static setup(app: INestApplication) {
    const config = SwaggerConfig.createConfig();
    const document = SwaggerModule.createDocument(app, config);
    
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'list',
        filter: true,
        displayRequestDuration: true,
      },
      customSiteTitle: '脉刻(MAIK) API文档',
      customfavIcon: '/favicon.ico',
      customCss: `
        .swagger-ui .topbar { display: none }
        .swagger-ui .info { margin: 20px 0 }
        .swagger-ui .scheme-container { margin: 20px 0 }
        .swagger-ui .opblock-tag { font-size: 18px; font-weight: bold }
        .swagger-ui .opblock .opblock-summary-path { font-family: 'Courier New', monospace }
      `,
    });
  }

  /**
   * 生成API接口说明
   */
  static generateApiSummary() {
    return {
      auth: {
        endpoints: [
          { path: '/api/auth/login', method: 'POST', description: '用户登录' },
          { path: '/api/auth/register', method: 'POST', description: '用户注册' },
          { path: '/api/auth/logout', method: 'POST', description: '用户登出' },
          { path: '/api/auth/refresh', method: 'POST', description: '刷新Token' },
          { path: '/api/auth/forgot-password', method: 'POST', description: '忘记密码' },
          { path: '/api/auth/reset-password', method: 'POST', description: '重置密码' },
          { path: '/api/auth/verify-email', method: 'POST', description: '验证邮箱' },
          { path: '/api/auth/profile', method: 'GET', description: '获取用户资料' },
          { path: '/api/auth/profile', method: 'PUT', description: '更新用户资料' },
        ],
      },
      users: {
        endpoints: [
          { path: '/api/users', method: 'GET', description: '获取用户列表' },
          { path: '/api/users/:id', method: 'GET', description: '获取用户详情' },
          { path: '/api/users/:id', method: 'PUT', description: '更新用户信息' },
          { path: '/api/users/:id/role', method: 'PUT', description: '更新用户角色' },
          { path: '/api/users/:id/status', method: 'PUT', description: '更新用户状态' },
          { path: '/api/users/search', method: 'GET', description: '搜索用户' },
        ],
      },
      resumes: {
        endpoints: [
          { path: '/api/resumes', method: 'GET', description: '获取简历列表' },
          { path: '/api/resumes', method: 'POST', description: '创建简历' },
          { path: '/api/resumes/:id', method: 'GET', description: '获取简历详情' },
          { path: '/api/resumes/:id', method: 'PUT', description: '更新简历' },
          { path: '/api/resumes/:id', method: 'DELETE', description: '删除简历' },
          { path: '/api/resumes/:id/download', method: 'GET', description: '下载简历' },
          { path: '/api/resumes/upload', method: 'POST', description: '上传简历文件' },
          { path: '/api/resumes/parse', method: 'POST', description: '解析简历' },
          { path: '/api/resumes/search', method: 'GET', description: '搜索简历' },
        ],
      },
      jobs: {
        endpoints: [
          { path: '/api/jobs', method: 'GET', description: '获取职位列表' },
          { path: '/api/jobs', method: 'POST', description: '创建职位' },
          { path: '/api/jobs/:id', method: 'GET', description: '获取职位详情' },
          { path: '/api/jobs/:id', method: 'PUT', description: '更新职位' },
          { path: '/api/jobs/:id', method: 'DELETE', description: '删除职位' },
          { path: '/api/jobs/:id/publish', method: 'POST', description: '发布职位' },
          { path: '/api/jobs/:id/close', method: 'POST', description: '关闭职位' },
          { path: '/api/jobs/:id/boost', method: 'POST', description: '推广职位' },
          { path: '/api/jobs/search', method: 'GET', description: '搜索职位' },
        ],
      },
      applications: {
        endpoints: [
          { path: '/api/applications', method: 'GET', description: '获取申请列表' },
          { path: '/api/applications', method: 'POST', description: '创建申请' },
          { path: '/api/applications/:id', method: 'GET', description: '获取申请详情' },
          { path: '/api/applications/:id', method: 'PUT', description: '更新申请' },
          { path: '/api/applications/:id', method: 'DELETE', description: '删除申请' },
          { path: '/api/applications/:id/review', method: 'POST', description: '审核申请' },
          { path: '/api/applications/:id/interview', method: 'POST', description: '安排面试' },
          { path: '/api/applications/:id/offer', method: 'POST', description: '发送录用通知' },
        ],
      },
      credits: {
        endpoints: [
          { path: '/api/credits/balance', method: 'GET', description: '获取积分余额' },
          { path: '/api/credits/history', method: 'GET', description: '获取积分历史' },
          { path: '/api/credits/recharge', method: 'POST', description: '充值积分' },
          { path: '/api/credits/consume', method: 'POST', description: '消费积分' },
          { path: '/api/credits/packages', method: 'GET', description: '获取积分套餐' },
          { path: '/api/credits/packages', method: 'POST', description: '创建积分套餐' },
        ],
      },
    };
  }

  /**
   * 生成数据模型说明
   */
  static generateDataModels() {
    return {
      User: {
        fields: {
          id: '用户ID (UUID)',
          email: '邮箱',
          phone: '手机号',
          username: '用户名',
          avatar: '头像URL',
          bio: '个人简介',
          location: '所在地',
          birthday: '生日',
          gender: '性别',
          role: '角色 (ADMIN, HR, RECRUITER, JOB_SEEKER, etc.)',
          status: '状态 (ACTIVE, INACTIVE, BANNED)',
          isVerified: '是否已验证',
          isOnboardingCompleted: '是否完成引导',
          lastLoginAt: '最后登录时间',
          lastLoginIp: '最后登录IP',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      Resume: {
        fields: {
          id: '简历ID',
          userId: '用户ID',
          name: '姓名',
          title: '职位标题',
          experience: '工作经验(年)',
          education: '学历',
          skills: '技能列表',
          salaryExpectation: '期望薪资',
          location: '期望工作地点',
          content: '简历内容(JSON)',
          fileUrl: '简历文件URL',
          fileType: '文件类型',
          fileSize: '文件大小',
          isPublic: '是否公开',
          isVerified: '是否已验证',
          verifiedBy: '验证者',
          verifiedAt: '验证时间',
          views: '查看次数',
          downloads: '下载次数',
          status: '状态 (DRAFT, PUBLISHED, ARCHIVED)',
          tags: '标签',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      Job: {
        fields: {
          id: '职位ID',
          companyId: '公司ID',
          title: '职位标题',
          description: '职位描述',
          requirements: '职位要求',
          salaryRange: '薪资范围',
          location: '工作地点',
          workType: '工作类型 (FULL_TIME, PART_TIME, REMOTE)',
          experienceLevel: '经验要求',
          educationLevel: '学历要求',
          skills: '技能要求',
          benefits: '福利待遇',
          tags: '标签',
          isPublic: '是否公开',
          isBoosted: '是否推广',
          boostExpiresAt: '推广过期时间',
          views: '查看次数',
          applications: '申请人数',
          status: '状态 (DRAFT, PUBLISHED, CLOSED)',
          publishedAt: '发布时间',
          closedAt: '关闭时间',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      Application: {
        fields: {
          id: '申请ID',
          jobId: '职位ID',
          userId: '用户ID',
          resumeId: '简历ID',
          coverLetter: '求职信',
          status: '状态 (PENDING, REVIEWED, INTERVIEW, OFFER, REJECTED)',
          reviewedAt: '审核时间',
          interviewedAt: '面试时间',
          offeredAt: '录用时间',
          rejectedAt: '拒绝时间',
          feedback: '反馈',
          notes: '备注',
          createdAt: '创建时间',
          updatedAt: '更新时间',
        },
      },
      CreditTransaction: {
        fields: {
          id: '交易ID',
          userId: '用户ID',
          type: '类型 (RECHARGE, CONSUME, REFUND, BONUS)',
          amount: '金额',
          balanceBefore: '交易前余额',
          balanceAfter: '交易后余额',
          description: '描述',
          metadata: '元数据(JSON)',
          createdAt: '创建时间',
        },
      },
    };
  }
}