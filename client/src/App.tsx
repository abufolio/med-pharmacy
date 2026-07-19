import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { LoginPage } from '@/pages/LoginPage';

// Lazy-loaded pages
import { SuperAdminDashboard } from '@/pages/dashboard/SuperAdminDashboard';
import { PharmacyDashboard } from '@/pages/dashboard/PharmacyDashboard';
import { EmployeeDashboard } from '@/pages/dashboard/EmployeeDashboard';
import { DataTablePage } from '@/pages/DataTablePage';
import { PharmacyListPage } from '@/pages/super-admin/PharmacyListPage';
import { RegionManagementPage } from '@/pages/super-admin/RegionManagementPage';
import { UserListPage } from '@/pages/super-admin/UserListPage';
import { CardManagementPage } from '@/pages/super-admin/CardManagementPage';
import { EmployeeListPage } from '@/pages/super-admin/EmployeeListPage';
import { TransactionListPage } from '@/pages/super-admin/TransactionListPage';
import { CashbackRulesPage } from '@/pages/super-admin/CashbackRulesPage';
import { WithdrawRequestPage } from '@/pages/super-admin/WithdrawRequestPage';
import { PromoCodePage } from '@/pages/super-admin/PromoCodePage';
import { AuditLogPage } from '@/pages/super-admin/AuditLogPage';
import { SettingsPage } from '@/pages/super-admin/SettingsPage';
import { ReportsPage } from '@/pages/super-admin/ReportsPage';
import { PharmacyAdminEmployeePage } from '@/pages/pharmacy/PharmacyAdminEmployeePage';
import { PharmacyCashbackRulesPage } from '@/pages/pharmacy/PharmacyCashbackRulesPage';
import { PharmacyCustomerPage } from '@/pages/pharmacy/PharmacyCustomerPage';
import { PharmacyTransactionPage } from '@/pages/pharmacy/PharmacyTransactionPage';
import { PharmacyReaderPage } from '@/pages/pharmacy/PharmacyReaderPage';
import { EmployeeScanPage } from '@/pages/employee/EmployeeScanPage';
import { EmployeeTransactionPage } from '@/pages/employee/EmployeeTransactionPage';
import { EmployeeCustomerPage } from '@/pages/employee/EmployeeCustomerPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function DashboardRouter() {
  const { user } = useAuthStore();
  if (user?.role === 'SUPER_ADMIN') return <SuperAdminDashboard />;
  if (user?.role === 'PHARMACY_ADMIN') return <PharmacyDashboard />;
  return <EmployeeDashboard />;
}

function AppRoutes() {
  const { initialize, isInitialized } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="h-10 w-10 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected routes */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard (all roles) */}
          <Route path="/dashboard" element={<DashboardRouter />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Super Admin Routes */}
          <Route
            path="/super-admin/pharmacies"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <PharmacyListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/regions"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <RegionManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/users"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <UserListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/employees"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <EmployeeListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/cards"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <CardManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/transactions"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <TransactionListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/cashback-rules"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <CashbackRulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/withdrawals"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <WithdrawRequestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/promo-codes"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <PromoCodePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/reports"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <ReportsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/settings"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/super-admin/audit"
            element={
              <ProtectedRoute roles={['SUPER_ADMIN']}>
                <AuditLogPage />
              </ProtectedRoute>
            }
          />

          {/* Pharmacy Admin Routes */}
          <Route
            path="/pharmacy/employees"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <PharmacyAdminEmployeePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/cashback-rules"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <PharmacyCashbackRulesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/customers"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <PharmacyCustomerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/transactions"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <PharmacyTransactionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/reports"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <DataTablePage
                  title="report.title"
                  endpoint="/reports/daily"
                  columns={[
                    { key: 'date', label: 'common.date', date: true },
                    { key: 'totalTransactions', label: 'report.totalTransactions' },
                    { key: 'totalAmount', label: 'report.totalAmount', currency: true },
                  ]}
                />
              </ProtectedRoute>
            }
          />
          <Route
            path="/pharmacy/readers"
            element={
              <ProtectedRoute roles={['PHARMACY_ADMIN']}>
                <PharmacyReaderPage />
              </ProtectedRoute>
            }
          />

          {/* Employee Routes */}
          <Route
            path="/employee/scan"
            element={
              <ProtectedRoute roles={['EMPLOYEE']}>
                <EmployeeScanPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/transactions"
            element={
              <ProtectedRoute roles={['EMPLOYEE']}>
                <EmployeeTransactionPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/customers"
            element={
              <ProtectedRoute roles={['EMPLOYEE']}>
                <EmployeeCustomerPage />
              </ProtectedRoute>
            }
          />

          {/* Profile */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function ProfilePage() {
  const { user } = useAuthStore();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Profile</h1>
      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
          <div className="h-16 w-16 rounded-full bg-primary-100 text-primary-700 text-xl font-bold flex items-center justify-center">
            {(user?.fullName || user?.login || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{user?.fullName || user?.login}</h2>
            <p className="text-sm text-slate-500">{user?.role}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-slate-500">Login:</span>
            <p className="font-medium text-slate-900">{user?.login}</p>
          </div>
          <div>
            <span className="text-slate-500">Role:</span>
            <p className="font-medium text-slate-900">{user?.role}</p>
          </div>
          {user?.pharmacyName && (
            <div className="col-span-2">
              <span className="text-slate-500">Pharmacy:</span>
              <p className="font-medium text-slate-900">{user.pharmacyName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
    </QueryClientProvider>
  );
}
