'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { IllustrationStudio } from '@/features/illustration/IllustrationStudio'
import type { IllustrationPurpose } from '@/features/illustration/types'
import { goBackOr } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'

const PURPOSES: IllustrationPurpose[] = ['LOGIT_COVER', 'CHALLENGE_COVER', 'CHALLENGE_SLOT', 'BADGE']

function isPurpose(value: string | null): value is IllustrationPurpose {
    return value != null && (PURPOSES as string[]).includes(value)
}

/**
 * 돌아갈 곳은 우리 앱 안이어야 한다. 쿼리로 들어오는 값이라
 * 그대로 믿으면 `//evil.example`로 내보낼 수 있다.
 */
function safeReturnTo(value: string | null): string {
    if (!value || !value.startsWith('/') || value.startsWith('//')) return ROUTES.home
    return value
}

function IllustrationContent() {
    const router = useRouter()
    const params = useSearchParams()

    const purpose = params.get('purpose')
    const returnTo = safeReturnTo(params.get('returnTo'))

    // 자리를 모르면 어떤 프롬프트를 쓸지 정할 수 없다. 빈 화면 대신 돌려보낸다
    const valid = isPurpose(purpose)
    useEffect(() => {
        if (!valid) router.replace(returnTo)
    }, [valid, returnTo, router])

    if (!isPurpose(purpose)) return null

    return (
        <IllustrationStudio
            purpose={purpose}
            initialDescription={params.get('description') ?? ''}
            handoffRef={params.get('ref') ?? undefined}
            /*
             * replace가 아니라 back으로 돌아간다.
             *
             * returnTo는 방금 떠나온 화면이라, replace로 덮으면 앞 항목과 같은 URL이
             * 연달아 둘이 된다. 그러면 이후의 back()이 같은 URL로 옮겨가 리마운트가 없고,
             * 화면을 벗어나려면 한 번 더 눌러야 한다. backNav.ts의 §문제 2와 같은 경우다
             */
            onDone={() => goBackOr(router, returnTo)}
            onBack={() => goBackOr(router, returnTo)}
        />
    )
}

/** `/illustration` AI 일러스트 생성 (useSearchParams는 Suspense로 감싼다) */
export default function IllustrationPage() {
    return (
        <Suspense fallback={null}>
            <IllustrationContent />
        </Suspense>
    )
}
