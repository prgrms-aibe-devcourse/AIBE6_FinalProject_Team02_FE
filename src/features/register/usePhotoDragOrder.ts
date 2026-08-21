'use client'

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/**
 * 격자에서 사진을 끌어 순서를 바꾼다. 인스타그램 사진 편집기와 같은 방식이다.
 *
 * **길게 눌러야 끌기가 시작된다.** 바로 끌리게 하면 세로 스크롤과 다툰다 —
 * 사진을 넘기려던 손짓이 순서 변경이 되어 버린다.
 *
 * 끄는 동안 `previewKeys`가 바뀌고, 화면은 그 순서대로 칸을 다시 그린다.
 * 4번째를 2번으로 끌면 원래 2·3번이 뒤로 밀린다.
 *
 * ## 손짓마다 리렌더하지 않는다
 *
 * 따라다니는 위치를 state로 두면 pointermove마다(초당 60~120회) 격자 전체가 다시 그려져
 * 다른 칸들이 끊기며 움직인다. 위치는 **끌리는 칸의 DOM에 직접 쓰고**, 그 계산과 자리 판정을
 * 한 프레임에 한 번으로 묶는다. state가 바뀌는 것은 순서가 실제로 달라지는 순간뿐이다.
 *
 * ## 손짓은 격자가 아니라 문서에서 듣는다
 *
 * 격자에 pointermove/up을 걸면 손가락이 격자 밖으로 나간 순간(맨 윗줄 위, 화면 옆)
 * 소식이 끊겨 사진이 그 자리에 얼어붙는다. 누른 동안만 document에서 듣고, 손을 떼면 걷는다.
 */

/** 이만큼 누르고 있어야 끌기로 본다 */
const LONG_PRESS_MS = 400

/** 이보다 많이 움직이면 스크롤로 보고 끌기를 시작하지 않는다 */
const SLOP_PX = 8

/** 손을 떼고 제 칸으로 미끄러져 들어가는 시간 */
const SETTLE_MS = 200

interface Options {
    /** 지금 순서. 이 배열의 자리가 곧 카드에 실리는 순서다 */
    orderedKeys: string[]
    onReorder: (fromOrder: number, toOrder: number) => void
}

/**
 * 요소의 **배치 좌표** — transform이 없다면 이 요소가 있을 화면 위치.
 *
 * 화면에 실제로 보이는 위치(`getBoundingClientRect`)를 쓸 수 없다. 끌리는 칸에는 우리가 건
 * transform이 있고, 자리를 옮기는 중인 칸에는 FLIP 애니메이션이 걸려 있는데
 * **`Element.animate`는 인라인 style을 이긴다** — 미끄러지는 중인 칸을 잡으면 rect가
 * 애니메이션 값을 되돌려 계산이 어긋난다(관측됨).
 *
 * `offsetLeft/offsetTop`은 transform을 타지 않는다. 다만 기준이 부모가 아니라
 * **offsetParent**여서, 격자에 position이 없으면 훨씬 바깥(`.app-shell-content`)이 기준이 된다 —
 * 그걸 부모로 착각해 격자 위치를 더한 것이 사진이 머리글 위로 떠오른 원인이었다.
 */
function layoutOf(element: HTMLElement) {
    const base = element.offsetParent as HTMLElement | null
    if (!base) return { left: element.offsetLeft - window.scrollX, top: element.offsetTop - window.scrollY }
    const rect = base.getBoundingClientRect()
    // clientLeft/Top은 테두리 두께다. offsetLeft는 테두리 안쪽(패딩 상자)에서부터 재기 때문에 더한다
    return {
        left: rect.left + base.clientLeft - base.scrollLeft + element.offsetLeft,
        top: rect.top + base.clientTop - base.scrollTop + element.offsetTop,
    }
}

export function usePhotoDragOrder({ orderedKeys, onReorder }: Options) {
    const [draggingKey, setDraggingKey] = useState<string | null>(null)
    const [overOrder, setOverOrder] = useState<number | null>(null)

    /**
     * 문서 리스너와 프레임은 렌더 밖에서 돌아 만들어질 때의 값에 갇힌다.
     * 그 안에서 읽어야 하는 것은 전부 ref로 둔다
     */
    const latest = useRef({ orderedKeys, onReorder })
    latest.current = { orderedKeys, onReorder }

    /** 지금 끌고 있는 사진. state와 같은 값이지만 리스너가 리렌더를 기다리지 않고 읽는다 */
    const activeKey = useRef<string | null>(null)
    const activeOver = useRef<number | null>(null)

    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const start = useRef({ x: 0, y: 0 })
    /** 끌어서 놓은 직후 따라오는 click을 한 번 먹는다 */
    const swallowClick = useRef(false)

    /** 지금 끌고 있는 칸. 여기에 transform을 직접 쓴다 */
    const dragCell = useRef<HTMLElement | null>(null)
    /** 칸 안에서 손가락이 잡은 지점. 이걸 빼야 사진이 손가락에 붙어 있다 */
    const grab = useRef({ x: 0, y: 0 })
    /** 마지막 손가락 위치. 프레임에서 읽는다 */
    const pointer = useRef({ x: 0, y: 0 })
    const frame = useRef<number | null>(null)
    /** 누른 동안 걸어 둔 문서 리스너를 걷는다 */
    const detach = useRef<(() => void) | null>(null)

    const reset = useCallback(() => {
        if (timer.current) {
            clearTimeout(timer.current)
            timer.current = null
        }
        if (frame.current != null) {
            cancelAnimationFrame(frame.current)
            frame.current = null
        }
        detach.current?.()
        detach.current = null

        const cell = dragCell.current
        if (cell && cell.style.transform) {
            /*
             * 인라인 transform을 그냥 지우면 사진이 손가락 자리에서 제 칸으로 **순간이동**한다.
             * 클래스의 transition은 이 다음 렌더에서야 붙어 이 변화를 잡지 못한다.
             * 그래서 transition을 인라인으로 먼저 걸고 같은 프레임에 transform을 푼다
             */
            cell.style.transition = `transform ${SETTLE_MS}ms ease-out`
            cell.style.transform = ''
            /*
             * 이 칸만은 FLIP(useGridShiftAnimation)에서 빼 둔다. 순서가 바뀌었으면 이 칸도
             * 자리가 달라져 FLIP이 '옛 자리 → 새 자리'로 잡는데, 그러면 방금 걸어 둔
             * 미끄러짐을 덮어써 사진이 손가락 자리에서 옛 칸으로 한 번 튄 뒤 움직인다.
             * 이 칸의 출발점은 격자의 옛 자리가 아니라 **손가락이 있던 곳**이다
             */
            cell.dataset.settling = 'true'
            const settled = () => {
                cell.style.transition = ''
                delete cell.dataset.settling
            }
            cell.addEventListener('transitionend', settled, { once: true })
            // 탭이 가려져 transitionend가 오지 않아도 표시가 남으면 그 칸은 이후로 FLIP을 못 받는다
            setTimeout(settled, SETTLE_MS + 50)
        } else if (cell) {
            cell.style.transition = ''
            cell.style.transform = ''
        }
        dragCell.current = null
        activeKey.current = null
        activeOver.current = null
        setDraggingKey(null)
        setOverOrder(null)
    }, [])

    // 화면을 떠나도 타이머·프레임·문서 리스너는 남는다. 그대로 두면 없는 UI에 대고 일한다
    useEffect(() => reset, [reset])

    /** 끌리는 칸을 손가락 자리에 붙인다 */
    const follow = useCallback(() => {
        const cell = dragCell.current
        if (!cell) return

        const { x, y } = pointer.current
        const layout = layoutOf(cell)
        cell.style.transform = `translate(${x - grab.current.x - layout.left}px, ${y - grab.current.y - layout.top}px)`
    }, [])

    /** 따라다니기와 자리 판정을 한 프레임에 묶는다. 레이아웃을 읽는 일이 둘 다라 나누면 두 배로 든다 */
    const runFrame = useCallback(() => {
        frame.current = null
        const cell = dragCell.current
        const grid = cell?.parentElement
        if (!cell || !grid) return
        follow()

        const { x, y } = pointer.current

        /*
         * 어느 자리 위에 왔는지도 **배치 좌표**로 잰다(`layoutOf`). `elementFromPoint`로 잡으면
         * 화면에 보이는 위치를 보기 때문에, 옛 자리에서 새 자리로 미끄러지는 중인 칸
         * (useGridShiftAnimation)이 아직 옛 자리를 덮고 있어 그 칸이 잡힌다 —
         * 순서가 한 번 튀었다가 되돌아오는 것이 관측됐다
         */
        // 빼 놓은 사진에는 이 표식이 없다. 순서가 없어 끼울 자리도 아니다
        for (const slot of grid.querySelectorAll<HTMLElement>('[data-order-index]')) {
            const { left, top } = layoutOf(slot)
            if (x < left || x > left + slot.offsetWidth) continue
            if (y < top || y > top + slot.offsetHeight) continue

            // 칸 사이 여백이나 격자 밖이면 아무 자리도 안 잡힌다 — 마지막 판정을 그대로 둔다
            const next = Number(slot.dataset.orderIndex)
            if (activeOver.current !== next) {
                activeOver.current = next
                setOverOrder(next)
            }
            return
        }
    }, [follow])

    const onPointerDown = useCallback(
        (event: React.PointerEvent, key: string) => {
            // 왼쪽 버튼(과 손가락·펜)만 끈다
            if (event.button !== 0) return
            // 앞선 손짓이 어떤 이유로든 안 끝났으면 여기서 정리한다
            reset()

            start.current = { x: event.clientX, y: event.clientY }
            // 순서가 없는(빼 놓은) 사진은 끌 대상이 아니다
            if (!orderedKeys.includes(key) || orderedKeys.length < 2) return

            const cell = (event.currentTarget as HTMLElement).closest<HTMLElement>('[data-photo-id]')
            if (!cell) return

            const { clientX, clientY, pointerId } = event

            const move = (moving: PointerEvent) => {
                if (moving.pointerId !== pointerId) return
                if (!activeKey.current) {
                    // 아직 끌기 전이면 조금만 움직여도 스크롤로 본다 — 리스너까지 걷는다
                    const dx = Math.abs(moving.clientX - start.current.x)
                    const dy = Math.abs(moving.clientY - start.current.y)
                    if (dx > SLOP_PX || dy > SLOP_PX) reset()
                    return
                }
                pointer.current = { x: moving.clientX, y: moving.clientY }
                if (frame.current == null) frame.current = requestAnimationFrame(runFrame)
            }

            const up = (ending: PointerEvent) => {
                if (ending.pointerId !== pointerId) return
                const dragged = activeKey.current
                if (dragged) {
                    /*
                     * 끌었으면 뒤따르는 click은 먹는다. **자리가 그대로여도** 먹는다 —
                     * 예전에는 순서가 바뀔 때만 먹어서, 끌다가 제자리에 놓으면
                     * 그게 탭으로 읽혀 사진이 선택에서 빠졌다
                     */
                    swallowClick.current = true
                    const from = latest.current.orderedKeys.indexOf(dragged)
                    const to = activeOver.current
                    if (to != null && from >= 0 && from !== to) latest.current.onReorder(from, to)
                }
                reset()
            }

            const cancel = (aborted: PointerEvent) => {
                if (aborted.pointerId !== pointerId) return
                reset()
            }

            /*
             * 사진에 `touch-action: none`을 걸면 스크롤은 확실히 막히지만 **사진 위에서는
             * 화면을 굴릴 수도 없다.** 격자가 화면 폭을 다 쓰니 그건 굴릴 자리가 없다는 뜻이다.
             * 그래서 굴리기는 열어 두고, 끌기가 시작된 뒤에만 passive:false로 막는다
             */
            const block = (touching: TouchEvent) => {
                if (activeKey.current) touching.preventDefault()
            }
            // 길게 누르면 뜨는 확대·저장 메뉴가 끌기를 가로챈다
            const blockMenu = (menu: Event) => menu.preventDefault()

            document.addEventListener('pointermove', move)
            document.addEventListener('pointerup', up)
            document.addEventListener('pointercancel', cancel)
            document.addEventListener('touchmove', block, { passive: false })
            document.addEventListener('contextmenu', blockMenu)
            detach.current = () => {
                document.removeEventListener('pointermove', move)
                document.removeEventListener('pointerup', up)
                document.removeEventListener('pointercancel', cancel)
                document.removeEventListener('touchmove', block)
                document.removeEventListener('contextmenu', blockMenu)
            }

            timer.current = setTimeout(() => {
                timer.current = null
                // 앞선 손짓의 미끄러짐이 아직 남아 있을 수 있다. 그대로 두면
                // FLIP 애니메이션이 우리가 걸 인라인 transform을 계속 이긴다
                for (const running of cell.getAnimations()) running.cancel()
                cell.style.transition = ''
                cell.style.transform = ''
                delete cell.dataset.settling

                /*
                 * 잡은 점은 칸 안으로 묶는다. 누른 순간 이 칸이 미끄러지는 중이었다면
                 * 화면에서 보인 자리와 배치 자리가 달라 잡은 점이 칸 밖으로 나갈 수 있고,
                 * 그러면 사진이 손가락에서 떨어진 채로 끌린다
                 */
                const layout = layoutOf(cell)
                grab.current = {
                    x: Math.min(Math.max(clientX - layout.left, 0), cell.offsetWidth),
                    y: Math.min(Math.max(clientY - layout.top, 0), cell.offsetHeight),
                }
                pointer.current = { x: clientX, y: clientY }
                dragCell.current = cell

                const at = latest.current.orderedKeys.indexOf(key)
                activeKey.current = key
                activeOver.current = at
                setDraggingKey(key)
                setOverOrder(at)
                if (navigator.vibrate) navigator.vibrate(30)
            }, LONG_PRESS_MS)
        },
        [orderedKeys, reset, runFrame],
    )

    /** 끌기 직후의 click인지. 한 번 물으면 소진된다 */
    const consumeClick = useCallback(() => {
        if (!swallowClick.current) return false
        swallowClick.current = false
        return true
    }, [])

    /**
     * 끄는 동안 보여 줄 순서. 화면은 이 순서대로 칸을 그린다.
     * 놓기 전까지 실제 상태(`orderedKeys`)는 건드리지 않는다 — 취소하면 그대로 돌아간다.
     */
    let previewKeys = orderedKeys
    if (draggingKey && overOrder != null) {
        const from = orderedKeys.indexOf(draggingKey)
        if (from >= 0 && from !== overOrder) {
            previewKeys = [...orderedKeys]
            const [moved] = previewKeys.splice(from, 1)
            previewKeys.splice(overOrder, 0, moved)
        }
    }

    /*
     * 순서가 바뀌면 이 칸은 격자의 **다른 자리**로 옮겨 간다. 걸어 둔 이동량은 옛 자리
     * 기준이라 그대로 그리면 사진이 한 프레임 동안 손가락에서 한 칸 떨어져 보인다(관측됨).
     * 그리기 전에(useLayoutEffect) 다시 붙여 그 한 프레임을 없앤다
     */
    const layoutSignature = previewKeys.join()
    useLayoutEffect(() => {
        if (dragCell.current) follow()
    }, [layoutSignature, follow])

    return { draggingKey, previewKeys, onPointerDown, consumeClick }
}
