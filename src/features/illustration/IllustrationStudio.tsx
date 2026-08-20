'use client'

import { useEffect, useState } from 'react'
import { AlertCircleIcon } from 'lucide-react'
import { AppScreen, Button, PageHeader, TextField, useToast } from '@/shared/ui'
import { uploadImageToS3 } from '@/shared/lib/upload'
import { createIllustrationJob, fetchRevisionPresets, reviseIllustrationJob } from './api'
import { GeneratingView } from './GeneratingView'
import { IllustrationOrb } from './IllustrationOrb'
import { putIllustrationHandoff } from './handoff'
import { ResultView } from './ResultView'
import { RevisionBar } from './RevisionBar'
import { SampleShowcase } from './SampleShowcase'
import { SourcePicker } from './SourcePicker'
import { useIllustrationJob } from './useIllustrationJob'
import type { IllustrationPurpose, RevisionPreset } from './types'

/** 서버 `IllustrationJob.MAX_REVISION_DEPTH`와 같은 값 */
const MAX_REVISION_DEPTH = 3

/** 서버 `IllustrationJob.DESCRIPTION_MAX` */
const DESCRIPTION_MAX = 200

const GREETING: Record<IllustrationPurpose, string> = {
    LOGIT_COVER: '로그잇 표지를\n크레파스 그림으로 만들어 드릴게요',
    CHALLENGE_COVER: '챌린짓 대표 그림을\n크레파스로 그려 드릴게요',
    CHALLENGE_SLOT: '이 음식을\n크레파스 그림으로 바꿔 드릴게요',
    BADGE: '완주 보상 뱃지를\n크레파스로 그려 드릴게요',
}

/**
 * 서버가 영구 실패로 분류한 것들. **여기에는 다시 시도 버튼을 내지 않는다** —
 * 같은 입력으로 다시 눌러도 결과가 같아서, 버튼이 있으면 될 때까지 누르게 된다.
 */
const REJECT_MESSAGE: Record<string, string> = {
    ILLUSTRATION_REJECTED: '이 사진으로는 그림을 만들 수 없어요. 다른 사진으로 해 볼까요?',
    PHOTO_NOT_UPLOADED: '사진을 찾지 못했어요. 다시 골라 주세요',
    IMAGE_DECODE_FAILED: '사진을 읽지 못했어요. 다른 사진으로 해 볼까요?',
    PHOTO_FORMAT_NOT_ANALYZABLE: 'JPG나 PNG 사진으로 다시 해 주세요',
    PHOTO_TOO_LARGE: '사진이 너무 커요. 10MB 아래로 줄여 주세요',
    INVALID_UPLOAD_FILE: '사진을 다시 골라 주세요',
}

interface Props {
    purpose: IllustrationPurpose
    /** 슬롯은 음식명이 자동으로 들어온다. 뱃지는 유저가 직접 적는다 */
    initialDescription: string
    /** 진입한 쪽의 표식. 읽지 않고 결과에 그대로 실어 돌려준다 */
    handoffRef?: string
    onDone: () => void
    onBack: () => void
}

export function IllustrationStudio({ purpose, initialDescription, handoffRef, onDone, onBack }: Props) {
    const toast = useToast()
    const { job, error, generating, elapsedSec, watch, reset } = useIllustrationJob()

    const [presets, setPresets] = useState<RevisionPreset[]>([])
    const [sourceFile, setSourceFile] = useState<File | null>(null)
    const [sourcePreview, setSourcePreview] = useState<string | null>(null)
    const [description, setDescription] = useState(initialDescription)
    const [busy, setBusy] = useState(false)

    /**
     * 프리셋은 서버가 들고 있다. 실패해도 화면을 막지 않는다 —
     * 칩이 없어도 자유 입력으로 수정할 수 있다.
     */
    useEffect(() => {
        fetchRevisionPresets()
            .then(setPresets)
            .catch(() => setPresets([]))
    }, [])

    /** `URL.createObjectURL`은 스스로 사라지지 않는다 */
    useEffect(() => {
        if (!sourcePreview) return
        return () => URL.revokeObjectURL(sourcePreview)
    }, [sourcePreview])

    useEffect(() => {
        if (error) toast.error(error)
    }, [error, toast])

    const start = async (file: File | null) => {
        if (busy) return
        setBusy(true)
        try {
            // 사진은 여기서 올린다. i2i는 서버가 S3에서 원본을 읽어야 시작할 수 있다
            const sourceImageKey = file ? (await uploadImageToS3(file, file.name, 'illustration')).key : undefined
            const created = await createIllustrationJob({
                purpose,
                mode: file ? 'STYLIZE' : 'GENERATE',
                sourceImageKey,
                description: description.trim() || undefined,
            })
            watch(created)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : '그림을 시작하지 못했어요')
        } finally {
            setBusy(false)
        }
    }

    const pick = (file: File) => {
        setSourceFile(file)
        setSourcePreview(URL.createObjectURL(file))
        void start(file)
    }

    const revise = async (input: { presets: string[]; freeText: string }) => {
        if (!job || busy) return
        setBusy(true)
        try {
            const next = await reviseIllustrationJob(job.jobId, {
                presets: input.presets,
                freeText: input.freeText || undefined,
            })
            watch(next)
        } catch (e) {
            toast.error(e instanceof Error ? e.message : '수정을 시작하지 못했어요')
        } finally {
            setBusy(false)
        }
    }

    const adopt = () => {
        if (!job?.imageKey || !job.previewUrl) return
        putIllustrationHandoff({ purpose, imageKey: job.imageKey, previewUrl: job.previewUrl, ref: handoffRef })
        onDone()
    }

    /** 사진을 바꿔 다시 시작한다. 결과와 원본을 같이 버려야 비교 화면이 어긋나지 않는다 */
    const retry = () => {
        reset()
        setSourceFile(null)
        setSourcePreview(null)
    }

    const status = job?.status
    const remaining = job ? MAX_REVISION_DEPTH - job.revisionDepth : MAX_REVISION_DEPTH
    // 뱃지만 사진 없이 만들 수 있다
    const canGenerateWithoutPhoto = purpose === 'BADGE' && description.trim().length > 0

    return (
        <AppScreen
            header={<PageHeader title="AI 일러스트" onBack={onBack} />}
            footer={
                status === 'DONE' ? (
                    <Button fullWidth onClick={adopt}>
                        이 그림 쓰기
                    </Button>
                ) : undefined
            }
            scroll={false}
        >
            <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5">
                {generating || busy ? (
                    <GeneratingView elapsedSec={elapsedSec} />
                ) : status === 'DONE' && job?.previewUrl ? (
                    <ResultView sourcePreview={sourcePreview} resultUrl={job.previewUrl} />
                ) : status === 'REJECTED' || status === 'FAILED' ? (
                    <FailureView
                        permanent={status === 'REJECTED'}
                        code={job?.failureCode ?? null}
                        onRetry={retry}
                        onResume={() => void start(sourceFile)}
                    />
                ) : (
                    <div className="flex flex-col items-center py-4">
                        <IllustrationOrb className="h-28 w-28" />
                        <h1 className="mt-6 whitespace-pre-line text-center font-display text-2xl leading-snug text-content-primary">
                            {GREETING[purpose]}
                        </h1>

                        {purpose === 'BADGE' && (
                            <div className="mt-6 w-full">
                                <TextField
                                    label="어떤 뱃지인가요? (선택)"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="예: 라멘 10그릇을 해치운 트로피"
                                    count={{ current: description.length, max: DESCRIPTION_MAX }}
                                    maxLength={DESCRIPTION_MAX}
                                />
                                <p className="mt-2 text-xs text-content-muted">사진 없이 설명만으로도 만들 수 있어요</p>
                            </div>
                        )}

                        <div className="mt-6 flex flex-col items-center gap-3">
                            <SourcePicker disabled={busy} onPick={pick} onReject={toast.error} />
                            {canGenerateWithoutPhoto && (
                                <Button variant="ghost" size="md" onClick={() => void start(null)}>
                                    설명만으로 그리기
                                </Button>
                            )}
                        </div>

                        {/* 뱃지는 사진 없이도 만들 수 있어 "어떤 사진이든" 이 그 화면의 주제가 아니다 */}
                        {purpose !== 'BADGE' && <SampleShowcase />}
                    </div>
                )}
            </main>

            {/* 수정 줄은 결과가 있을 때만. 그 전에는 고칠 대상이 없다 */}
            {status === 'DONE' && job?.canRevise && (
                <RevisionBar presets={presets} remaining={remaining} submitting={busy} onSubmit={revise} />
            )}
        </AppScreen>
    )
}

interface FailureProps {
    /** 서버가 영구 실패로 본 것. 같은 입력으로 다시 눌러도 결과가 같다 */
    permanent: boolean
    code: string | null
    onRetry: () => void
    onResume: () => void
}

function FailureView({ permanent, code, onRetry, onResume }: FailureProps) {
    const message =
        (code ? REJECT_MESSAGE[code] : null) ??
        (permanent ? '이 사진으로는 그림을 만들 수 없어요' : '그림을 만들지 못했어요. 잠시 뒤 다시 해 주세요')

    return (
        <div role="alert" className="flex flex-col items-center py-16 text-center">
            <AlertCircleIcon size={44} strokeWidth={1.5} aria-hidden className="text-content-muted" />
            <p className="mt-5 max-w-[17rem] text-base leading-relaxed text-content-primary">{message}</p>

            <div className="mt-8">
                {/* 영구 실패에는 "다시 시도"를 내지 않는다. 사진을 바꾸는 것만이 길이다 */}
                {permanent ? (
                    <Button size="md" onClick={onRetry}>
                        다른 사진으로 하기
                    </Button>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <Button size="md" onClick={onResume}>
                            다시 시도
                        </Button>
                        <Button variant="ghost" size="md" onClick={onRetry}>
                            다른 사진으로 하기
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
