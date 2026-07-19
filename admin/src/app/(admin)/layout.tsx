'use client';

import type { ReactNode } from 'react';
import { AdminSidebar } from '@/components/layout/admin-sidebar';
import { Providers } from '@/components/providers';
import { AuthGuard } from '@/components/auth-guard';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <Providers>
      <AuthGuard requiredRole="SUPER_ADMIN">
        <div className="flex h-screen overflow-hidden">
          <AdminSidebar />
          <main className="flex-1 overflow-y-auto bg-muted/30">
            <div className="container mx-auto p-6">
              {children}
            </div>
          </main>
        </div>
      </AuthGuard>
    </Providers>
  );
}
