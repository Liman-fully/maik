import api from '../lib/api';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: string;
  avatar: string | null;
  company: string | null;
  membership: {
    level: string;
    expiresAt: string;
  } | null;
  points: number;
}

export const userService = {
  async getMe(): Promise<UserProfile> {
    const response = await api.get<UserProfile>('/user/me');
    return response.data;
  }
};
