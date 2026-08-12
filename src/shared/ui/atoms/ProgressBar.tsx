'use client'

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface ProgressBarProps {
    value: number // 0..1
    className?: string
    animate?: boolean
    /** 스크린리더용 설명. 예: "기본 도감 수집률" */
    label?: string
    /**
     * 채움 색. **기본이 초록(`point`)이다.**
     *
     * 진행·달성·수집은 §1.1의 구분에서 "된 것"이라 초록을 쓴다. 예전 기본값은
     * 핑크였는데, 화면이 온통 핑크여서 바가 어디까지 찼는지 눈에 잘 안 들어왔다.
     * 핑크로 되돌려야 할 자리(주 액션의 일부로 보여야 할 때)만 `primary`를 준다
     */
    tone?: 'point' | 'primary'
}

/**
 * §3.2 진행률 바. 기본 도감·챌린지 도감 전용.
 * 제작 도감에서는 사용 금지 (§6).
 */
export function ProgressBar({ value, className = '', animate = true, label, tone = 'point' }: ProgressBarProps) {
    const reduceMotion = useReducedMotion()
    const ratio = Math.max(0, Math.min(1, value))
    const pct = ratio * 100
    const shouldAnimate = animate && !reduceMotion
    const fillClass = tone === 'primary' ? 'bg-action-primary' : 'bg-rind-500'

    return (
        <div
            role="progressbar"
            aria-label={label ?? '진행률'}
            aria-valuenow={Math.round(pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className={`h-2 w-full overflow-hidden rounded-full bg-neutral-200 ${className}`}
        >
            <motion.div
                className={`h-full rounded-full ${fillClass}`}
                initial={shouldAnimate ? { width: 0 } : false}
                animate={{ width: `${pct}%` }}
                transition={shouldAnimate ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
            />
        </div>
    )
}
