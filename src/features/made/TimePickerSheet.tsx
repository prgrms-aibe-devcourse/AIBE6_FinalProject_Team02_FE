import React, { useCallback, useEffect, useRef, useState } from 'react'
import { BottomSheet } from '@/shared/ui/molecules/BottomSheet'

interface Props {
    /** `HH:mm` (24시간). 비어 있으면 아직 안 적은 것 */
    value: string
    onDone: (value: string) => void
    onClose: () => void
}

type Meridiem = '오전' | '오후'

function split(value: string): { meridiem: Meridiem; hour: number; minute: number } {
    if (!value) return { meridiem: '오전', hour: 12, minute: 0 }
    const [rawHour, rawMinute] = value.split(':')
    const hour24 = Number(rawHour)
    const meridiem: Meridiem = hour24 >= 12 ? '오후' : '오전'
    const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
    return { meridiem, hour: hour12, minute: Number(rawMinute) }
}

function toValue(meridiem: Meridiem, hour: number, minute: number): string {
    const base = hour % 12
    const hour24 = meridiem === '오후' ? base + 12 : base
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
}

const HOURS = Array.from({ length: 12 }, (_, i) => i + 1)
const MINUTES = Array.from({ length: 60 }, (_, i) => i)

export function TimePickerSheet({ value, onDone, onClose }: Props) {
    const initial = split(value)
    const [meridiem, setMeridiem] = useState<Meridiem>(initial.meridiem)
    const [hour, setHour] = useState(initial.hour)
    const [minute, setMinute] = useState(initial.minute)

    return (
        <BottomSheet title="언제 먹었나요?" onClose={onClose}>
            <div className="px-5 pb-8 pt-4">
                {/* 오전/오후 + 휠 피커를 한 줄로 */}
                <div className="relative mx-auto flex items-center justify-center gap-2">
                    {/* 오전/오후 세로 토글 */}
                    <div className="flex flex-col gap-1">
                        {(['오전', '오후'] as const).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => setMeridiem(option)}
                                aria-pressed={meridiem === option}
                                className={`rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
                                    meridiem === option
                                        ? 'bg-action-primary text-content-on-action'
                                        : 'bg-neutral-100/70 text-content-muted'
                                }`}
                            >
                                {option}
                            </button>
                        ))}
                    </div>

                    {/* 선택 영역 하이라이트 — 두 휠에 걸쳐 가로로 깔림 */}
                    <div className="relative flex items-center">
                        <div
                            className="pointer-events-none absolute inset-x-0 z-10 rounded-2xl bg-neutral-100/60"
                            style={{ top: '50%', height: ITEM_HEIGHT, transform: 'translateY(-50%)' }}
                        />

                        <WheelPicker
                            items={HOURS}
                            value={hour}
                            onChange={setHour}
                            format={(v) => String(v)}
                            label="시"
                        />

                        <span className="relative z-20 shrink-0 font-display text-2xl text-content-primary">:</span>

                        <WheelPicker
                            items={MINUTES}
                            value={minute}
                            onChange={setMinute}
                            format={(v) => String(v).padStart(2, '0')}
                            label="분"
                        />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onDone(toValue(meridiem, hour, minute))}
                    className="mt-8 h-cta w-full rounded-full bg-action-primary text-sm font-bold text-content-on-action"
                >
                    완료
                </button>
            </div>
        </BottomSheet>
    )
}

// ---------------------------------------------------------------------------
// 휠 피커
// ---------------------------------------------------------------------------

const ITEM_HEIGHT = 48
const VISIBLE_COUNT = 5
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_COUNT

interface WheelPickerProps<T extends number> {
    items: T[]
    value: T
    onChange: (value: T) => void
    format: (value: T) => string
    label: string
}

function WheelPicker<T extends number>({ items, value, onChange, format, label }: WheelPickerProps<T>) {
    const listRef = useRef<HTMLDivElement>(null)
    const suppressScroll = useRef(false)
    const settling = useRef<ReturnType<typeof setTimeout> | null>(null)

    const padding = Math.floor(VISIBLE_COUNT / 2)

    const scrollToIndex = useCallback(
        (index: number, smooth: boolean) => {
            const list = listRef.current
            if (!list) return
            suppressScroll.current = true
            list.scrollTo({ top: index * ITEM_HEIGHT, behavior: smooth ? 'smooth' : 'instant' })
            requestAnimationFrame(() => {
                suppressScroll.current = false
            })
        },
        [],
    )

    useEffect(() => {
        const index = items.indexOf(value)
        if (index >= 0) scrollToIndex(index, false)
    }, [items, value, scrollToIndex])

    const handleScroll = useCallback(() => {
        if (suppressScroll.current) return
        if (settling.current) clearTimeout(settling.current)

        settling.current = setTimeout(() => {
            const list = listRef.current
            if (!list) return
            const rawIndex = Math.round(list.scrollTop / ITEM_HEIGHT)
            const index = Math.max(0, Math.min(rawIndex, items.length - 1))
            const picked = items[index]
            if (picked !== value) onChange(picked)
            scrollToIndex(index, true)
        }, 80)
    }, [items, value, onChange, scrollToIndex])

    return (
        <div className="relative" style={{ width: 72 }}>
            <div className="relative overflow-hidden" style={{ height: WHEEL_HEIGHT }}>
                {/* 위아래 페이드 */}
                <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-surface-app to-transparent" style={{ height: ITEM_HEIGHT * 1.5 }} />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-surface-app to-transparent" style={{ height: ITEM_HEIGHT * 1.5 }} />

                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto"
                    role="listbox"
                    aria-label={label}
                >
                    {Array.from({ length: padding }).map((_, i) => (
                        <div key={`top-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
                    ))}

                    {items.map((item) => {
                        const selected = item === value
                        return (
                            <div
                                key={item}
                                role="option"
                                aria-selected={selected}
                                className={`flex snap-center items-center justify-center font-display transition-all duration-150 ${
                                    selected
                                        ? 'scale-100 text-[28px] font-bold text-content-primary'
                                        : 'scale-90 text-xl text-content-muted/40'
                                }`}
                                style={{ height: ITEM_HEIGHT }}
                            >
                                {format(item)}
                            </div>
                        )
                    })}

                    {Array.from({ length: padding }).map((_, i) => (
                        <div key={`bottom-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
                    ))}
                </div>
            </div>
        </div>
    )
}
