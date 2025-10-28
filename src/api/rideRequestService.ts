import { api } from '../utils/api';
import { RideRequest, CreateRideRequestRequest, UpdateRideRequestStatusRequest } from '../types';

export const rideRequestService = {
  getMyRideRequests: async (): Promise<RideRequest[]> => {
    const response = await api.get<RideRequest[]>('/ride-requests');
    return response.data;
  },

  getRideRequestsForRide: async (rideId: number): Promise<RideRequest[]> => {
    const response = await api.get<RideRequest[]>(`/ride-requests/${rideId}`);
    return response.data;
  },

  createRideRequest: async (data: CreateRideRequestRequest): Promise<RideRequest> => {
    const response = await api.post<RideRequest>('/ride-requests', data);
    return response.data;
  },

  updateRideRequestStatus: async (id: number, data: UpdateRideRequestStatusRequest): Promise<RideRequest> => {
    const response = await api.put<RideRequest>(`/ride-requests/${id}`, data);
    return response.data;
  },
};

