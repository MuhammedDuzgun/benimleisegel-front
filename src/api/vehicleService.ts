import { api } from '../utils/api';
import { Vehicle, VehicleRequest } from '../types';

export const vehicleService = {
  addVehicle: async (data: VehicleRequest): Promise<Vehicle> => {
    const response = await api.post<Vehicle>('/vehicles', data);
    return response.data;
  },

  deleteVehicle: async (): Promise<void> => {
    await api.delete('/vehicles');
  },
};

