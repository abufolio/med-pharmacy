// ── Auth & Users ──
export interface LoginRequest {
  login: string;
  password: string;
}

export interface LoginResponse {
  tokens: AuthTokens;
  user: UserProfile;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface UserProfile {
  id: string;
  login: string;
  role: UserRole;
  fullName?: string;
  pharmacyId?: string;
  pharmacyName?: string;
}

export type UserRole = 'SUPER_ADMIN' | 'PHARMACY_ADMIN' | 'EMPLOYEE';

export type UserScope = 'SYSTEM' | 'PHARMACY';

// ── Customer (User) ──
export type UserStatus = 'PENDING_CARD' | 'ACTIVE' | 'BLOCKED';

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  telegramId?: string;
  language: string;
  status: UserStatus;
  address?: string;
  addressLat?: string;
  addressLng?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerDto {
  firstName: string;
  lastName: string;
  phone: string;
  telegramId?: number;
  language?: string;
}

export interface UpdateCustomerDto {
  firstName?: string;
  lastName?: string;
  phone?: string;
  language?: string;
}

// ── Pharmacy ──
export type PharmacyStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING';

export interface Pharmacy {
  id: string;
  name: string;
  districtId: string;
  district?: District;
  address?: string;
  phone: string;
  login: string;
  status: PharmacyStatus;
  employees?: Employee[];
  cashbackRules?: CashbackRule[];
  readers?: Reader[];
  _count?: { transactions: number };
  createdAt: string;
}

export interface CreatePharmacyDto {
  name: string;
  districtId: string;
  address?: string;
  phone: string;
  login: string;
  password: string;
}

export interface UpdatePharmacyDto {
  name?: string;
  districtId?: string;
  address?: string;
  phone?: string;
}

// ── Region & District ──
export interface Region {
  id: string;
  name: string;
  code: string;
  districts?: District[];
}

export interface CreateRegionDto {
  name: string;
  code: string;
}

export interface District {
  id: string;
  regionId: string;
  name: string;
  region?: Region;
}

export interface CreateDistrictDto {
  regionId: string;
  name: string;
}

// ── Employee ──
export type EmployeeStatus = 'ACTIVE' | 'SUSPENDED';

export interface Employee {
  id: string;
  pharmacyId: string;
  pharmacy?: Pharmacy;
  roleId: string;
  role?: Role;
  fullName: string;
  login: string;
  status: EmployeeStatus;
  createdAt: string;
}

export interface CreateEmployeeDto {
  login: string;
  password: string;
  fullName: string;
  roleId: string;
  pharmacyId?: string;
}

export interface UpdateEmployeeDto {
  fullName?: string;
  roleId?: string;
}

// ── Role & Permission ──
export interface Role {
  id: string;
  name: string;
  scope: UserScope;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
}

// ── Card ──
export type CardStatus = 'UNASSIGNED' | 'ACTIVE' | 'BLOCKED' | 'REPLACED';

export interface Card {
  id: string;
  uid: string;
  status: CardStatus;
  assignments?: CardAssignment[];
  issuedAt: string;
}

export interface CreateCardDto {
  uid: string;
}

export interface AssignCardDto {
  cardUid: string;
  userId: string;
}

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
  card: { uid: string; status: string };
  transaction?: { id: string; amount: number; cashback: number; status: string };
}

export interface CardAssignment {
  id: string;
  cardId: string;
  userId: string;
  user?: Customer;
  status: 'ACTIVE' | 'UNASSIGNED';
  assignedAt: string;
  unassignedAt?: string;
}

// ── Cashback Rule ──
export type CashbackRuleType = 'PERCENT' | 'FIXED' | 'CAMPAIGN';

export interface CashbackRule {
  id: string;
  pharmacyId: string;
  pharmacy?: Pharmacy;
  type: CashbackRuleType;
  value: number;
  minPurchase?: number;
  maxCashback?: number;
  isActive: boolean;
  validFrom?: string;
  validTo?: string;
  createdAt: string;
}

export interface CreateCashbackRuleDto {
  type: CashbackRuleType;
  value: number;
  minPurchase?: number;
  maxCashback?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
}

export interface UpdateCashbackRuleDto {
  type?: CashbackRuleType;
  value?: number;
  minPurchase?: number;
  maxCashback?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
}

// ── Transaction ──
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'REVERSED' | 'FAILED' | 'FLAGGED';

export interface Transaction {
  id: string;
  userId: string;
  user?: Customer;
  pharmacyId: string;
  pharmacy?: Pharmacy;
  employeeId?: string;
  cardId?: string;
  amount: number;
  status: TransactionStatus;
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

export interface TransactionResult {
  transaction: { id: string; amount: number; status: string };
  cashback: { id: string; amount: number; ruleType: string; ruleValue: number } | null;
  wallet: { id: string; balance: number; previousBalance: number };
}

// ── Cashback ──
export type CashbackStatus = 'ACTIVE' | 'ROLLED_BACK' | 'EXPIRED' | 'FROZEN';

export interface Cashback {
  id: string;
  transactionId: string;
  userId: string;
  amount: number;
  status: CashbackStatus;
  expiresAt?: string;
  createdAt: string;
}

// ── Wallet ──
export interface Wallet {
  id: string;
  userId: string;
  balance: number;
  createdAt: string;
  updatedAt: string;
}

export type WalletTransactionType = 'CREDIT' | 'DEBIT';

export interface WalletTransaction {
  id: string;
  walletId: string;
  type: WalletTransactionType;
  amount: number;
  referenceType: string;
  referenceId?: string;
  description?: string;
  createdAt: string;
}

export interface RequestWithdrawDto {
  amount: number;
  description?: string;
}

// ── Withdraw Request ──
export type WithdrawStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';

export interface WithdrawRequest {
  id: string;
  userId: string;
  user?: Customer;
  amount: number;
  status: WithdrawStatus;
  reviewedBy?: string;
  createdAt: string;
  reviewedAt?: string;
}

export interface ReviewWithdrawDto {
  status: 'APPROVED' | 'REJECTED' | 'PAID';
  reason?: string;
}

// ── Promo Code ──
export type PromoCodeType = 'PERCENT' | 'FIXED';

export interface PromoCode {
  id: string;
  code: string;
  type: PromoCodeType;
  value: number;
  usageLimit: number;
  usedCount: number;
  validFrom?: string;
  validTo?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreatePromoCodeDto {
  code: string;
  type: PromoCodeType;
  value: number;
  usageLimit?: number;
  validFrom?: string;
  validTo?: string;
  isActive?: boolean;
}

export interface RedeemPromoCodeDto {
  code: string;
  purchaseAmount: number;
}

export interface PromoRedemption {
  id: string;
  promoCodeId: string;
  userId: string;
  user?: Customer;
  redeemedAt: string;
}

// ── Reader ──
export type ReaderStatus = 'ONLINE' | 'OFFLINE' | 'FAULTY';

export interface Reader {
  id: string;
  pharmacyId: string;
  pharmacy?: Pharmacy;
  serialNumber: string;
  model?: string;
  status: ReaderStatus;
  lastPingAt?: string;
  createdAt: string;
}

export interface CreateReaderDto {
  serialNumber: string;
  model?: string;
  pharmacyId?: string;
}

// ── Referral ──
export type ReferralStatus = 'PENDING' | 'COMPLETED';

export interface Referral {
  id: string;
  referrerId: string;
  referredId: string;
  referred?: Customer;
  status: ReferralStatus;
  bonusAmount: number;
  createdAt: string;
}

export interface ReferralStats {
  total: number;
  completed: number;
  pending: number;
  totalBonus: number;
}

// ── Notification ──
export interface Notification {
  id: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// ── Report ──
export interface DailyReport {
  date: string;
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
  totalCustomers: number;
}

export interface PharmacySummary {
  totalTransactions: number;
  totalAmount: number;
  totalCashback: number;
  totalCustomers: number;
  avgTransaction: number;
}

export interface SystemOverview {
  totalPharmacies: number;
  activePharmacies: number;
  totalUsers: number;
  totalTransactions: number;
  totalCashback: number;
}

export interface TopPharmacy {
  id: string;
  name: string;
  totalTransactions: number;
  totalAmount: number;
}

export interface TransactionReport {
  id: string;
  amount: number;
  status: string;
  user: { firstName: string; lastName: string; phone: string };
  pharmacy: { name: string };
  cashback?: { amount: number };
  createdAt: string;
}

// ── Setting ──
export interface Setting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  scope?: string;
}

export interface CreateSettingDto {
  key: string;
  value: Record<string, unknown>;
  scope?: string;
}

// ── Audit Log ──
export interface AuditLog {
  id: string;
  actorType: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

// ── Pagination ──
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
