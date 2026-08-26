'use client'

import { motion, useReducedMotion } from 'framer-motion'

interface Props {
    /** 생성 중에는 더 크게 부풀었다 줄어든다. 기다리는 동안 화면이 멈춰 보이지 않게 */
    busy?: boolean
    className?: string
}

/**
 * 화면 한가운데 뜨는 비눗방울.
 *
 * 서비스에서 유일하게 "AI가 그린 것"을 대표하는 그림이라 아이콘이 아니라 실제 자산을 쓴다 —
 * 크레파스 질감이 곧 이 기능의 결과물이 어떤 모양인지에 대한 예고가 된다.
 */
export function IllustrationOrb({ busy = false, className = '' }: Props) {
    // 크게 움직이는 요소라 감속 설정을 켠 사용자에게는 정지시킨다
    const reduced = useReducedMotion()

    return (
        <motion.img
            src="/images/ai_illustrate.png"
            alt=""
            aria-hidden
            draggable={false}
            className={`select-none object-contain ${className}`}
            animate={
                reduced
                    ? undefined
                    : busy
                      ? { scale: [1, 1.08, 1], rotate: [0, 4, -3, 0], y: [0, -10, 0] }
                      : { scale: [1, 1.02, 1], y: [0, -6, 0] }
            }
            transition={{
                duration: busy ? 2.4 : 4,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    )
}
