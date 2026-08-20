'use client'

import { CrayonProgress } from './CrayonProgress'
import { IllustrationOrb } from './IllustrationOrb'

/** 서버 평균이 20초다. 이보다 길어지면 "왜 안 끝나지"가 시작된다 */
const EXPECTED_SEC = 20

interface Props {
    elapsedSec: number
}

/**
 * 그리는 동안의 화면.
 *
 * 남은 시간을 숫자로 약속하지 않는다 — 서버가 20초 안팎이지만 편차가 있어,
 * "5초 남음"이 0에서 멈추면 진행이 멎은 것처럼 보인다. 대신 흘러간 시간을 세고
 * 예상보다 길어지면 문구로만 알린다.
 */
export function GeneratingView({ elapsedSec }: Props) {
    const overdue = elapsedSec > EXPECTED_SEC

    return (
        <div role="status" aria-live="polite" aria-busy className="flex flex-col items-center justify-center py-10">
            <IllustrationOrb busy className="h-44 w-44" />

            <p className="mt-8 font-display text-xl text-content-primary">크레파스로 그리는 중…</p>
            <p className="mt-2 text-sm text-content-muted">
                {overdue ? '조금만 더 기다려 주세요' : '열심히 그리는 중이에요!'}
            </p>

            {/* 숫자 대신 크레용이 나아간다. 멈추지 않았다는 신호는 같지만 초를 약속하지 않는다 */}
            <div className="mt-4 w-full">
                <CrayonProgress elapsedSec={elapsedSec} />
            </div>
        </div>
    )
}
