'use client';

import { useRouter } from 'next/navigation';
import { Onboarding } from '@/features/onboarding/Onboarding';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/onboarding` 첫 실행 튜토리얼. 마이페이지에서 다시 볼 수 있음 */
export default function OnboardingPage() {
  const router = useRouter();
  const { completeOnboarding } = useAppState();

  return (
    <Onboarding
      onDone={() => {
        completeOnboarding();
        router.replace(ROUTES.home);
      }} />);

}
