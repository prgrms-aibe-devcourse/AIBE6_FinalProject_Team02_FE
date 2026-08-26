import type { IllustrationHandoff, IllustrationPurpose } from './types'

const KEY = 'catcheat:illustration-handoff'

/**
 * 채택한 결과를 원래 화면으로 넘긴다.
 *
 * 라우트를 건너 공유되는 상태는 보통 `useAppState`를 쓰지만 여기는 sessionStorage다 —
 * 일러스트 화면은 **네 자리가 공유**하고, 그 중 챌린짓 개설은 draft가 이미 자기 모양을
 * 갖고 있어서 provider에 자리를 하나 더 파면 자리마다 필드가 늘어난다.
 * 한 번 읽고 버리는 값이라 수명도 provider보다 짧다.
 */
export function putIllustrationHandoff(handoff: IllustrationHandoff) {
    if (typeof window === 'undefined') return
    window.sessionStorage.setItem(KEY, JSON.stringify(handoff))
}

/**
 * 꺼내면서 지운다. 남겨 두면 다음에 같은 화면에 들어왔을 때
 * 만들지도 않은 그림이 이미 걸려 있는 것처럼 보인다.
 */
export function takeIllustrationHandoff(purpose: IllustrationPurpose): IllustrationHandoff | null {
    if (typeof window === 'undefined') return null
    const raw = window.sessionStorage.getItem(KEY)
    if (!raw) return null

    try {
        const parsed = JSON.parse(raw) as IllustrationHandoff
        // 자리가 다르면 남의 결과다. 지우지 않고 그대로 둔다
        if (parsed.purpose !== purpose) return null
        window.sessionStorage.removeItem(KEY)
        return parsed
    } catch {
        window.sessionStorage.removeItem(KEY)
        return null
    }
}
