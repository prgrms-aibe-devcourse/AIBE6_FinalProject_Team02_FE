import { apiFetch } from '@/shared/lib/api'

// BE domain/notification/entity/NotificationType.java 와 동일
export type NotificationType =
    | 'MADE_DEX_JOINED'
    | 'MADE_DEX_RECORD_CREATED'
    | 'MADE_DEX_RECORD_ADDED'
    | 'MADE_DEX_MEMBER_RECORD_CREATED'
    | 'FRIEND_CARD_REGISTERED'
    | 'MADE_DEX_COMMENT_ADDED'
    | 'MADE_DEX_COMMENT_LIKED'
    | 'MADE_DEX_RECORD_LIKED'
    | 'CHALLENGE_REVIEW_ADDED'
    | 'CHALLENGE_CARD_REVIEW_ADDED'
    | 'CHALLENGE_REVIEW_LIKED'
    | 'FRIEND_REQUEST_RECEIVED'
    | 'FRIEND_REQUEST_ACCEPT'
    | 'FRIEND_REQUEST_REJECT'
    | 'FOOD_REPORT_APPROVE'
    | 'FOOD_REPORT_REJECT'
    | 'FOOD_REGISTRATION_APPROVE'
    | 'FOOD_REGISTRATION_REJECT'
    // 관리자에게 가는 알림 — 일반 유저는 절대 받지 않는다
    | 'FOOD_REGISTRATION_REQUEST_RECEIVED'
    | 'FOOD_REPORT_RECEIVED'

/** GET /api/v1/notifications 응답 항목 (BE NotificationDTO와 일치) */
export interface NotificationItem {
    notificationId: number
    type: NotificationType
    actorId: number
    targetId: number | null
    read: boolean
    createdAt: string // ISO LocalDateTime
    actorNickname?: string | null
    targetName?: string | null
    message?: string | null
    challengeId?: number | null
    slotId?: number | null
    madeDexId?: number | null
    recordId?: number | null
    madeDexName?: string | null
    // 등록 요청이 거절되면 칸이 안 열려 있어 상세로 못 보낸다 — 대신 이 카테고리 목록으로 보낸다
    category?: string | null
}

/** BE가 실제로 내려주는 원본 모양 — 라우팅용 ID들은 payload 안에 들어있다 */
interface RawNotificationItem extends NotificationItem {
    payload?: {
        challengeId?: number
        slotId?: number
        madeDexId?: number
        recordId?: number
        madeDexName?: string
        category?: string
        // 관리자 알림(제보 승인/거절)은 완성된 문구를 여기 실어 보낸다 — 음식명, 거절 사유가 들어있다
        message?: string
    } | null
}

/** payload에 담겨온 라우팅용 ID, 문구를 최상위 필드로 펼친다 (REST/WebSocket 공통 진입점) */
export function normalizeNotification(raw: RawNotificationItem): NotificationItem {
    const payload = raw.payload
    if (!payload) return raw

    return {
        ...raw,
        challengeId: raw.challengeId ?? payload.challengeId ?? null,
        slotId: raw.slotId ?? payload.slotId ?? null,
        madeDexId: raw.madeDexId ?? payload.madeDexId ?? null,
        recordId: raw.recordId ?? payload.recordId ?? null,
        madeDexName: raw.madeDexName ?? payload.madeDexName ?? null,
        category: raw.category ?? payload.category ?? null,
        message: raw.message ?? payload.message ?? null,
    }
}

/** 내 알림 목록 — 서버가 이미 createdAt DESC로 정렬해 준다 */
export function fetchNotifications(): Promise<NotificationItem[]> {
    return apiFetch<RawNotificationItem[]>('/api/v1/notifications').then((items) => items.map(normalizeNotification))
}

/** 안읽은 알림 수 */
export function fetchUnreadNotificationCount(): Promise<number> {
    return apiFetch<number>('/api/v1/notifications/unread-count')
}

/** 읽음 처리 */
export function markNotificationAsRead(notificationId: number): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/${notificationId}/read`, { method: 'PATCH' })
}

/** 알림함 진입 시 한 번에 전부 읽음 처리 */
export function markAllNotificationsAsRead(): Promise<void> {
    return apiFetch<void>('/api/v1/notifications/read-all', { method: 'PATCH' })
}

/** 삭제. 소프트 삭제라 같은 알림이 다시 오면 새로 쌓인다 */
export function deleteNotification(notificationId: number): Promise<void> {
    return apiFetch<void>(`/api/v1/notifications/${notificationId}`, { method: 'DELETE' })
}
