'use client'

import { CameraIcon, ImageIcon, PlusIcon } from 'lucide-react'
import React, { useRef, useState } from 'react'
import { BottomSheet } from '@/shared/ui'
import { ILLUSTRATION_INPUT_ACCEPT, validateIllustrationFile } from '@/shared/lib/upload'

interface Props {
    disabled?: boolean
    onPick: (file: File) => void
    onReject: (message: string) => void
}

/**
 * 원본 사진을 고르는 `+` 버튼.
 *
 * 갤러리와 카메라를 나눠 두는 이유는 `capture` 속성이 그 자리에서 바로 카메라를 열기
 * 때문이다 — 하나로 합치면 OS가 매번 고르라고 물어, 밖에서 음식을 찍는 흐름이 한 단계 늘어난다.
 * 파일 탐색기는 넣지 않는다. 모바일에서는 갤러리와 사실상 같은 곳으로 간다.
 */
export function SourcePicker({ disabled = false, onPick, onReject }: Props) {
    const [open, setOpen] = useState(false)
    const galleryRef = useRef<HTMLInputElement>(null)
    const cameraRef = useRef<HTMLInputElement>(null)

    const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        // 같은 파일을 다시 골라도 change가 뜨도록 비운다
        e.target.value = ''
        if (!file) return

        // HEIC를 여기서 걸러야 20초를 기다린 뒤 실패하지 않는다
        const invalid = validateIllustrationFile(file)
        if (invalid) {
            onReject(invalid)
            return
        }
        setOpen(false)
        onPick(file)
    }

    return (
        <>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setOpen(true)}
                className="flex min-h-touch items-center gap-2 rounded-full bg-action-soft px-5 py-3 font-display text-base text-action-soft-text disabled:bg-action-disabled-bg disabled:text-action-disabled-text"
            >
                <PlusIcon size={18} aria-hidden />
                사진 고르기
            </button>

            <input
                ref={galleryRef}
                type="file"
                accept={ILLUSTRATION_INPUT_ACCEPT}
                className="hidden"
                onChange={handleFile}
            />
            <input
                ref={cameraRef}
                type="file"
                accept={ILLUSTRATION_INPUT_ACCEPT}
                capture="environment"
                className="hidden"
                onChange={handleFile}
            />

            {open && (
                <BottomSheet title="사진 가져오기" onClose={() => setOpen(false)}>
                    <div className="flex flex-col gap-2 pb-2">
                        <SheetItem
                            icon={<ImageIcon size={20} aria-hidden />}
                            label="앨범에서 고르기"
                            onClick={() => galleryRef.current?.click()}
                        />
                        <SheetItem
                            icon={<CameraIcon size={20} aria-hidden />}
                            label="지금 찍기"
                            onClick={() => cameraRef.current?.click()}
                        />
                    </div>
                    <p className="pb-2 text-center text-xs text-content-muted">JPG · PNG · 10MB까지</p>
                </BottomSheet>
            )}
        </>
    )
}

function SheetItem({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex min-h-touch items-center gap-3 rounded-2xl px-4 py-3 text-left text-base text-content-primary active:bg-surface-accent"
        >
            <span className="text-content-link">{icon}</span>
            {label}
        </button>
    )
}
