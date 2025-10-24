'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ThemeProvider } from 'next-themes';
import { useState } from 'react';

import type { SessionUser } from '@proserv/shared';

import { SessionProvider } from '../lib/session-context';

import type { PropsWithChildren } from 'react';

type AppProvidersProps = PropsWithChildren<{ session: SessionUser }>;

export function AppProviders({ children, session }: AppProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
          mutations: {
            retry: 1,
          },
        },
      }),
  );

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <SessionProvider session={session}>{children}</SessionProvider>
        {process.env.NODE_ENV !== 'production' ? (
          <ReactQueryDevtools
            initialIsOpen={false}
            buttonPosition="bottom-right"
            position="right"
          />
        ) : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
