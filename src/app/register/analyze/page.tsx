'use client';

import { useRouter } from 'next/navigation';
import { RegisterAnalyze } from '@/features/register/RegisterAnalyze';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/register/analyze` 등록 2단계 — AI가 음식 인식 */
export default function RegisterAnalyzePage() {
  const router = useRouter();
  const { setSelectedFoodId } = useAppState();

  return (
    <RegisterAnalyze
      onBack={() => router.push(ROUTES.register)}
      onNext={(candidateId) => {
        setSelectedFoodId(candidateId);
        router.push(ROUTES.registerRecord);
      }} />);

}
