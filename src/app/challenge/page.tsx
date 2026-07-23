'use client';

import { useRouter } from 'next/navigation';
import { ChallengeCountHome } from '@/features/challenge/ChallengeCountHome';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';

/** `/challenge` 챌린지 도감 홈 */
export default function ChallengeHomePage() {
  const router = useRouter();
  const { challenges, createdThisMonth } = useAppState();

  return (
    <ChallengeCountHome
      challenges={challenges}
      createdThisMonth={createdThisMonth}
      onOpenChallenge={(challenge) => router.push(ROUTES.challengeDetail(challenge.id))}
      onCreateChallenge={() => router.push(ROUTES.challengeNew)}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
