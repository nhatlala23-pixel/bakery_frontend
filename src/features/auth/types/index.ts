export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  user: UserResponse;
};

export type UserResponse = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
  roleName: string;
  status: number;
};
