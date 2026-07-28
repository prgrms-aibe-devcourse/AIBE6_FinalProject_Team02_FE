import React from 'react';
import { RegisterFlowProvider } from '@/features/register/RegisterFlowContext';

/**
 * 등록 플로우(/register/*) 전용 레이아웃.
 * 고른 음식 이름은 업로드 → 분석 → 기록으로 라우트를 건너 이어져야 하므로 여기서 Provider를 건다.
 */
export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <RegisterFlowProvider>{children}</RegisterFlowProvider>;
}
