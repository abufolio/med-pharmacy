import { apiService } from './api';
import type {
  LoginRequest,
  LoginResponse,
  CreatePharmacyDto,
  UpdatePharmacyDto,
  Pharmacy,
  PaginatedResponse,
  Region,
  CreateRegionDto,
  District,
  CreateDistrictDto,
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  Employee,
  CreateEmployeeDto,
  UpdateEmployeeDto,
  Card,
  CreateCardDto,
  AssignCardDto,
  ScanCardDto,
  ScanResponse,
  CashbackRule,
  CreateCashbackRuleDto,
  UpdateCashbackRuleDto,
  Transaction,
  CreateTransactionDto,
  TransactionResult,
  Wallet,
  WalletTransaction,
  RequestWithdrawDto,
  WithdrawRequest,
  ReviewWithdrawDto,
  PromoCode,
  CreatePromoCodeDto,
  RedeemPromoCodeDto,
  PromoRedemption,
  Reader,
  CreateReaderDto,
  Referral,
  ReferralStats,
  Notification,
  Setting,
  CreateSettingDto,
  AuditLog,
  DailyReport,
  PharmacySummary,
  SystemOverview,
  TopPharmacy,
  TransactionReport,
  Cashback,
} from '@/types';

// ── Auth ──
export const authApi = {
  login: (data: LoginRequest) => apiService.post<LoginResponse>('/auth/login', data),
  refresh: (refreshToken: string) =>
    apiService.post('/auth/refresh', { refreshToken }),
  logout: (refreshToken?: string) =>
    apiService.post('/auth/logout', { refreshToken }),
  registerEmployee: (data: CreateEmployeeDto & { password: string }) =>
    apiService.post('/auth/register-employee', data),
};

// ── Regions ──
export const regionApi = {
  list: () => apiService.get<Region[]>('/regions'),
  create: (data: CreateRegionDto) => apiService.post<Region>('/regions', data),
  update: (id: string, data: Partial<CreateRegionDto>) =>
    apiService.patch<Region>(`/regions/${id}`, data),
  delete: (id: string) => apiService.delete(`/regions/${id}`),
};

// ── Districts ──
export const districtApi = {
  list: (regionId?: string) =>
    apiService.get<District[]>('/districts', { params: { regionId } }),
  create: (data: CreateDistrictDto) => apiService.post<District>('/districts', data),
  update: (id: string, data: { name?: string }) =>
    apiService.patch<District>(`/districts/${id}`, data),
  delete: (id: string) => apiService.delete(`/districts/${id}`),
};

// ── Pharmacies ──
export const pharmacyApi = {
  list: (params?: { status?: string; page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Pharmacy>>('/pharmacies', { params }),
  getById: (id: string) => apiService.get<Pharmacy>(`/pharmacies/${id}`),
  create: (data: CreatePharmacyDto) => apiService.post<Pharmacy>('/pharmacies', data),
  update: (id: string, data: UpdatePharmacyDto) =>
    apiService.patch<Pharmacy>(`/pharmacies/${id}`, data),
  updateStatus: (id: string, status: string) =>
    apiService.patch(`/pharmacies/${id}/status`, { status }),
  changePassword: (id: string, newPassword: string) =>
    apiService.post(`/pharmacies/${id}/change-password`, { newPassword }),
};

// ── Customers (Users) ──
export const customerApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Customer>>('/users', { params }),
  getByPhone: (phone: string) => apiService.get<Customer>(`/users/phone/${phone}`),
  getById: (id: string) => apiService.get<Customer>(`/users/${id}`),
  create: (data: CreateCustomerDto) => apiService.post<Customer>('/users', data),
  update: (id: string, data: UpdateCustomerDto) =>
    apiService.patch<Customer>(`/users/${id}`, data),
  block: (id: string) => apiService.post(`/users/${id}/block`),
  unblock: (id: string) => apiService.post(`/users/${id}/unblock`),
};

// ── Employees ──
export const employeeApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Employee>>('/employees', { params }),
  getById: (id: string) => apiService.get<Employee>(`/employees/${id}`),
  create: (data: CreateEmployeeDto) => apiService.post<Employee>('/employees', data),
  update: (id: string, data: UpdateEmployeeDto) =>
    apiService.patch<Employee>(`/employees/${id}`, data),
  suspend: (id: string) => apiService.post(`/employees/${id}/suspend`),
  activate: (id: string) => apiService.post(`/employees/${id}/activate`),
};

// ── Cards ──
export const cardApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Card>>('/cards', { params }),
  getByUid: (uid: string) => apiService.get<Card>(`/cards/${uid}`),
  create: (data: CreateCardDto) => apiService.post<Card>('/cards', data),
  updateStatus: (uid: string, status: 'ACTIVE' | 'BLOCKED') =>
    apiService.patch(`/cards/${uid}/status`, { status }),
  assign: (data: AssignCardDto) => apiService.post('/cards/assign', data),
  unassign: (cardUid: string) => apiService.post('/cards/unassign', { cardUid }),
  scan: (data: ScanCardDto) => apiService.post<ScanResponse>('/cards/scan', data),
};

// ── Cashback Rules ──
export const cashbackRuleApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<CashbackRule>>('/cashbacks/rules', { params }),
  getById: (id: string) => apiService.get<CashbackRule>(`/cashbacks/rules/${id}`),
  create: (data: CreateCashbackRuleDto & { pharmacyId?: string }) =>
    apiService.post('/cashbacks/rules', data),
  update: (id: string, data: UpdateCashbackRuleDto) =>
    apiService.patch(`/cashbacks/rules/${id}`, data),
  delete: (id: string) => apiService.delete(`/cashbacks/rules/${id}`),
  listByPharmacy: (pharmacyId: string) =>
    apiService.get<CashbackRule[]>(`/pharmacies/${pharmacyId}/cashback-rules`),
  createForPharmacy: (pharmacyId: string, data: CreateCashbackRuleDto) =>
    apiService.post(`/pharmacies/${pharmacyId}/cashback-rules`, data),
};

// ── Transactions ──
export const transactionApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Transaction>>('/transactions', { params }),
  getById: (id: string) => apiService.get<Transaction>(`/transactions/${id}`),
  create: (data: CreateTransactionDto) =>
    apiService.post<TransactionResult>('/transactions', data),
  reverse: (id: string) => apiService.post(`/transactions/${id}/reverse`),
};

// ── Wallets ──
export const walletApi = {
  getBalance: (userId: string) => apiService.get<Wallet>(`/wallets/${userId}`),
  getTransactions: (userId: string, params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<WalletTransaction>>(
      `/wallets/${userId}/transactions`,
      { params },
    ),
  requestWithdraw: (userId: string, data: RequestWithdrawDto) =>
    apiService.post(`/wallets/${userId}/withdraw`, data),
};

// ── Withdraw Requests ──
export const withdrawApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<WithdrawRequest>>('/wallets/withdraw-requests', {
      params,
    }),
  review: (id: string, data: ReviewWithdrawDto) =>
    apiService.post(`/wallets/withdraw-requests/${id}/review`, data),
};

// ── Promo Codes ──
export const promocodeApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<PromoCode>>('/promocodes', { params }),
  getByCode: (code: string) => apiService.get<PromoCode>(`/promocodes/code/${code}`),
  getById: (id: string) => apiService.get<PromoCode>(`/promocodes/${id}`),
  create: (data: CreatePromoCodeDto) => apiService.post<PromoCode>('/promocodes', data),
  update: (id: string, data: Partial<CreatePromoCodeDto>) =>
    apiService.patch<PromoCode>(`/promocodes/${id}`, data),
  delete: (id: string) => apiService.delete(`/promocodes/${id}`),
  redeem: (data: RedeemPromoCodeDto) =>
    apiService.post('/promocodes/redeem', data),
  redemptions: (userId: string, params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<PromoRedemption>>(
      `/promocodes/redemptions/${userId}`,
      { params },
    ),
};

// ── Readers ──
export const readerApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Reader>>('/readers', { params }),
  create: (data: CreateReaderDto) => apiService.post<Reader>('/readers', data),
  updateStatus: (serialNumber: string, status: string) =>
    apiService.patch(`/readers/${serialNumber}/status`, { status }),
};

// ── Referrals ──
export const referralApi = {
  create: (referredId: string) => apiService.post('/referrals', { referredId }),
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Referral>>('/referrals', { params }),
  myList: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Referral>>('/referrals/my', { params }),
  myStats: () => apiService.get<ReferralStats>('/referrals/my/stats'),
  update: (id: string, data: { status?: string; bonusAmount?: number }) =>
    apiService.patch(`/referrals/${id}`, data),
};

// ── Notifications ──
export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Notification>>('/notifications', { params }),
  markRead: (id: string) => apiService.post(`/notifications/${id}/read`),
  markAllRead: () => apiService.post('/notifications/read-all'),
};

// ── Reports ──
export const reportApi = {
  daily: (params?: {
    pharmacyId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => apiService.get<PaginatedResponse<DailyReport>>('/reports/daily', { params }),
  summary: (params?: { pharmacyId?: string; from?: string; to?: string }) =>
    apiService.get<PharmacySummary>('/reports/summary', { params }),
  overview: (params?: { from?: string; to?: string }) =>
    apiService.get<SystemOverview>('/reports/overview', { params }),
  topPharmacies: (params?: { limit?: number; from?: string; to?: string }) =>
    apiService.get<TopPharmacy[]>('/reports/top-pharmacies', { params }),
  transactions: (params?: {
    pharmacyId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) =>
    apiService.get<PaginatedResponse<TransactionReport>>('/reports/transactions', {
      params,
    }),
};

// ── Settings ──
export const settingApi = {
  list: (params?: { scope?: string; page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Setting>>('/settings', { params }),
  getByKey: (key: string) => apiService.get<Setting>(`/settings/${key}`),
  create: (data: CreateSettingDto) => apiService.post<Setting>('/settings', data),
  update: (key: string, data: { value: Record<string, unknown>; scope?: string }) =>
    apiService.patch<Setting>(`/settings/${key}`, data),
  delete: (key: string) => apiService.delete(`/settings/${key}`),
};

// ── Audit ──
export const auditApi = {
  list: (params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<AuditLog>>('/audit', { params }),
};

// ── Cashbacks (user history) ──
export const cashbackApi = {
  userCashbacks: (userId: string, params?: { page?: number; limit?: number }) =>
    apiService.get<PaginatedResponse<Cashback>>(`/cashbacks/user/${userId}`, {
      params,
    }),
};
