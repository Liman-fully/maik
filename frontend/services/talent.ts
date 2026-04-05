import api from '../lib/api';

export interface TalentFilter {
  location?: string;
  experience?: string;
  education?: string;
  skills?: string;
  company?: string;
  expectedSalary?: string;
  jobStatus?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const talentService = {
  /**
   * 获取人才列表
   */
  getTalents: (params: TalentFilter) => {
    return api.get('/talents', { params });
  },

  /**
   * 获取人才详情（暂未实现，预留）
   */
  getTalentById: (id: string) => {
    return api.get(`/talents/${id}`);
  },
};

export const authService = {
  /**
   * 登录
   */
  login: (phone: string, code: string) => {
    return api.post('/auth/login', { phone, code });
  },

  /**
   * 发送验证码
   */
  sendSmsCode: (phone: string) => {
    return api.post('/auth/sms-code', { phone });
  },

  /**
   * 注册
   */
  register: (data: any) => {
    return api.post('/auth/register', data);
  },
};

export const jobService = {
  /**
   * 获取我的职位列表
   */
  getMyJobs: (params?: any) => {
    return api.get('/jobs', { params });
  },

  /**
   * 发布新职位
   */
  createJob: (data: any) => {
    return api.post('/jobs', data);
  },

  /**
   * 获取职位分类
   */
  getCategories: () => {
    return api.get('/jobs/categories');
  },
};
