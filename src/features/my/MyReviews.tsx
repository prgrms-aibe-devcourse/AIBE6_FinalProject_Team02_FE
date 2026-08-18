import React from 'react'
import type { MyReview } from './api'
import { ReviewListCard } from './ReviewListCard'
import { ReviewListScreen } from './ReviewListScreen'
import { reviewDate, wasEdited } from './reviewList'

interface Props {
    /** `null`이면 아직 불러오는 중 */
    reviews: MyReview[] | null
    failed?: boolean
    onRetry?: () => void
    onBack: () => void
    /** 리뷰를 남긴 챌린짓으로 이동 */
    onOpen: (review: MyReview) => void
    /** 남긴 리뷰가 없을 때 갈 곳 */
    onExplore: () => void
}

/**
 * 마이 → 내 활동 → 내가 쓴 리뷰. 챌린짓 리뷰와 음식 리뷰를 **섞어 최신순**으로 둔다.
 *
 * 종류별로 나누지 않은 이유 — 이 목록이 답하는 질문은 "내가 언제 뭘 남겼나"다.
 * 종류로 갈라 놓으면 그 시간 흐름이 끊긴다. 종류는 카드 둘째 줄이 말해 준다.
 *
 * ## 읽기 전용이다
 *
 * 리뷰는 **대상 옆에서 고치는 게 맞다** — 어느 음식에 뭐라고 썼는지 다시 보면서 고치는
 * 것이지, 목록에서 글만 보고 고치는 것이 아니다. 목록의 몫은 훑고 그 자리로 데려가는
 * 것까지다 (수정·삭제는 챌린짓 상세의 리뷰 목록에 이미 있다).
 */
export function MyReviews({ reviews, failed, onRetry, onBack, onOpen, onExplore }: Props) {
    return (
        <ReviewListScreen
            title="내가 쓴 리뷰"
            count={reviews?.length ?? null}
            failed={failed}
            onRetry={onRetry}
            onBack={onBack}
            empty={{
                icon: '📝',
                title: '아직 남긴 리뷰가 없어요',
                description: '챌린짓에서 음식을 해금하면 리뷰를 쓸 수 있어요.',
                action: { label: '챌린짓 둘러보기', onClick: onExplore },
            }}
        >
            {(reviews ?? []).map((review) => (
                <li key={review.id}>
                    <ReviewListCard
                        challengeName={review.challengeName}
                        foodName={review.reviewType === 'FOOD' ? review.foodName : null}
                        rating={review.rating}
                        content={review.content}
                        footnote={`${reviewDate(review.createdAt)}${wasEdited(review) ? ' (수정됨)' : ''}`}
                        onOpen={() => onOpen(review)}
                    />
                </li>
            ))}
        </ReviewListScreen>
    )
}
