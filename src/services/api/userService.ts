import axiosClient from "./axiosClient";
import { type PageResponse } from "./productService";

export interface UserResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  address: string;
  avatar: string;
  roleName: string;
  status: number;
  createdAt: string;
}

const userService = {
  getAllUsers: (page = 0, size = 10): Promise<PageResponse<UserResponse>> => {
    return axiosClient.get("/users", {
      params: { page, size },
    });
  },
  
  getAllUsersList: (): Promise<UserResponse[]> => {
    return axiosClient.get("/users/all");
  },

  createAccount: (data: {
    fullName: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    roleId?: number;
  }): Promise<UserResponse> => {
    return axiosClient.post("/users", data);
  },
  
  getProfile: (id: number): Promise<UserResponse> => {
    return axiosClient.get(`/users/${id}/profile`);
  },
  
  updateProfile: (id: number, data: any): Promise<UserResponse> => {
    return axiosClient.put(`/users/${id}/profile`, data);
  },
  
  updateStatus: (id: number, status: number): Promise<void> => {
    return axiosClient.put(`/users/${id}/status`, { status });
  },

  updateUserByAdmin: (id: number, data: any): Promise<UserResponse> => {
    return axiosClient.put(`/users/${id}`, data);
  },

  requestPasswordOTP: (id: number): Promise<string> => {
    return axiosClient.post(`/users/${id}/password/otp`);
  },

  changePassword: (id: number, data: any): Promise<string> => {
    return axiosClient.post(`/users/${id}/password/change`, data);
  }
};

export default userService;
