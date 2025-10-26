import { api } from '../utils/api';
import { User } from '../types';

export const userService = {
  getAuthenticatedUser: async (): Promise<User> => {
    const response = await api.get<User>('/users');
    return response.data;
  },

  getUser: async (id: number): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  deleteUser: async (): Promise<void> => {
    await api.delete('/users');
  },
};

