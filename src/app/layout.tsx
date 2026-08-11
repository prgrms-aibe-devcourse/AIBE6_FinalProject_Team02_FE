import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGate } from '@/features/auth/AuthGate'
import { AppStateProvider } from '@/shared/store/AppStateProvider'
import { ToastProvider } from '@/shared/ui'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: '먹킷리스트 도감',
    description: '먹은 음식을 도감으로 모으는 기록 서비스',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    // maximumScale은 두지 않는다 — 확대를 막으면 WCAG 2.2 §1.4.4(Resize Text) 위반.
    // 입력 포커스 시 iOS 자동 확대는 폰트 16px 이상으로 막고 있다
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ko">
            <body className="h-full">
                <AuthProvider>
                    <AppStateProvider>
                        <AuthGate>
                            {/* 폰 폭 컬럼은 반드시 이 한 겹이어야 한다.
                                페이지가 Fragment를 반환하면 모달·시트가 화면과 형제가 되는데,
                                컬럼 스타일을 자식 선택자로 걸면 오버레이까지 컬럼으로 취급된다 */}
                            <div className="app-shell">
                                {/* ToastProvider가 컬럼 **안**에 있어야 한다 — 토스트는 fixed로 뜨는데
                                    컨테이닝 블록을 만드는 건 이 컬럼이라, 밖에 두면 데스크톱에서
                                    브라우저 창 전체 폭으로 퍼진다 */}
                                <div className="app-shell-content">
                                    <ToastProvider>{children}</ToastProvider>
                                </div>
                            </div>
                        </AuthGate>
                    </AppStateProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
