'use client';

import { useAuth } from '@/features/auth/AuthContext';
import { withdrawAccount } from '@/features/my/api';
import { MyPage } from '@/features/my/MyPage';
import { WithdrawConfirmSheet } from '@/features/my/WithdrawConfirmSheet';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** `/my` 마이페이지 */
export default function MyPageRoute() {
  const router = useRouter();
  const { me, logout } = useAuth();
  const { collectedIds, profilePhoto, equippedBadge } = useAppState();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState<string | null>(null);

  const handleLogout = async () => {
    await logout();
    router.replace(ROUTES.login);
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawError(null);
    try {
      await withdrawAccount();
      await logout(); // 세션(쿠키·refresh) 정리
      router.replace(ROUTES.login);
    } catch (e) {
      setWithdrawError(
        e instanceof Error ? e.message : '문제가 발생했어요. 다시 시도해 주세요.',
      );
      setWithdrawing(false);
    }
  };

  return (
    <>
      <MyPage
        nickname={me?.nickname ?? ''}
        collectedCount={collectedIds.length}
        profilePhoto={profilePhoto}
        equippedBadge={equippedBadge}
        onChangePhoto={() => router.push(ROUTES.myPhoto)}
        onEditNickname={() => router.push(ROUTES.myNickname)}
        onReplayOnboarding={() => router.push(`${ROUTES.onboarding}?from=my`)}
        onOpenProfile={() => router.push(ROUTES.myProfile)}
        onOpenBadges={() => router.push(ROUTES.myBadges)}
        onLogout={handleLogout}
        onWithdraw={() => setConfirmOpen(true)}
        onTab={(tab) => router.push(TAB_HREF[tab])}
      />
      {confirmOpen && (
        <WithdrawConfirmSheet
          pending={withdrawing}
          error={withdrawError}
          onConfirm={handleWithdraw}
          onClose={() => !withdrawing && setConfirmOpen(false)}
        />
      )}
    </>
  );
}
