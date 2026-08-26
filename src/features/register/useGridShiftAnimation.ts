'use client'

import { useLayoutEffect, useRef } from 'react'

/**
 * 격자에서 칸의 자리가 바뀌면 옛 위치에서 새 위치로 미끄러뜨린다 (FLIP).
 *
 * 격자 재배치는 CSS `transition`이 잡지 못한다 — `grid`가 자식을 다시 놓는 것은
 * 트랜지션할 수 있는 속성 변화가 아니다. 그래서 **바뀌기 전 자리를 기억했다가,
 * 바뀐 뒤에 옛 자리로 되돌리는 transform을 걸고 그것을 0으로 푸는** 방식으로 만든다.
 *
 * 위치는 `offsetLeft/offsetTop`으로 잰다. `getBoundingClientRect`는 스크롤을 타서,
 * 사용자가 화면을 굴리기만 해도 전부 자리가 바뀐 것으로 읽힌다.
 */

const DURATION_MS = 220
const EASING = 'cubic-bezier(0.2, 0, 0, 1)'

/**
 * @param orderSignature 자리 순서를 나타내는 값. 이게 바뀔 때만 다시 잰다
 */
export function useGridShiftAnimation(orderSignature: string) {
    const gridRef = useRef<HTMLDivElement>(null)
    const lastPositions = useRef(new Map<string, { left: number; top: number }>())

    useLayoutEffect(() => {
        const grid = gridRef.current
        if (!grid) return

        const cells = Array.from(grid.querySelectorAll<HTMLElement>('[data-photo-id]'))
        const next = new Map<string, { left: number; top: number }>()

        for (const cell of cells) {
            const id = cell.dataset.photoId
            if (!id) continue

            const position = { left: cell.offsetLeft, top: cell.offsetTop }
            next.set(id, position)

            const previous = lastPositions.current.get(id)
            if (!previous) continue

            const dx = previous.left - position.left
            const dy = previous.top - position.top
            if (dx === 0 && dy === 0) continue

            // 끌고 있는 칸은 손가락을 따라가는 중이라 건드리지 않는다.
            // 여기서 또 옮기면 손가락과 어긋난 자리로 튄다.
            // 손을 뗀 직후(settling)도 마찬가지 — 그 칸은 손가락이 있던 곳에서 제 칸으로
            // 들어가는 중이고, 그 미끄러짐은 끌기 훅이 이미 걸어 두었다
            if (cell.dataset.dragging || cell.dataset.settling) continue

            cell.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }], {
                duration: DURATION_MS,
                easing: EASING,
            })
        }

        lastPositions.current = next
    }, [orderSignature])

    return gridRef
}
