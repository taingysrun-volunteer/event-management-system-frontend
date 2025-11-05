export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  role?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
