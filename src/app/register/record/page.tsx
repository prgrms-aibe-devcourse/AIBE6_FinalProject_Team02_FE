'use client';

import { useRouter } from 'next/navigation';
import { RegisterRecord } from '@/features/register/RegisterRecord';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/**
 * `/register/record` 등록 3단계 — 메모·위치 기록.
 * 챌린지에서 시작한 등록이면 지정 식당 목록을 함께 보여주고 매칭 검증한다 (§6).
 */
export default function RegisterRecordPage() {
  const router = useRouter();
  const {
    selectedFood,
    registrationSource,
    registrationChallengeId,
    findChallenge,
    setRecordDraft,
    finishRegistration
  } = useAppState();

  const challenge = registrationChallengeId ? findChallenge(registrationChallengeId) : undefined;

  return (
    <RegisterRecord
      foodName={selectedFood.name}
      foodEmoji={selectedFood.emoji}
      targetRestaurants={registrationSource === 'challenge' ? challenge?.targetRestaurants : undefined}
      onBack={() => router.push(ROUTES.registerAnalyze)}
      onNext={(memo, location) => {
        const draft = { memo, location };
        setRecordDraft(draft);
        // 제작 도감만 태그 입력 단계를 한 번 더 거침
        if (registrationSource === 'made') {
          router.push(ROUTES.registerTags);
          return;
        }
        finishRegistration([], draft);
        router.push(ROUTES.registerUnlock);
      }} />);

}
