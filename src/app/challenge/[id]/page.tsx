'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { ChallengeDetail } from '@/features/challenge/ChallengeDetail';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/challenge/[id]` 챌린지 상세 — 목표 도감 + 랭킹 */
export default function ChallengeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{id: string;}>();
  const { findChallenge, startRegistration } = useAppState();

  const challenge = findChallenge(id);
  if (!challenge) notFound();

  return (
    <ChallengeDetail
      challenge={challenge}
      onBack={() => router.push(ROUTES.challenge)}
      onRegister={() => {
        startRegistration('challenge', challenge.id);
        router.push(ROUTES.register);
      }} />);

}
