'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { DexDetail } from '@/features/dex/DexDetail';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES, TAB_HREF } from '@/shared/lib/routes';

/** `/dex/[id]` 도감 카드 상세 */
export default function DexDetailPage() {
  const router = useRouter();
  const { id } = useParams<{id: string;}>();
  const { findEntry, collectedEntries, equippedBadge } = useAppState();

  const entry = findEntry(Number(id));
  if (!entry) notFound();

  return (
    <DexDetail
      entry={entry}
      collectedEntries={collectedEntries}
      equippedBadge={equippedBadge}
      onBack={() => router.push(ROUTES.home)}
      onOpenEntry={(nextId) => router.replace(ROUTES.dexDetail(nextId))}
      onTab={(tab) => router.push(TAB_HREF[tab])} />);

}
