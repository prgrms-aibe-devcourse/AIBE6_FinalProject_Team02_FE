'use client'

import { ArrowDownIcon } from 'lucide-react'

interface Props {
    /** 원본 사진 미리보기. 설명만으로 만든 뱃지에는 없다 */
    sourcePreview: string | null
    resultUrl: string
}

/**
 * 원본과 결과를 위아래로 나란히 둔다.
 *
 * 변환본만 크게 보여 주면 **무엇이 달라졌는지 판단할 근거가 없다.** 채택할지,
 * 어떤 수정을 걸지는 원본과 견줘야 정해진다. 수정을 반복할 때도 기준이 남는다.
 *
 * 이력은 쌓지 않는다 — 세로로 길어지면 채택 버튼이 여러 개가 되어
 * 무엇을 고르는 중인지 흐려진다. 최신 결과 하나만 둔다.
 */
export function ResultView({ sourcePreview, resultUrl }: Props) {
    return (
        <div className="flex flex-col items-center gap-3 py-4">
            {sourcePreview && (
                <>
                    <figure className="w-full max-w-[15rem]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={sourcePreview}
                            alt="올린 원본 사진"
                            className="aspect-square w-full rounded-2xl object-cover"
                        />
                        <figcaption className="mt-1.5 text-center text-xs text-content-muted">올린 사진</figcaption>
                    </figure>

                    <ArrowDownIcon size={20} aria-hidden className="text-content-muted" />
                </>
            )}

            <figure className="w-full max-w-[15rem]">
                {/*
                 * 결과는 배경이 투명한 PNG다. 흰 면 위에 얹어야 크레파스 선이 제 색으로 보인다 —
                 * 회색 면에 두면 종이가 아니라 화면에 그린 것처럼 읽힌다
                 */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={resultUrl}
                    alt="AI가 그린 일러스트"
                    className="aspect-square w-full rounded-2xl bg-surface-card object-contain shadow-card"
                />
                <figcaption className="mt-1.5 text-center text-xs font-bold text-content-link">
                    AI가 그린 그림
                </figcaption>
            </figure>
        </div>
    )
}
