import apiClient from './axiosClient';

export const reportApi = {
  create: async (reportedTempUserId: string, reason: string): Promise<void> => {
    await apiClient.post('/reports', { reportedTempUserId, reason });
  },
};
