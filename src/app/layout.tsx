import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppStateProvider } from '@/shared/store/AppStateProvider';

export const metadata: Metadata = {
  title: '먹킷리스트 도감',
  description: '먹은 음식을 도감으로 모으는 기록 서비스',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="h-full">
        {/* 라우트를 건너 공유되는 상태. 화면 컴포넌트는 여기서 값을 받아 씀 */}
        <AppStateProvider>
          {/* 앱 셸이 뷰포트 전체를 차지. 각 페이지는 h-full로 셸을 채움 */}
          <div className="app-shell">{children}</div>
        </AppStateProvider>
      </body>
    </html>
  );
}
