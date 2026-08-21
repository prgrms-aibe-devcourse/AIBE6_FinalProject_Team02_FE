import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'
import { BottomSheet } from '@/shared/ui'

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

    /**
     * 분 휠이 한 바퀴 돌면 시를 그만큼 옮긴다. 3시 59분에서 더 굴리면 4시 0분이 된다.
     *
     * 24시로 바꿔 계산하는 이유는 오전/오후가 같이 넘어가야 하기 때문이다 —
     * 11시 59분 오전 다음은 12시 0분 **오후**다.
     */
    const shiftHour = (carry: number) => {
        const base = hour % 12
        const hour24 = meridiem === '오후' ? base + 12 : base
        const next = (((hour24 + carry) % 24) + 24) % 24
        setMeridiem(next >= 12 ? '오후' : '오전')
        setHour(next % 12 === 0 ? 12 : next % 12)
    }

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
                            loop
                        />

                        <span className="relative z-20 shrink-0 font-display text-2xl text-content-primary">:</span>

                        <WheelPicker
                            items={MINUTES}
                            value={minute}
                            onChange={setMinute}
                            format={(v) => String(v).padStart(2, '0')}
                            label="분"
                            loop
                            onWrap={shiftHour}
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
/** 손을 뗀 뒤 이만큼 조용하면 고른 것으로 본다 */
const SETTLE_MS = 80
/** smooth 스크롤이 목표에 닿기까지 기다려 주는 최대 시간. 안 닿아도 휠이 굳지 않게 푼다 */
const PROGRAMMATIC_MAX_MS = 600

/**
 * 순환 휠이 들고 있을 칸의 최소 개수.
 *
 * 벌 수를 고정하면 짧은 목록이 위험하다 — 시(12칸)는 한 벌이 576px뿐이라
 * 다섯 벌이어도 한 번 세게 튕기면 끝에 닿는다. 목록 길이에 맞춰 벌 수를 정한다.
 */
const LOOP_MIN_ITEMS = 300

interface WheelPickerProps<T extends number> {
    items: T[]
    value: T
    onChange: (value: T) => void
    format: (value: T) => string
    label: string
    /** 끝에서 멈추지 않고 처음으로 이어진다 */
    loop?: boolean
    /** 한 바퀴 넘어갔을 때. +1은 앞으로 한 바퀴, -1은 뒤로 한 바퀴 */
    onWrap?: (carry: number) => void
}

function WheelPicker<T extends number>({
    items,
    value,
    onChange,
    format,
    label,
    loop = false,
    onWrap,
}: WheelPickerProps<T>) {
    const listRef = useRef<HTMLDivElement>(null)
    const settling = useRef<ReturnType<typeof setTimeout> | null>(null)

    /**
     * 우리가 만든 스크롤의 목표 위치. 여기 닿기 전까지의 스크롤 이벤트는 사용자 입력이 아니다.
     * 시간으로 억제하면(rAF 한 프레임) smooth 애니메이션이 여러 프레임에 걸쳐 진행되는 동안
     * 이벤트가 새어 들어와 정착이 다시 시작된다.
     */
    const target = useRef<number | null>(null)
    const targetTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    /** 방금 내가 올린 값. 부모가 그대로 돌려줄 때 스크롤을 다시 건드리지 않으려고 들고 있다 */
    const emitted = useRef<T | null>(null)

    const padding = Math.floor(VISIBLE_COUNT / 2)

    /** 가운데 벌이 있으려면 홀수여야 한다 */
    const loopCopies = useMemo(() => {
        if (!loop) return 1
        const needed = Math.ceil(LOOP_MIN_ITEMS / items.length)
        return needed % 2 === 0 ? needed + 1 : needed
    }, [items.length, loop])
    const loopMiddle = Math.floor(loopCopies / 2)

    /** 화면에 실제로 까는 목록. 순환이면 같은 목록을 여러 벌 이어 붙인다 */
    const rendered = useMemo(
        () => (loop ? Array.from({ length: loopCopies }, () => items).flat() : items),
        [items, loop, loopCopies],
    )
    /** 값 하나가 놓일 기준 자리. 순환이면 가운데 벌의 그 자리다 */
    const baseIndex = useCallback(
        (item: T) => (loop ? loopMiddle * items.length : 0) + items.indexOf(item),
        [items, loop, loopMiddle],
    )

    /**
     * 지금 하이라이트 바 안에 있는 **자리**. 값이 아니라 자리로 들고 있어야 한다 —
     * 순환에서는 같은 숫자가 여러 벌에 있어서, 값으로 고르면 화면 밖 다른 벌이 굵어지고
     * 정작 바 안의 숫자는 회색으로 남는다.
     */
    const [centerIndex, setCenterIndex] = useState(() => baseIndex(value))

    /**
     * 바퀴 수를 셀 때 기준으로 삼는 벌.
     *
     * 이걸 두지 않으면 **같은 자리에서 정착이 두 번 일어날 때 carry가 두 번 셈해진다** —
     * 스냅 스크롤이 끝난 뒤 이벤트가 한 번 더 오는데, 그때 억제가 풀려 정착이 다시 돈다.
     * 12시 59분에서 한 칸 굴렸을 뿐인데 2시가 되던 원인이다.
     */
    const carryBase = useRef(loopMiddle)

    // 휠 두 개(시·분)가 같은 화면에 있어 id가 겹치면 안 된다
    const listId = useId()
    const optionId = (item: T) => `${listId}-${item}`

    const releaseTarget = () => {
        target.current = null
        if (targetTimer.current) {
            clearTimeout(targetTimer.current)
            targetTimer.current = null
        }
    }

    /**
     * 손을 대는 순간 가운데 벌로 조용히 되돌린다.
     *
     * 보이는 그림은 그대로다 — 다른 벌의 같은 숫자로 옮기는 것뿐이라 화면은 변하지 않는다.
     * 이렇게 해 두면 한 번의 손짓이 어느 쪽으로 얼마나 가든 끝에 닿지 않고,
     * 몇 바퀴를 돌았는지도 가운데를 기준으로 세면 된다.
     */
    const recenter = () => {
        const list = listRef.current
        if (!loop || !list) return
        const top = baseIndex(value) * ITEM_HEIGHT
        if (Math.abs(list.scrollTop - top) <= 1) return
        list.scrollTo({ top, behavior: 'instant' })
        setCenterIndex(baseIndex(value))
        carryBase.current = loopMiddle
    }

    const startInteraction = () => {
        releaseTarget()
        recenter()
    }

    const scrollToIndex = useCallback((index: number, smooth: boolean) => {
        const list = listRef.current
        if (!list) return

        const top = index * ITEM_HEIGHT
        // 이미 그 자리면 스크롤 이벤트가 나지 않는다. 억제를 걸어 두면 풀어 줄 계기가 없어
        // 사용자가 그다음에 굴리는 것까지 삼킨다
        if (Math.abs(list.scrollTop - top) <= 1) {
            releaseTarget()
            return
        }

        target.current = top
        if (targetTimer.current) clearTimeout(targetTimer.current)
        // 서브픽셀 때문에 목표에 정확히 닿지 않을 수 있다. 그때도 휠이 굳지 않게 풀어 준다
        targetTimer.current = setTimeout(() => {
            target.current = null
            targetTimer.current = null
        }, PROGRAMMATIC_MAX_MS)

        list.scrollTo({ top, behavior: smooth ? 'smooth' : 'instant' })
    }, [])

    useEffect(() => {
        // 내가 올린 값이 되돌아온 것이면 건드리지 않는다.
        // 정착 애니메이션 도중에 instant로 덮으면 화면이 튄다
        const mine = emitted.current !== null && emitted.current === value
        emitted.current = null
        if (mine) return

        if (items.indexOf(value) < 0) return
        scrollToIndex(baseIndex(value), false)
        setCenterIndex(baseIndex(value))
        carryBase.current = loopMiddle
        // baseIndex는 items·value에서 바로 나오는 값이라 따로 의존성에 두지 않는다
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [items, value, scrollToIndex])

    // 시트를 닫는 순간 타이머가 남아 있으면 사라진 휠에 대고 스크롤을 시킨다
    useEffect(() => {
        return () => {
            if (settling.current) clearTimeout(settling.current)
            if (targetTimer.current) clearTimeout(targetTimer.current)
        }
    }, [])

    /**
     * 키보드로 값을 옮긴다. 정착 경로와 같이 emitted를 세워 두므로
     * 부모가 값을 돌려줘도 effect가 스크롤을 다시 건드리지 않는다.
     */
    const move = (delta: number) => {
        const current = items.indexOf(value)
        if (current < 0) return

        const raw = current + delta
        const nextIndex = loop
            ? ((raw % items.length) + items.length) % items.length
            : Math.max(0, Math.min(raw, items.length - 1))
        if (nextIndex === current) return

        const picked = items[nextIndex]
        emitted.current = picked
        onChange(picked)
        if (loop) {
            const carry = Math.floor(raw / items.length)
            if (carry !== 0) onWrap?.(carry)
        }
        scrollToIndex(baseIndex(picked), true)
        setCenterIndex(baseIndex(picked))
        carryBase.current = loopMiddle
    }

    /** 휠은 스크롤로만 고를 수 있어서 키보드 사용자는 시간을 못 정한다. 방향키로 같은 일을 하게 한다 */
    const handleKeyDown = (event: React.KeyboardEvent) => {
        const step: Record<string, number> = {
            ArrowUp: -1,
            ArrowDown: 1,
            PageUp: -VISIBLE_COUNT,
            PageDown: VISIBLE_COUNT,
            Home: -items.length,
            End: items.length,
        }
        const delta = step[event.key]
        if (delta === undefined) return

        // 방향키가 시트 뒤 페이지를 굴리지 않게 막는다
        event.preventDefault()
        move(delta)
    }

    const handleScroll = useCallback(() => {
        const list = listRef.current
        if (!list) return

        if (target.current !== null) {
            // 목표에 닿았으면 이제부터는 사용자 스크롤이다
            if (Math.abs(list.scrollTop - target.current) <= 1) releaseTarget()
            return
        }

        if (settling.current) clearTimeout(settling.current)
        settling.current = setTimeout(() => {
            const settled = listRef.current
            if (!settled) return
            const rawIndex = Math.round(settled.scrollTop / ITEM_HEIGHT)
            const index = Math.max(0, Math.min(rawIndex, rendered.length - 1))
            const picked = rendered[index]

            if (loop) {
                // 마지막으로 센 벌과 견준다. 센 뒤에는 기준을 옮겨, 같은 자리에서
                // 정착이 다시 일어나도 0이 나오게 한다
                const copy = Math.floor(index / items.length)
                const carry = copy - carryBase.current
                carryBase.current = copy
                if (carry !== 0) onWrap?.(carry)
            }

            if (picked !== value) {
                emitted.current = picked
                onChange(picked)
            } else {
                emitted.current = null
            }
            scrollToIndex(index, true)
            setCenterIndex(index)
        }, SETTLE_MS)
    }, [items, rendered, loop, onWrap, value, onChange, scrollToIndex])

    return (
        <div className="relative" style={{ width: 72 }}>
            <div className="relative overflow-hidden" style={{ height: WHEEL_HEIGHT }}>
                {/* 위아래 페이드 */}
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-gradient-to-b from-surface-app to-transparent"
                    style={{ height: ITEM_HEIGHT * 1.5 }}
                />
                <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-surface-app to-transparent"
                    style={{ height: ITEM_HEIGHT * 1.5 }}
                />

                <div
                    ref={listRef}
                    onScroll={handleScroll}
                    // 사용자가 손을 대면 우리가 만들던 스크롤은 포기한다. 그래야 억제가 입력을 삼키지 않는다
                    onPointerDown={startInteraction}
                    onWheel={startInteraction}
                    onTouchStart={startInteraction}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                    className="no-scrollbar h-full snap-y snap-mandatory overflow-y-auto outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-action-primary"
                    role="listbox"
                    aria-label={label}
                    aria-activedescendant={optionId(value)}
                >
                    {Array.from({ length: padding }).map((_, i) => (
                        <div key={`top-${i}`} style={{ height: ITEM_HEIGHT }} aria-hidden />
                    ))}

                    {rendered.map((item, index) => {
                        const selected = loop ? index === centerIndex : item === value
                        return (
                            <div
                                key={`${index}-${item}`}
                                // 같은 숫자가 여러 벌 있으므로 id는 가운데 벌 것만 준다.
                                // aria-activedescendant가 가리킬 자리가 하나여야 한다
                                id={selected ? optionId(item) : undefined}
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
