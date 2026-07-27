'use client';

import { useAuth } from '@/features/auth/AuthContext';
import { MyPage } from '@/features/my/MyPage';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';
import { useAppState } from '@/shared/store/AppStateProvider';
import { useRouter } from 'next/navigation';

/** `/my` 마이페이지 */
export default function MyPageRoute() {
  const router = useRouter();
  const { me } = useAuth();
  const { collectedIds, profilePhoto, equippedBadge } = useAppState();

  return (
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
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
