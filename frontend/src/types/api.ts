export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
  errors: ApiError[] | null;
}

export interface ApiError {
  field: string;
  message: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  user: {
    id: number;
    fullName: string;
    username: string;
    role: 'ADMIN' | 'MANAGER' | 'CASHIER' | 'VIEWER';
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
