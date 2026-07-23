'use client';

import { useRouter } from 'next/navigation';
import { UnlockReveal } from '@/features/register/UnlockReveal';
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit';
import { useAppState } from '@/shared/store/AppStateProvider';

/** `/register/unlock` 등록 완료 — 시그니처 해금 연출 (§7) */
export default function RegisterUnlockPage() {
  const router = useRouter();
  const exitHref = useRegistrationExitHref();
  const { selectedFood } = useAppState();

  return (
    <UnlockReveal
      foodName={selectedFood.name}
      foodEmoji={selectedFood.emoji}
      onGoDex={() => router.push(exitHref)} />);

}
