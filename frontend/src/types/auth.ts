export interface Permission {
  _id: string;
  name: string;
  code: string;
  description?: string;
}

export interface Role {
  _id: string;
  name: string;
  code: string;
  description?: string;
  permissions?: Permission[] | string[];
}

export interface User {
  id: string;
  _id?: string;
  username: string;
  email: string;
  fullName?: string;
  role: string | Role;
  status: 'active' | 'inactive' | 'locked';
  avatarUrl?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: User;
    token?: string;
  };
}
