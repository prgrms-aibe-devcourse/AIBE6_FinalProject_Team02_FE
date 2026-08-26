import {
    fetchChallengeDetail,
    fetchChallengeReviews,
    fetchFoodReviews,
    fetchMyChallenges,
} from '@/features/challenge/api'
import type { NotificationItem } from '@/features/notification/api'
import { ROUTES } from '@/shared/lib/routes'

async function resolveChallengeReview(notification: NotificationItem): Promise<string | null> {
    if (!notification.targetId) return null

    if (notification.challengeId && notification.type !== 'CHALLENGE_CARD_REVIEW_ADDED') {
        return ROUTES.challengeReview(notification.challengeId, notification.targetId)
    }
    if (notification.challengeId && notification.slotId && notification.type === 'CHALLENGE_CARD_REVIEW_ADDED') {
        return ROUTES.challengeFoodReview(notification.challengeId, notification.slotId, notification.targetId)
    }

    const created = await fetchMyChallenges('CREATED')

    if (notification.type === 'CHALLENGE_REVIEW_ADDED' || notification.type === 'CHALLENGE_REVIEW_LIKED') {
        for (const challenge of created) {
            const reviews = await fetchChallengeReviews(challenge.id)
            if (reviews.some((review) => review.id === notification.targetId)) {
                return ROUTES.challengeReview(challenge.id, notification.targetId)
            }
        }
    }

    if (notification.type === 'CHALLENGE_CARD_REVIEW_ADDED') {
        for (const challenge of created) {
            const detail = await fetchChallengeDetail(challenge.id)
            for (const slot of detail.slots) {
                const reviews = await fetchFoodReviews(challenge.id, slot.id)
                if (reviews.some((review) => review.id === notification.targetId)) {
                    return ROUTES.challengeFoodReview(challenge.id, slot.id, notification.targetId)
                }
            }
        }
    }

    return null
}

export async function resolveNotificationRoute(notification: NotificationItem): Promise<string> {
    switch (notification.type) {
        case 'FRIEND_REQUEST_RECEIVED':
            return ROUTES.friendRequests
        case 'FRIEND_REQUEST_ACCEPT':
        case 'FRIEND_REQUEST_REJECT':
            return ROUTES.userProfile(notification.actorId)
        case 'MADE_DEX_JOINED':
        case 'MADE_DEX_RECORD_CREATED':
        case 'MADE_DEX_RECORD_ADDED':
        case 'MADE_DEX_MEMBER_RECORD_CREATED':
            return notification.targetId ? ROUTES.madeDex(notification.targetId) : ROUTES.made
        case 'CHALLENGE_REVIEW_ADDED':
        case 'CHALLENGE_CARD_REVIEW_ADDED':
        case 'CHALLENGE_REVIEW_LIKED':
            return (await resolveChallengeReview(notification)) ?? ROUTES.challenge
        case 'MADE_DEX_COMMENT_ADDED':
        case 'MADE_DEX_COMMENT_LIKED':
        case 'MADE_DEX_RECORD_LIKED':
        case 'FRIEND_CARD_REGISTERED':
            if (notification.madeDexId && notification.recordId) {
                return ROUTES.madeRecord(notification.madeDexId, notification.recordId)
            }
            return ROUTES.made
        // 승인 — 칸이 열렸으니 그 칸 상세로 바로 보낸다
        case 'FOOD_REGISTRATION_APPROVE':
            return notification.slotId ? ROUTES.dexDetail(notification.slotId) : ROUTES.basicDex()
        // 거절 — 칸이 안 열려 상세로 보낼 게 없다. 그 음식이 속한 카테고리 목록으로 보낸다
        case 'FOOD_REGISTRATION_REJECT':
            return ROUTES.basicDex(notification.category ?? undefined)
        // 관리자 전용 — 항목 하나로 바로 가는 화면이 없어서 해당 탭을 펼친 콘솔로 보낸다
        case 'FOOD_REGISTRATION_REQUEST_RECEIVED':
            return ROUTES.adminRequests
        case 'FOOD_REPORT_RECEIVED':
            return ROUTES.adminReports
        default:
            return ROUTES.myNotifications
    }
}
