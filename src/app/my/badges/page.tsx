'use client';

import { useRouter } from 'next/navigation';
import { BadgeCollection } from '@/features/my/BadgeCollection';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/my/badges` 뱃지 목록 + 대표 뱃지 설정 */
export default function BadgeCollectionPage() {
  const router = useRouter();
  const { equippedBadge, setEquippedBadge } = useAppState();

  return (
    <BadgeCollection
      equippedBadge={equippedBadge}
      onBack={() => router.push(ROUTES.my)}
      onEquip={(badge) => {
        setEquippedBadge(badge);
        router.push(ROUTES.my);
      }} />);

}
