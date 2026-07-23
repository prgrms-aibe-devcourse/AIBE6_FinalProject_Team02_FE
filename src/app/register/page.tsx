'use client';

import { useRouter } from 'next/navigation';
import { RegisterUpload } from '@/features/register/RegisterUpload';
import { useRegistrationExitHref } from '@/features/register/useRegistrationExit';
import { useAppState } from '@/shared/store/AppStateProvider';
import { ROUTES } from '@/shared/lib/routes';

/** `/register` 등록 1단계 — 사진 올리기 */
export default function RegisterUploadPage() {
  const router = useRouter();
  const exitHref = useRegistrationExitHref();
  const { hasUpload, setHasUpload } = useAppState();

  return (
    <RegisterUpload
      hasPhoto={hasUpload}
      onAddPhoto={() => setHasUpload(true)}
      onBack={() => router.push(exitHref)}
      onNext={() => router.push(ROUTES.registerAnalyze)} />);

}
