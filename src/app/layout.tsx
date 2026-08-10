import { AuthProvider } from '@/features/auth/AuthContext'
import { AuthGate } from '@/features/auth/AuthGate'
import { AppStateProvider } from '@/shared/store/AppStateProvider'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
    title: '먹킷리스트 도감',
    description: '먹은 음식을 도감으로 모으는 기록 서비스',
}

/**
 * maximumScale을 두지 않는다 — 확대를 막으면 WCAG 2.2 §1.4.4(Resize Text) 위반이다.
 * 입력 포커스 시 iOS 자동 확대는 폰트 16px 이상으로 막는 것이 정석이고(§1.4 base가 16px),
 * 뷰포트로 줌 자체를 봉인하는 방식은 쓰지 않는다.
 */
export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="ko">
            <body className="h-full">
                <AuthProvider>
                    <AppStateProvider>
                        <AuthGate>
                            <div className="app-shell">{children}</div>
                        </AuthGate>
                    </AppStateProvider>
                </AuthProvider>
            </body>
        </html>
    )
}
