// Auth types
export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserProfile;
}

export interface UserProfile {
  id: string;
  login: string;
  fullName?: string;
  role: 'EMPLOYEE' | 'PHARMACY_ADMIN' | 'SUPER_ADMIN';
  pharmacyId?: string;
  pharmacyName?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Customer types
export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  language?: string;
  status?: string;
  balance?: number;
  createdAt?: string;
}

// Card types
export interface ScanCardDto {
  cardUid: string;
  pharmacyId: string;
  serialNumber?: string;
  idempotencyKey?: string;
}

export interface ScanResponse {
  success: boolean;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    balance: number;
  };
  card: {
    uid: string;
    status: string;
  };
  transaction?: {
    id: string;
    amount: number;
    cashback: number;
    status: string;
  };
}

// Transaction types
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REVERSED' | 'FAILED' | 'FLAGGED';

export interface Transaction {
  id: string;
  userId: string;
  user?: Customer;
  pharmacyId: string;
  pharmacy?: { id: string; name: string };
  employeeId?: string;
  cardId?: string;
  amount: number;
  status: TransactionStatus;
  cashback?: number;
  cashbacks?: Cashback[];
  createdAt: string;
}

export interface CreateTransactionDto {
  userId: string;
  pharmacyId: string;
  employeeId?: string;
  cardUid?: string;
  amount: number;
  idempotencyKey?: string;
}

export interface Cashback {
  id: string;
  amount: number;
  type?: string;
  ruleName?: string;
}

export interface TransactionResult {
  transaction: Transaction;
  cashback: Cashback;
  wallet?: { balance: number };
}

// Customer API types
export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  phone?: string;
}

export interface CustomerCreateDto {
  firstName: string;
  lastName: string;
  phone: string;
  language?: string;
}

// Common types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}
