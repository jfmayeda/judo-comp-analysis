'use client';

import { useCoachGate } from '@/lib/use-coach-gate';
import { AppFrame } from '@/components/AppFrame';
import { DesignTokensGallery } from '@/components/admin/DesignTokensGallery';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { PageHeader } from '@/components/ui/PageHeader';

export default function DesignTokensPage() {
  const { ready, checking } = useCoachGate({ admin: true });

  if (!ready || checking) {
    return <LoadingScreen label="Loading design tokens" />;
  }

  return (
    <AppFrame backHref="/" eyebrow="Design tokens">
      <PageHeader
        kicker="Admin"
        title="Design tokens"
        lead="Live values from app/globals.css. Spot drift against DESIGN.md and fix it at the token level, never in a page."
      />
      <DesignTokensGallery />
    </AppFrame>
  );
}
