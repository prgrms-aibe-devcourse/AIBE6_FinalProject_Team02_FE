'use client';

import { useRouter } from 'next/navigation';
import { MadeDexCodeEntry } from '@/features/made/MadeDexInvite';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/made/join` 초대 코드로 제작 도감 참여 */
export default function MadeDexJoinPage() {
  const router = useRouter();
  const { joinWithCode } = useAppState();

  return (
    <MadeDexCodeEntry
      onBack={() => router.push(ROUTES.made)}
      onJoin={(code) => {
        const { result, dexId } = joinWithCode(code);
        if (result === 'success' && dexId) router.push(ROUTES.madeDex(dexId));
        return result;
      }} />);

}
