import { api } from '../utils/api';
import { Rate, CreateRateRequest } from '../types';

export const rateService = {
  getMyRatesAsRater: async (): Promise<Rate[]> => {
    const response = await api.get('/rates/as-rater');
    return response.data;
  },

  getMyRatesAsRated: async (): Promise<Rate[]> => {
    const response = await api.get('/rates/as-rated');
    return response.data;
  },

  createRate: async (data: CreateRateRequest): Promise<Rate> => {
    const response = await api.post('/rates', data);
    return response.data;
  },
};

