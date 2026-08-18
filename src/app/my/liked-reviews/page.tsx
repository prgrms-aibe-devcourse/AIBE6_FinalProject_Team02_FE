'use client'

import { getLikedReviews, type LikedReview } from '@/features/my/api'
import { LikedReviews } from '@/features/my/LikedReviews'
import { goBackOr, pushInApp } from '@/shared/lib/backNav'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

/** `/my/liked-reviews` 좋아요한 리뷰 (마이 → 내 활동) */
export default function LikedReviewsPage() {
    const router = useRouter()
    const [reviews, setReviews] = useState<LikedReview[] | null>(null)
    const [failed, setFailed] = useState(false)

    const load = useCallback(() => {
        setFailed(false)
        setReviews(null)
        getLikedReviews()
            .then(setReviews)
            .catch(() => setFailed(true)) // reviews는 null로 둔다 — 빈 목록과 실패는 다른 화면
    }, [])

    useEffect(() => {
        load()
    }, [load])

    return (
        <LikedReviews
            reviews={reviews}
            failed={failed}
            onRetry={load}
            onBack={() => goBackOr(router, ROUTES.my)}
            onOpen={(review) => pushInApp(router, ROUTES.challengeReviewTarget(review.challengeId, review.slotId))}
        />
    )
}
