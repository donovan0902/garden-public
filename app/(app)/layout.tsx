'use client';

import { OnboardingGuard } from './OnboardingGuard';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Authenticated, Unauthenticated } from 'convex/react';
import { LandingPage } from '@/components/LandingPage';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <Authenticated>
        <SidebarProvider>
          <AppSidebar />
          <main className="flex-1">{children}</main>
        </SidebarProvider>
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </OnboardingGuard>
  );
}
