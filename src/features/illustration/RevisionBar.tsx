'use client'

import { ArrowUpIcon, SendIcon } from 'lucide-react'
import React, { useState } from 'react'
import { Chip } from '@/shared/ui'
import type { RevisionPreset } from './types'

/** 서버가 100자를 넘으면 잘라 버린다. 잘릴 글자를 치게 두지 않는다 */
const FREE_TEXT_MAX = 100

interface Props {
    presets: RevisionPreset[]
    /** 남은 수정 횟수. 0이면 칩과 입력을 모두 잠근다 */
    remaining: number
    submitting: boolean
    onSubmit: (input: { presets: string[]; freeText: string }) => void
}

/**
 * 아래에 붙어 있는 수정 요청 줄.
 *
 * 칩과 자유 입력을 **한 번에 같이 보낸다.** 따로 보내면 "더 단순하게"를 누르는 순간
 * 수정 한 번이 소진되어, 세 번뿐인 기회를 칩 하나에 쓰게 된다.
 */
export function RevisionBar({ presets, remaining, submitting, onSubmit }: Props) {
    const [picked, setPicked] = useState<string[]>([])
    const [freeText, setFreeText] = useState('')

    const locked = remaining <= 0 || submitting
    const empty = picked.length === 0 && freeText.trim().length === 0

    const toggle = (code: string) =>
        setPicked((current) => (current.includes(code) ? current.filter((c) => c !== code) : [...current, code]))

    const submit = () => {
        if (locked || empty) return
        onSubmit({ presets: picked, freeText: freeText.trim() })
        setPicked([])
        setFreeText('')
    }

    if (remaining <= 0) {
        return (
            <p className="px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 text-center text-xs text-content-muted">
                수정은 3번까지 할 수 있어요. 이 그림으로 정해 주세요
            </p>
        )
    }

    return (
        <div className="shrink-0 border-t border-edge-default bg-surface-card px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
            {/* 칩은 가로로 흐른다 — 줄바꿈으로 쌓으면 입력칸이 화면 밖으로 밀린다 */}
            <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 pb-2">
                {presets.map((preset) => (
                    <Chip
                        key={preset.code}
                        tone={picked.includes(preset.code) ? 'solid' : 'outline'}
                        selected={picked.includes(preset.code)}
                        onClick={() => toggle(preset.code)}
                    >
                        {preset.label}
                    </Chip>
                ))}
            </div>

            <div className="flex items-end gap-2">
                <label className="min-w-0 flex-1">
                    <span className="sr-only">고치고 싶은 점</span>
                    <input
                        value={freeText}
                        onChange={(e) => setFreeText(e.target.value)}
                        onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                submit()
                            }
                        }}
                        maxLength={FREE_TEXT_MAX}
                        placeholder="고치고 싶은 점을 적어 주세요"
                        className="min-h-touch w-full rounded-full bg-neutral-50 px-4 text-sm outline-none"
                    />
                </label>

                <button
                    type="button"
                    onClick={submit}
                    disabled={locked || empty}
                    aria-label="이대로 다시 그리기"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-action-primary text-content-on-action disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
                >
                    {/* 보낼 것이 생기면 아이콘이 바뀐다. disabled 색만으로는 색각 이상에서 구분되지 않는다 */}
                    {empty ? <SendIcon size={18} aria-hidden /> : <ArrowUpIcon size={20} aria-hidden />}
                </button>
            </div>

            <p className="mt-1.5 text-center text-xs text-content-muted">{remaining}번 더 고칠 수 있어요</p>
        </div>
    )
}
