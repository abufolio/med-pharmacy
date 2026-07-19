'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuthStore } from '@/stores/auth';
import { initApiAuth } from '@/lib/api/client';

function AuthInitializer({ children }: { children: ReactNode }) {
  useEffect(() => {
    initApiAuth({
      getAccessToken: () => useAuthStore.getState().accessToken,
      getRefreshToken: () => useAuthStore.getState().refreshToken,
      setTokens: (tokens) => useAuthStore.getState().setTokens(tokens),
      logout: () => useAuthStore.getState().logout(),
    });
  }, []);
  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <AuthInitializer>
          {children}
        </AuthInitializer>
        <Toaster richColors position="top-right" />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
