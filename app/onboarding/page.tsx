'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useConvexAuth } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { FocusAreaPicker } from '@/components/FocusAreaPicker';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const thingsThatBelong = [
  'a script you wrote for yourself',
  'a tool your manager asked you to build',
  'a department dashboard',
  'a deadline workaround',
  'a prototype that never shipped',
  'a compliance/reporting solution',
];

export default function OnboardingPage() {
  const router = useRouter();
  const { isLoading: authLoading } = useConvexAuth();
  const user = useQuery(api.users.current);
  const focusAreasGrouped = useQuery(api.focusAreas.listActiveGrouped);
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusAreaIds, setFocusAreaIds] = useState<Id<'focusAreas'>[]>([]);

  useEffect(() => {
    if (user?.onboardingCompleted) {
      router.push('/');
    }
  }, [user, router]);

  const canProceed = focusAreaIds.length > 0;

  const handleComplete = async () => {
    if (!canProceed) return;

    setIsSubmitting(true);
    try {
      await completeOnboarding({
        focusAreaIds,
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsSubmitting(true);
    try {
      await completeOnboarding({
        focusAreaIds: [],
      });
      router.push('/');
    } catch (error) {
      console.error('Failed to skip onboarding:', error);
      setIsSubmitting(false);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 to-white flex items-center justify-center px-4 py-12">
      <Card className="w-full max-w-3xl border border-zinc-200">
        <CardHeader className="border-b border-zinc-100">
          <CardTitle className="text-2xl text-zinc-900">Welcome to Garden</CardTitle>
          <CardDescription className="mt-2 text-base space-y-1">
            <p>If you built something in response to friction — personal, team, or department — it belongs here.</p>
            <p className="text-sm text-zinc-600">It doesn&apos;t matter whether this was self-initiated or requested — if it solved real friction, it belongs here.</p>
            <p className="text-sm text-zinc-600">Rough, unfinished, and hacky is welcome — share early, iterate later.</p>
            <Accordion type="single" collapsible className="pt-1">
              <AccordionItem value="things" className="border-b-0">
                <AccordionTrigger className="py-1 text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Things that belong
                </AccordionTrigger>
                <AccordionContent className="pt-2">
                  <ul className="list-disc space-y-1 pl-5 text-sm text-zinc-600">
                    {thingsThatBelong.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            <p className="pt-2">Pick a few focus areas so we can point you to relevant projects (or skip for now).</p>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <FocusAreaPicker
            focusAreasGrouped={focusAreasGrouped}
            selectedFocusAreas={focusAreaIds}
            onSelectionChange={setFocusAreaIds}
          />

          {!canProceed && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              Select at least one focus area to continue.
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-wrap gap-3 justify-end border-t border-zinc-100">
          <Button variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
            {isSubmitting ? 'Loading...' : 'Skip for now'}
          </Button>
          <Button onClick={handleComplete} disabled={isSubmitting || !canProceed}>
            {isSubmitting ? 'Completing...' : 'Complete setup'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
