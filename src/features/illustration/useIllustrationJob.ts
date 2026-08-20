'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { findIllustrationJob } from './api'
import type { IllustrationJob } from './types'

/** 서버 평균이 20초다. 더 촘촘히 물어도 얻는 게 없고 요청만 늘어난다 */
const POLL_INTERVAL_MS = 3000

/**
 * 서버도 90초가 넘은 `GENERATING`을 방치 작업으로 판정한다.
 * 화면이 더 오래 기다리면 서버는 이미 실패로 본 것을 계속 묻게 된다.
 */
const POLL_TIMEOUT_MS = 90_000

/** 경과 시간 표시용. 진행 표시가 멈춰 보이지 않을 정도면 충분하다 */
const TICK_MS = 1000

interface UseIllustrationJob {
    job: IllustrationJob | null
    /** 통신 자체가 실패했을 때. 작업이 `FAILED`로 끝난 것과는 다르다 */
    error: string | null
    /** 지금 작업이 도는 중인지. 폴링이 살아 있는 동안 true */
    generating: boolean
    elapsedSec: number
    /** 생성·수정 요청이 돌려준 작업을 넘긴다. 이미 끝난 작업이면 폴링하지 않는다 */
    watch: (job: IllustrationJob) => void
    reset: () => void
}

/**
 * 작업 하나를 끝까지 지켜본다.
 *
 * `watch`로 넘긴 작업이 `GENERATING`이면 3초마다 조회하고, 상태가 바뀌거나
 * 90초가 지나면 스스로 멈춘다. **화면을 떠나면 타이머를 반드시 정리한다** —
 * 남겨 두면 언마운트된 컴포넌트에 setState가 걸린다.
 */
export function useIllustrationJob(): UseIllustrationJob {
    const [job, setJob] = useState<IllustrationJob | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [generating, setGenerating] = useState(false)
    const [elapsedSec, setElapsedSec] = useState(0)

    /**
     * 지금 유효한 회차. 수정을 연달아 누르면 앞 회차의 응답이 뒤늦게 와서
     * 새 작업 위에 옛 결과를 덮어쓴다 — 회차가 다르면 버린다.
     */
    const runRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const clearTimers = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current)
        if (tickRef.current) clearInterval(tickRef.current)
        timerRef.current = null
        tickRef.current = null
    }, [])

    /** 어떤 경로로 끝나든 타이머부터 멈춘다 */
    const stop = useCallback(() => {
        runRef.current += 1
        clearTimers()
        setGenerating(false)
    }, [clearTimers])

    const watch = useCallback(
        (initial: IllustrationJob) => {
            runRef.current += 1
            const run = runRef.current
            clearTimers()
            setJob(initial)
            setError(null)
            setElapsedSec(0)

            if (initial.status !== 'GENERATING') {
                setGenerating(false)
                return
            }
            setGenerating(true)

            const startedAt = Date.now()
            tickRef.current = setInterval(() => {
                if (runRef.current !== run) return
                setElapsedSec(Math.floor((Date.now() - startedAt) / 1000))
            }, TICK_MS)

            const poll = async () => {
                if (runRef.current !== run) return
                try {
                    const next = await findIllustrationJob(initial.jobId)
                    if (runRef.current !== run) return
                    setJob(next)
                    if (next.status !== 'GENERATING') {
                        clearTimers()
                        setGenerating(false)
                        return
                    }
                } catch (e) {
                    if (runRef.current !== run) return
                    // 한 번 실패했다고 그만두지 않는다. 순간적인 끊김이면 다음 회차에 이어진다
                    setError(e instanceof Error ? e.message : '상태를 확인하지 못했어요')
                }
                if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
                    clearTimers()
                    setGenerating(false)
                    setError('시간이 너무 오래 걸려요. 잠시 뒤 다시 시도해 주세요')
                    return
                }
                timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
            }

            timerRef.current = setTimeout(poll, POLL_INTERVAL_MS)
        },
        [clearTimers],
    )

    const reset = useCallback(() => {
        stop()
        setJob(null)
        setError(null)
        setElapsedSec(0)
    }, [stop])

    useEffect(() => stop, [stop])

    return { job, error, generating, elapsedSec, watch, reset }
}
