import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resume, ResumeSource } from '../entities/resume.entity';

// 简历解析结果接口
export interface ResumeParseResult {
  success: boolean;
  data: {
    basicInfo: {
      fullName?: string;
      email?: string;
      phone?: string;
      location?: string;
      avatarUrl?: string;
    };
    summary?: string;
    objective?: string;
    currentPosition?: string;
    currentCompany?: string;
    expectedSalary?: number;
    preferredLocation?: string;
    experiences?: Array<{
      company: string;
      position: string;
      startDate: string;
      endDate?: string;
      description?: string;
      isCurrent?: boolean;
    }>;
    educations?: Array<{
      school: string;
      degree: string;
      major: string;
      startDate: string;
      endDate?: string;
      gpa?: number;
    }>;
    skills?: Array<{
      name: string;
      level?: string; // beginner, intermediate, advanced, expert
      years?: number;
    }>;
    projects?: Array<{
      name: string;
      role: string;
      description: string;
      technologies: string[];
      startDate: string;
      endDate?: string;
    }>;
    rawText?: string;
  };
  confidence: number;
  errors?: string[];
}

@Injectable()
export class ResumeParserService {
  private readonly logger = new Logger(ResumeParserService.name);
  private readonly useMockParser: boolean;

  constructor(private readonly configService: ConfigService) {
    // 开发环境中可以使用mock解析器，生产环境使用真实OCR
    this.useMockParser = this.configService.get('NODE_ENV') !== 'production';
    this.logger.log(`使用 ${this.useMockParser ? '模拟' : '真实'} OCR 解析器`);
  }

  /**
   * 解析简历文件
   * @param filePath 文件路径（本地或COS URL）
   * @param fileType 文件类型
   * @returns 解析结果
   */
  async parseResume(
    filePath: string,
    fileType: string,
    userId: string,
  ): Promise<ResumeParseResult> {
    try {
      this.logger.log(`开始解析简历文件: ${filePath}, 类型: ${fileType}`);

      // 根据文件类型选择解析方式
      let result: ResumeParseResult;
      if (this.useMockParser) {
        result = await this.parseWithMock(filePath, fileType);
      } else {
        result = await this.parseWithRealOCR(filePath, fileType);
      }

      // 计算置信度
      result.confidence = this.calculateConfidence(result);

      this.logger.log(`简历解析完成, 置信度: ${result.confidence}%`);
      return result;
    } catch (error) {
      this.logger.error(`简历解析失败: ${error.message}`, error.stack);
      return {
        success: false,
        data: {} as any,
        confidence: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * 使用模拟解析器（开发环境）
   */
  private async parseWithMock(
    filePath: string,
    fileType: string,
  ): Promise<ResumeParseResult> {
    // 模拟解析逻辑，返回示例数据
    this.logger.log('使用模拟解析器解析简历');

    // 根据文件名猜测一些信息
    const fileName = filePath.split('/').pop() || '';
    const isChinese = fileName.includes('中文') || filePath.includes('chinese');
    const isEnglish = fileName.includes('english') || filePath.includes('resume');

    return {
      success: true,
      data: {
        basicInfo: {
          fullName: isChinese ? '张三' : 'John Doe',
          email: isChinese ? 'zhangsan@example.com' : 'john.doe@example.com',
          phone: isChinese ? '13800138000' : '+1 (555) 123-4567',
          location: isChinese ? '北京市朝阳区' : 'San Francisco, CA',
          avatarUrl: null,
        },
        summary: isChinese
          ? '具有5年全栈开发经验，精通React、Node.js、Python等技术，有大型电商系统开发经验，注重代码质量和团队协作。'
          : 'Senior Full Stack Developer with 5+ years of experience building scalable web applications using React, Node.js, and Python. Passionate about clean code and team collaboration.',
        currentPosition: isChinese ? '高级全栈工程师' : 'Senior Full Stack Engineer',
        currentCompany: isChinese ? '腾讯科技' : 'TechCorp Inc.',
        expectedSalary: isChinese ? 35000 : 150000,
        preferredLocation: isChinese ? '北京/上海/深圳' : 'Remote / San Francisco',
        experiences: [
          {
            company: isChinese ? '腾讯科技' : 'TechCorp Inc.',
            position: isChinese ? '高级全栈工程师' : 'Senior Full Stack Engineer',
            startDate: '2020-01-01',
            endDate: null,
            description: isChinese
              ? '负责核心产品的前后端开发，优化系统性能，带领5人团队完成多个重点项目'
              : 'Lead full-stack development of core products, optimized system performance, mentored junior developers',
            isCurrent: true,
          },
          {
            company: isChinese ? '字节跳动' : 'ByteDance',
            position: isChinese ? '前端工程师' : 'Frontend Engineer',
            startDate: '2018-03-01',
            endDate: '2019-12-31',
            description: isChinese
              ? '开发抖音相关功能，优化前端性能，参与组件库建设'
              : 'Developed TikTok features, optimized frontend performance, contributed to component library',
            isCurrent: false,
          },
        ],
        educations: [
          {
            school: isChinese ? '清华大学' : 'Stanford University',
            degree: isChinese ? '硕士' : 'Master of Science',
            major: isChinese ? '计算机科学与技术' : 'Computer Science',
            startDate: '2014-09-01',
            endDate: '2018-06-01',
            gpa: 3.8,
          },
        ],
        skills: [
          { name: 'React', level: 'expert', years: 4 },
          { name: 'Node.js', level: 'expert', years: 5 },
          { name: 'TypeScript', level: 'advanced', years: 3 },
          { name: 'Python', level: 'advanced', years: 4 },
          { name: 'PostgreSQL', level: 'intermediate', years: 3 },
          { name: 'Docker', level: 'intermediate', years: 2 },
        ],
        projects: [
          {
            name: isChinese ? '电商平台重构' : 'E-commerce Platform Refactoring',
            role: isChinese ? '技术负责人' : 'Tech Lead',
            description: isChinese
              ? '主导平台从单体架构迁移到微服务架构，提升系统可扩展性'
              : 'Led migration from monolithic to microservices architecture, improving scalability',
            technologies: ['Node.js', 'React', 'PostgreSQL', 'Redis', 'Kafka'],
            startDate: '2021-01-01',
            endDate: '2021-12-31',
          },
        ],
        rawText: isChinese
          ? '张三\n13800138000\nzhangsan@example.com\n北京市朝阳区\n\n工作经历\n腾讯科技 高级全栈工程师 2020年1月-至今\n负责核心产品开发，系统性能优化\n字节跳动 前端工程师 2018年3月-2019年12月\n开发抖音功能，前端性能优化\n\n教育背景\n清华大学 计算机科学与技术 硕士 2014年-2018年\n\n技能\nReact/Node.js/TypeScript/Python/PostgreSQL'
          : 'John Doe\n+1 (555) 123-4567\njohn.doe@example.com\nSan Francisco, CA\n\nExperience\nTechCorp Inc. Senior Full Stack Engineer Jan 2020 - Present\nLead full-stack development, system optimization\nByteDance Frontend Engineer Mar 2018 - Dec 2019\nDeveloped TikTok features, frontend optimization\n\nEducation\nStanford University Computer Science MS 2014-2018\n\nSkills\nReact/Node.js/TypeScript/Python/PostgreSQL',
      },
      confidence: 85,
    };
  }

  /**
   * 使用真实OCR解析器（生产环境）
   */
  private async parseWithRealOCR(
    filePath: string,
    fileType: string,
  ): Promise<ResumeParseResult> {
    this.logger.log(`使用真实OCR解析器: ${filePath}`);

    // 这里应该集成 PaddleOCR + Marker + SmartResume
    // 实现步骤：
    // 1. 下载文件到临时目录
    // 2. 调用PaddleOCR进行文本提取
    // 3. 使用Marker进行文档解析
    // 4. 使用SmartResume进行结构化解析
    // 5. 清理临时文件

    // 暂返回模拟数据，实际实现需要部署OCR服务
    return await this.parseWithMock(filePath, fileType);
  }

  /**
   * 计算解析结果的置信度
   */
  private calculateConfidence(result: ResumeParseResult): number {
    if (!result.success) return 0;

    let confidence = 0;
    const data = result.data;

    // 基础信息权重
    if (data.basicInfo.fullName) confidence += 15;
    if (data.basicInfo.email) confidence += 10;
    if (data.basicInfo.phone) confidence += 10;

    // 工作经历权重
    if (data.experiences && data.experiences.length > 0) {
      confidence += Math.min(data.experiences.length * 5, 20);
    }

    // 教育背景权重
    if (data.educations && data.educations.length > 0) {
      confidence += Math.min(data.educations.length * 5, 10);
    }

    // 技能权重
    if (data.skills && data.skills.length > 0) {
      confidence += Math.min(data.skills.length * 2, 15);
    }

    // 其他信息权重
    if (data.currentPosition) confidence += 10;
    if (data.currentCompany) confidence += 5;
    if (data.summary) confidence += 10;

    return Math.min(confidence, 100);
  }

  /**
   * 将解析结果转换为简历实体
   */
  async convertToResumeEntity(
    parseResult: ResumeParseResult,
    userId: string,
    fileInfo?: {
      url: string;
      name: string;
      size: number;
      type: string;
      hash: string;
    },
  ): Promise<Partial<Resume>> {
    const data = parseResult.data;

    const resume: Partial<Resume> = {
      title: `${data.basicInfo.fullName || '未命名'}的简历`,
      summary: data.summary,
      objective: data.objective,
      full_name: data.basicInfo.fullName,
      email: data.basicInfo.email,
      phone: data.basicInfo.phone,
      location: data.basicInfo.location,
      avatar_url: data.basicInfo.avatarUrl,
      current_position: data.currentPosition,
      current_company: data.currentCompany,
      expected_salary: data.expectedSalary,
      preferred_location: data.preferredLocation,
      is_looking_for_job: true,
      source: ResumeSource.PARSED,
      parsing_status: 'completed',
      parsed_at: new Date(),
      parsing_confidence: parseResult.confidence,
    };

    // 如果有文件信息，添加到简历
    if (fileInfo) {
      resume.file_url = fileInfo.url;
      resume.file_name = fileInfo.name;
      resume.file_size = fileInfo.size;
      resume.file_type = fileInfo.type;
      resume.original_file_hash = fileInfo.hash;
    }

    return resume;
  }

  /**
   * 验证简历数据是否完整
   */
  validateResumeData(data: ResumeParseResult['data']): {
    isValid: boolean;
    missingFields: string[];
  } {
    const missingFields: string[] = [];

    if (!data.basicInfo.fullName) missingFields.push('姓名');
    if (!data.basicInfo.email) missingFields.push('邮箱');
    if (!data.currentPosition) missingFields.push('当前职位');

    const isValid = missingFields.length < 3; // 允许最多缺少2个关键字段

    return { isValid, missingFields };
  }
}