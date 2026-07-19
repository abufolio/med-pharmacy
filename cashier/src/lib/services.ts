import api from '@/lib/api';
import type {
  LoginRequest,
  LoginResponse,
  ScanCardDto,
  ScanResponse,
  CreateTransactionDto,
  TransactionResult,
  CustomerListParams,
  CustomerCreateDto,
  Customer,
  PaginatedResponse,
  Transaction,
} from '@/types';

export const authApi = {
  login: (data: LoginRequest) => api.post<LoginResponse>('/auth/login', data),
  refresh: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

export const cardApi = {
  scan: (data: ScanCardDto) => api.post<ScanResponse>('/cards/scan', data),
};

export const transactionApi = {
  create: (data: CreateTransactionDto) => api.post<TransactionResult>('/transactions', data),
  list: (params?: { page?: number; limit?: number; status?: string }) =>
    api.get<PaginatedResponse<Transaction>>('/transactions', { params }),
};

export const customerApi = {
  list: (params?: CustomerListParams) =>
    api.get<PaginatedResponse<Customer>>('/users', { params }),
  getByPhone: (phone: string) =>
    api.get<Customer>(`/users/phone/${phone}`),
  create: (data: CustomerCreateDto) =>
    api.post<Customer>('/users', data),
};
