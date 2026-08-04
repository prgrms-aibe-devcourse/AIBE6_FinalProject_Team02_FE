'use client';

import { useCallback, useEffect, useState } from 'react';
import { notFound, useParams, useRouter } from 'next/navigation';
import { ChallengeDetail } from '@/features/challenge/ChallengeDetail';
import { fetchChallengeDetail, joinChallenge, unlockSlot, ChallengeDetailData } from '@/features/challenge/api';
import { uploadImageToS3 } from '@/shared/lib/upload';
import { ChallengeData } from '@/features/challenge/types';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

function ddayLabel(endsAt: string) {
  const days = Math.ceil((new Date(endsAt).getTime() - Date.now()) / 86_400_000);
  return days >= 0 ? `D-${days}` : '종료';
}

/** 위치 인증용 현재 좌표 취득 (권한 필요) */
function getCurrentCoords(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저에서는 위치를 사용할 수 없어요'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('위치 권한을 허용해 주세요')),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  });
}

/** BE 상세 → 화면용 ChallengeData */
function toChallengeData(d: ChallengeDetailData): ChallengeData {
  const total = d.slots.length;
  const unlocked = d.slots.filter((s) => s.unlocked).length;
  return {
    id: String(d.id),
    title: d.name,
    emoji: '🏆',
    tag: d.challengeType === 'FIRST_COME' ? '선착순' : '수집형',
    dday: d.periodType === 'PERMANENT' ? '상시' : (d.endsAt ? ddayLabel(d.endsAt) : '기간한정'),
    participants: d.participantCount,
    owner: '',
    joined: d.joined,
    completed: d.completed,
    verifyType: d.verifyType,
    mine: `나 ${unlocked}/${total}`,
    progress: total ? Math.round((unlocked / total) * 100) : 0,
    target: total,
    targetRestaurants: d.slots.map((s) => ({ id: String(s.id), name: s.foodName, emoji: '🍽️', imageUrl: s.imageUrl ?? undefined })),
    completedTargetIds: d.slots.filter((s) => s.unlocked).map((s) => String(s.id)),
  };
}

/** `/challenge/[id]` 챌린지 상세 */
export default function ChallengeDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { startRegistration } = useAppState();

  const [challenge, setChallenge] = useState<ChallengeData | null>(null);
  const [missing, setMissing] = useState(false);

  const load = useCallback(() => {
    fetchChallengeDetail(id)
      .then((d) => setChallenge(toChallengeData(d)))
      .catch(() => setMissing(true));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (missing) notFound();
  if (!challenge) {
    return (
      <div className="flex h-full items-center justify-center bg-cream-100">
        <p className="text-sm text-brown-soft">불러오는 중…</p>
      </div>);
  }

  return (
    <ChallengeDetail
      challenge={challenge}
      onBack={() => router.push(ROUTES.challenge)}
      onJoin={async () => {
        try {
          await joinChallenge(id);
          load();   // 참여 후 상태 갱신
        } catch (e) {
          alert(e instanceof Error ? e.message : '참여에 실패했어요');
        }
      }}
      onUnlock={async (slotId, file) => {
        try {
          // 위치 인증 챌린지면 현재 좌표를 먼저 확보(권한 필요)
          let coords: { lat: number; lng: number } | null = null;
          if (challenge.verifyType === 'LOCATION') {
            coords = await getCurrentCoords();
          }
          const { key } = await uploadImageToS3(file, file.name);   // S3 업로드 → key
          await unlockSlot(id, slotId, key, coords?.lat ?? null, coords?.lng ?? null); // 인증(해금)
          load();                                                   // 진행도 갱신
        } catch (e) {
          alert(e instanceof Error ? e.message : '인증에 실패했어요');
        }
      }}
      onRegister={() => {
        startRegistration('challenge', challenge.id);
        router.push(ROUTES.register);
      }} />);
}
