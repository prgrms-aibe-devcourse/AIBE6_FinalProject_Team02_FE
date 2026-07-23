'use client';

import { useRouter } from 'next/navigation';
import { ChallengeCreate } from '@/features/challenge/ChallengeCreate';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/challenge/new` 챌린지 개설 (월 3회 제한, §6) */
export default function ChallengeCreatePage() {
  const router = useRouter();
  const { createdThisMonth, customBadge, setCustomBadge, createChallenge } = useAppState();

  return (
    <ChallengeCreate
      createdThisMonth={createdThisMonth}
      customBadge={customBadge}
      onBack={() => {
        setCustomBadge(null);
        router.push(ROUTES.challenge);
      }}
      onCreate={(challenge) => {
        createChallenge(challenge);
        router.push(ROUTES.challengeDetail(challenge.id));
      }}
      onCustomBadge={() => router.push(ROUTES.challengeNewBadge)}
      onUsePreset={() => setCustomBadge(null)} />);

}
