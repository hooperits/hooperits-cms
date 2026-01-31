'use client';

/**
 * HOOPERITS CMS - App Providers
 */

import { SessionProvider } from 'next-auth/react';
import { AdminRealtimeProvider } from '@/components/realtime';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AdminRealtimeProvider>{children}</AdminRealtimeProvider>
    </SessionProvider>
  );
}
