import React from 'react'
import type { LikedReview } from './api'
import { ReviewListCard } from './ReviewListCard'
import { ReviewListScreen } from './ReviewListScreen'
import { reviewDate } from './reviewList'

interface Props {
    /** `null`이면 아직 불러오는 중 */
    reviews: LikedReview[] | null
    failed?: boolean
    onRetry?: () => void
    onBack: () => void
    /** 리뷰가 달린 챌린짓으로 이동 */
    onOpen: (review: LikedReview) => void
}

/**
 * 마이 → 내 활동 → 좋아요한 리뷰.
 *
 * ## 「좋아요한 글」이 아니라 「좋아요한 리뷰」다
 *
 * 지금 좋아요가 실제로 붙는 곳은 챌린짓 리뷰뿐이다 (챌린짓 전체 리뷰 · 챌린짓 내부
 * 음식 리뷰 둘 다 — `review_like`가 `review_id`만 잡아서 한 번에 걸린다).
 * 로그잇 기록 좋아요는 아직 목업이라 담을 데이터가 없다. 이름을 「글」로 넓게 잡으면
 * 로그잇 좋아요가 여기 없는 게 **빠뜨린 것처럼** 보이므로 지금 범위대로 부른다.
 *
 * ## 순서는 내가 누른 순이다
 *
 * 리뷰가 쓰인 순이 아니다. 오래전 리뷰를 오늘 좋아요했으면 맨 위에 있어야 한다 —
 * 그래서 카드 아래 줄도 작성일이 아니라 「…에 좋아요」로 쓴다.
 *
 * 작성자를 함께 보여 준다. 남의 리뷰가 대부분일 목록에서 누가 쓴 글인지 없으면
 * 익명 글 더미가 된다.
 *
 * ## 빈 화면에 버튼이 없다
 *
 * 「내가 쓴 리뷰」에는 `챌린짓 둘러보기`를 뒀다 — 리뷰를 쓰려면 챌린짓에 참여해
 * 음식을 해금해야 하니 경로가 하나뿐이다. 좋아요는 다르다. **좋아요하러 가는 화면이
 * 없다** — 뭘 보다가 그 자리에서 누르는 것이다. 어디로 보내도 임의의 선택이 되고,
 * 로그잇 기록 좋아요가 붙으면 후보가 둘이 되어 그게 드러난다.
 *
 * 그래서 안내만 둔다. 문구도 「챌린짓 리뷰에서」로 좁히지 않았다 — 나중에 로그잇
 * 좋아요가 들어와도 고칠 것이 없다.
 */
export function LikedReviews({ reviews, failed, onRetry, onBack, onOpen }: Props) {
    return (
        <ReviewListScreen
            title="좋아요한 리뷰"
            count={reviews?.length ?? null}
            failed={failed}
            onRetry={onRetry}
            onBack={onBack}
            // 버튼을 두지 않는다 — 아래 주석 참고
            empty={{
                icon: '❤️',
                title: '아직 좋아요한 리뷰가 없어요',
                description: '마음에 드는 리뷰에서 하트를 누르면 여기 모여요.',
            }}
        >
            {(reviews ?? []).map((review) => (
                <li key={review.id}>
                    <ReviewListCard
                        challengeName={review.challengeName}
                        foodName={review.reviewType === 'FOOD' ? review.foodName : null}
                        rating={review.rating}
                        content={review.content}
                        footnote={`${reviewDate(review.likedAt)}에 좋아요`}
                        author={{
                            id: review.reviewerId,
                            nickname: review.reviewerNickname,
                            profileImageUrl: review.reviewerProfileImageUrl,
                        }}
                        onOpen={() => onOpen(review)}
                    />
                </li>
            ))}
        </ReviewListScreen>
    )
}
