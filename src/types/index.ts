export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  vehicle?: Vehicle;
}

export interface Vehicle {
  id: number;
  plate: string;
  brand: string;
  model: string;
  userId: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  message: string;
}

export interface VehicleRequest {
  plate: string;
  brand: string;
  model: string;
}

