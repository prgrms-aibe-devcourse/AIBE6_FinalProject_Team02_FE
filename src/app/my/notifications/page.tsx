'use client'

import { fetchNotifications, type NotificationItem } from '@/features/notification/api'
import { useNotifications } from '@/features/notification/NotificationContext'
import { NotificationPanel } from '@/features/notification/NotificationPanel'
import { resolveNotificationRoute } from '@/features/notification/resolveRoute'
import { ROUTES } from '@/shared/lib/routes'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

/** `/my/notifications` 마이페이지 알림 탭 */
export default function NotificationsPage() {
    const router = useRouter()
    const { markAsRead, markAllAsRead } = useNotifications()
    const [notifications, setNotifications] = useState<NotificationItem[] | null>(null)

    useEffect(() => {
        fetchNotifications()
            .then((items) => {
                // 알림함에 들어온 순간 쌓여있던 알림을 한 번에 읽음 처리 — 하나씩 눌러 확인할 필요 없다
                const hasUnread = items.some((n) => !n.read)
                setNotifications(hasUnread ? items.map((n) => ({ ...n, read: true })) : items)
                if (hasUnread) void markAllAsRead()
            })
            .catch(() => setNotifications([]))
        // 진입할 때 한 번만 — markAllAsRead/markAsRead는 NotificationProvider가 안정된 참조로 준다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const markLocalRead = (notificationId: number) => {
        setNotifications((prev) =>
            prev ? prev.map((n) => (n.notificationId === notificationId ? { ...n, read: true } : n)) : prev,
        )
    }

    const handleOpen = (notification: NotificationItem) => {
        if (!notification.read) {
            markLocalRead(notification.notificationId)
            markAsRead(notification.notificationId).catch(() => {})
        }

        resolveNotificationRoute(notification)
            .then((href) => {
                if (href !== ROUTES.myNotifications) router.push(href)
            })
            .catch(() => router.push(ROUTES.myNotifications))
    }

    return (
        <NotificationPanel notifications={notifications} onBack={() => router.push(ROUTES.my)} onOpen={handleOpen} />
    )
}
