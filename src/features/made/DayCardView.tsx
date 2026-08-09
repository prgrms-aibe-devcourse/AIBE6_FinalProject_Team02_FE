import { RotateCwIcon } from 'lucide-react'
import { LogitAvatar } from './LogitAvatar'
import type { DayCardItem, DayCardSlot, LogitDayCard } from './logitTypes'
import { authorName } from './logitTypes'
import type { MadeDexId } from './types'
import { useLogitDayCard } from './useLogitDayCard'

interface Props {
    madeDexId: MadeDexId
    /** feed가 정한 기준일 */
    date: string
    onRecord: () => void
}

/** 냉장고 — 끼니(시간대) 층마다 음식 아이템을 놓고, 하단에 통계·담긴 사람을 보여줌 */
export function DayCardView({ madeDexId, date, onRecord }: Props) {
    const { dayCard, loading, error, reload } = useLogitDayCard(madeDexId, date)
    return <DayCardContent dayCard={dayCard} loading={loading} error={error} onReload={reload} onRecord={onRecord} />
}

interface ContentProps {
    dayCard: LogitDayCard | null
    loading: boolean
    error: string | null
    onReload: () => void
    onRecord: () => void
}

/** 데이터와 분리한 냉장고 화면 */
export function DayCardContent({ dayCard, loading, error, onReload, onRecord }: ContentProps) {
    if (error) {
        return (
            <div className="pt-10 text-center">
                <p className="break-keep text-sm font-bold text-content-primary">{error}</p>
                <button
                    type="button"
                    onClick={onReload}
                    className="mt-3 min-h-touch rounded-full bg-cream-200 px-5 text-sm font-bold text-content-secondary"
                >
                    다시 시도
                </button>
            </div>
        )
    }

    if (loading && !dayCard) {
        return (
            <div className="space-y-3 pt-5" aria-hidden>
                <div className="h-5 w-24 animate-pulse rounded-full bg-cream-200" />
                <div className="aspect-[4/3] w-full animate-pulse rounded-2xl bg-cream-200" />
            </div>
        )
    }

    if (!dayCard) return null

    const filledSlots = dayCard.slots.filter((slot) => slot.items.length > 0)

    if (filledSlots.length === 0) {
        return (
            <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-edge-default bg-cream-50 text-center">
                <span aria-hidden className="text-3xl">
                    🧊
                </span>
                <p className="mt-2 break-keep text-sm font-bold text-content-primary">아직 냉장고가 비어 있어요</p>
                <button
                    type="button"
                    onClick={onRecord}
                    className="mt-3 min-h-touch rounded-full bg-action-primary px-5 text-sm font-bold text-content-on-action shadow-card"
                >
                    식사 기록하기
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-lg text-content-primary">오늘의 냉장고</h2>
                <button
                    type="button"
                    onClick={onReload}
                    aria-label="냉장고 새로고침"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-card text-content-secondary shadow-card"
                >
                    <RotateCwIcon size={16} aria-hidden className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="space-y-3 rounded-2xl bg-surface-card p-3 shadow-card">
                {filledSlots.map((slot) => (
                    <DayCardShelf key={slot.slotId} slot={slot} />
                ))}
            </div>

            <dl className="grid grid-cols-3 gap-2">
                <Stat label="담긴 음식" value={`${dayCard.stats.foodCount}개`} />
                <Stat label="함께 먹은 사람" value={`${dayCard.stats.participantCount}명`} />
                <Stat label="기록한 끼니" value={`${dayCard.stats.recordedSlotCount}끼`} />
            </dl>

            {dayCard.participants.length > 0 && (
                <section>
                    <h3 className="pb-2 text-sm font-bold text-content-secondary">담긴 사람</h3>
                    <ul className="space-y-2">
                        {dayCard.participants.map((person) => (
                            <li key={person.userId} className="flex items-center gap-3">
                                <LogitAvatar name={authorName(person)} imageUrl={person.profileImageUrl} size="md" />
                                <div className="min-w-0 flex-1">
                                    <p className="flex items-center gap-1 text-sm font-bold text-content-primary">
                                        <span className="truncate">{authorName(person)}</span>
                                        {person.me && <span className="text-xs text-content-link">나</span>}
                                    </p>
                                    <p className="truncate text-xs text-content-muted">
                                        {person.count}개
                                        {person.captions.length > 0 && ` · ${person.captions.join(', ')}`}
                                    </p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}

/** 끼니 한 층(음식 아이템을 2열로 놓음) */
function DayCardShelf({ slot }: { slot: DayCardSlot }) {
    return (
        <section className="rounded-xl bg-cream-100 p-2">
            <h3 className="px-1 pb-2 text-xs font-bold text-content-secondary">{slot.name}</h3>
            <ul className="grid grid-cols-2 gap-2">
                {slot.items.map((item) => (
                    <DayCardFoodItem key={item.recordId} item={item} />
                ))}
            </ul>
        </section>
    )
}

/**
 * 대표 사진(첫 장) + (아래) 작성자 아바타·닉네임 + caption(사진에 붙인 글)
 * 여러 장이면 뒤에 겹쳐 쌓인 것처럼 보이게 하고 장수를 숫자로 얹음
 */
function DayCardFoodItem({ item }: { item: DayCardItem }) {
    const cover = item.photos[0]
    const count = item.photos.length
    // BE가 걸러 주지만 대표가 없으면 놓을 것이 없음
    if (!cover) return null

    return (
        // 겹쳐 쌓인 장이 회전하며 삐져나오는 만큼 여백을 둠 — 옆 칸을 침범하지 않음
        <li className="relative p-1">
            {count > 2 && (
                <span aria-hidden className="absolute inset-1 rotate-3 rounded-xl bg-cream-200 shadow-card" />
            )}
            {count > 1 && (
                <span aria-hidden className="absolute inset-1 -rotate-2 rounded-xl bg-cream-50 shadow-card" />
            )}

            <div className="relative overflow-hidden rounded-xl bg-surface-card shadow-card">
                <div className="relative aspect-square w-full bg-cream-200">
                    {cover.imageUrl && (
                        // presigned URL이라 next/image의 도메인 설정 대상이 아니다
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={cover.imageUrl}
                            alt={cover.caption ?? `${authorName(item.author)}님이 담은 음식 사진`}
                            className="h-full w-full object-cover"
                        />
                    )}
                    {/* 한 장이면 숫자를 붙이지 않음 */}
                    {count > 1 && (
                        <span className="absolute right-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-xs font-bold text-white">
                            {count}장
                        </span>
                    )}
                </div>
                <div className="p-2">
                    {cover.caption && (
                        <p className="truncate text-sm font-bold text-content-primary">{cover.caption}</p>
                    )}
                    <div className={`flex items-center gap-1 ${cover.caption ? 'pt-1' : ''}`}>
                        <LogitAvatar name={authorName(item.author)} imageUrl={item.author.profileImageUrl} size="sm" />
                        <span className="truncate text-xs text-content-muted">{authorName(item.author)}</span>
                    </div>
                </div>
            </div>
        </li>
    )
}

// DOM은 dt→dd(명세대로), 시각 순서(값 위·라벨 아래)는 flex-col-reverse로 뒤집음
function Stat({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex flex-col-reverse rounded-2xl bg-surface-card p-3 text-center shadow-card">
            <dt className="pt-0.5 text-xs text-content-muted">{label}</dt>
            <dd className="font-display text-lg text-content-primary">{value}</dd>
        </div>
    )
}
