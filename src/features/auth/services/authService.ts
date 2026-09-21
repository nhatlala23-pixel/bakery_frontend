import axiosClient from '@/services/api/axiosClient';
import type { AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '../types';

const authService = {
  login: (data: LoginRequest): Promise<AuthResponse> => {
    return axiosClient.post('/auth/login', data);
  },
  googleLogin: (token: string): Promise<AuthResponse> => {
    return axiosClient.post('/auth/google', { token });
  },
  register: (data: RegisterRequest): Promise<UserResponse> => {
    return axiosClient.post('/auth/register', data);
  },
  refreshToken: (token: string): Promise<AuthResponse> => {
    return axiosClient.post(`/auth/refresh?refreshToken=${token}`);
  },
  forgotPassword: (email: string): Promise<{ message: string }> => {
    return axiosClient.post('/auth/forgot-password', { email });
  },
  resetPassword: (data: { email: string; otpCode: string; newPassword: string }): Promise<{ message: string }> => {
    return axiosClient.post('/auth/reset-password', data);
  },
};

export default authService;
