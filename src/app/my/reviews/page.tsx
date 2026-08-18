'use client'

import { getMyReviews, type MyReview } from '@/features/my/api'
import { MyReviews } from '@/features/my/MyReviews'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/** `/my/reviews` 내가 쓴 리뷰 (마이 → 내 활동) */
export default function MyReviewsPage() {
    const router = useRouter()
    const [reviews, setReviews] = useState<MyReview[] | null>(null)
    const [failed, setFailed] = useState(false)

    const load = useCallback(() => {
        setFailed(false)
        setReviews(null)
        getMyReviews()
            .then(setReviews)
            .catch(() => setFailed(true)) // reviews는 null로 둔다 — 빈 목록과 실패는 다른 화면
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <MyReviews
            reviews={reviews}
            failed={failed}
            onRetry={load}
            onBack={() => goBackOr(router, ROUTES.my)}
            onOpen={(review) => pushInApp(router, ROUTES.challengeReviewTarget(review.challengeId, review.slotId))}
            onExplore={() => pushInApp(router, `${ROUTES.challenge}?tab=explore`)}
        />
    )
}
