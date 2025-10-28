import { api } from '../utils/api';
import { Ride, CreateRideRequest, UpdateRideStatusRequest } from '../types';

export const rideService = {
  getAvailableRides: async (): Promise<Ride[]> => {
    const response = await api.get<Ride[]>('/rides/available');
    return response.data;
  },

  getUserRides: async (): Promise<Ride[]> => {
    const response = await api.get<Ride[]>('/rides');
    return response.data;
  },

  createRide: async (data: CreateRideRequest): Promise<Ride> => {
    const response = await api.post<Ride>('/rides', data);
    return response.data;
  },

  updateRideStatus: async (id: number, data: UpdateRideStatusRequest): Promise<Ride> => {
    const response = await api.put<Ride>(`/rides/${id}`, data);
    return response.data;
  },
};
