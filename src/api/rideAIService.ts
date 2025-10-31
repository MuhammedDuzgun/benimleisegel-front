import axios from 'axios';

export interface RideSalarySuggestionRequest {
  distanceInMeters: number;
  durationInSeconds: number;
  carBrand: string;
  carModel: string;
}

export interface RideSalarySuggestionResponse {
  message: string;
}

export const rideAIService = {
  getPriceSuggestion: async (data: RideSalarySuggestionRequest): Promise<RideSalarySuggestionResponse> => {
    // JWT token gerektirmediği için doğrudan axios kullanıyoruz
    const response = await axios.get<RideSalarySuggestionResponse>('http://localhost:8080/api/ai', {
      params: {
        distanceInMeters: data.distanceInMeters,
        durationInSeconds: data.durationInSeconds,
        carBrand: data.carBrand,
        carModel: data.carModel,
      },
    });
    return response.data;
  },
};

