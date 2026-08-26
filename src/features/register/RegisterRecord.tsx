'use client'

import { AlertCircleIcon, ArrowLeftIcon, BookmarkIcon, CheckIcon, ClockIcon } from 'lucide-react'
import React, { useMemo, useRef, useState } from 'react'
import { MemoTemplatePanel } from './MemoTemplatePanel'
import { PlacePicker } from './PlacePicker'
import { RegisterPhoto, useRegisterFlow } from './RegisterFlowContext'
import { useGridShiftAnimation } from './useGridShiftAnimation'
import { usePhotoDragOrder } from './usePhotoDragOrder'
import { CardInput, LocationInput } from './confirmApi'

const MEMO_MAX = 100

interface Props {
    submitting: boolean
    error: string | null
    onBack: () => void
    onSubmit: (cards: CardInput[], location: LocationInput | null) => void
}

/**
 * `photoKeys`의 **순서가 곧 카드에 실리는 순서**다. 첫 장이 대표 사진이 된다.
 *
 * 예전에는 `thumbnailKey`를 따로 들고 "대표" 버튼으로 골랐는데, 순서라는 개념이
 * 없으니 대표만 정해도 나머지가 어떤 차례로 실리는지 알 수 없었다. 순서 하나로 합치면
 * 대표를 고르는 일이 "맨 앞으로 옮기기"가 되어 눈에 보이는 대로 동작한다
 */
interface Draft {
    photoKeys: string[]
    memo: string
}

/**
 * 음식별 기록.
 *
 * 모든 입력이 선택이다 — 사진을 안 고르면 분석 사진이 자동으로 붙고, 메모·위치는 비워도 된다.
 * 기록을 강제하면 등록 이탈이 생긴다는 것이 기획 원칙이다.
 * 위치는 카드마다가 아니라 등록 건 전체에 일괄 적용된다.
 */
export function RegisterRecord({ submitting, error, onBack, onSubmit }: Props) {
    const { recordSlots, photos, analysisPhoto } = useRegisterFlow()

    const [step, setStep] = useState(0)
    const [drafts, setDrafts] = useState<Record<number, Draft>>({})
    // 검색해서 고른 식당이면 좌표까지, 직접 입력이면 이름만 담긴다
    const [location, setLocation] = useState<LocationInput | null>(null)
    const [templateOpen, setTemplateOpen] = useState(false)
    const templateTriggerRef = useRef<HTMLButtonElement>(null)

    const uploaded = useMemo(
        () => photos.filter((photo): photo is RegisterPhoto & { key: string } => Boolean(photo.key)),
        [photos],
    )

    const slot = recordSlots[step]
    const total = recordSlots.length
    const last = step === total - 1

    /**
     * **올린 사진이 처음부터 다 들어가 있다.**
     *
     * 예전 기본값은 빈 목록이었고, 안 고르면 분석 사진 한 장만 붙었다. 그런데 사진을
     * 여러 장 올린 사람은 그 여러 장을 남기려고 올린 것이다 — 기본값이 그 반대라
     * 매번 전부 다시 눌러야 했다. 빼는 쪽이 고르는 쪽보다 드물다
     */
    const defaultDraft = useMemo<Draft>(() => ({ photoKeys: uploaded.map((photo) => photo.key), memo: '' }), [uploaded])
    const draft = drafts[slot?.slotId] ?? defaultDraft

    const patch = (change: Partial<Draft>) =>
        setDrafts((current) => ({
            ...current,
            [slot.slotId]: { ...draft, ...change },
        }))

    /** 뺐다가 다시 넣으면 맨 뒤로 간다 — 순서를 되돌리는 방법이기도 하다 */
    const togglePhoto = (key: string) =>
        patch({
            photoKeys: draft.photoKeys.includes(key)
                ? draft.photoKeys.filter((selected) => selected !== key)
                : [...draft.photoKeys, key],
        })

    /**
     * 끌어 놓은 자리로 옮긴다. 자리를 맞바꾸는 게 아니라 **뽑아서 끼워 넣는다** —
     * 맞바꾸면 1번을 3번으로 보낼 때 3번이 1번으로 튀어 올라 순서가 두 군데 바뀐다.
     */
    const reorderPhoto = (fromOrder: number, toOrder: number) => {
        if (fromOrder === toOrder) return
        const next = [...draft.photoKeys]
        const [moved] = next.splice(fromOrder, 1)
        next.splice(toOrder, 0, moved)
        patch({ photoKeys: next })
    }

    const drag = usePhotoDragOrder({ orderedKeys: draft.photoKeys, onReorder: reorderPhoto })

    /**
     * 격자에 그릴 차례. **넣은 사진이 순서대로 앞에, 뺀 사진이 뒤에** 온다.
     *
     * 올린 차례로 그리면 번호가 1, 5, 2처럼 튄다. 자리와 번호가 어긋나면
     * 끌어서 옮길 때 어디로 가는지 읽히지 않는다.
     */
    const pickedPhotos = drag.previewKeys
        .map((key) => uploaded.find((photo) => photo.key === key))
        .filter((photo): photo is RegisterPhoto & { key: string } => photo != null)
    const restPhotos = uploaded.filter((photo) => !draft.photoKeys.includes(photo.key))
    const displayPhotos = [...pickedPhotos, ...restPhotos]

    // 자리가 바뀐 칸을 옛 위치에서 새 위치로 미끄러뜨린다
    const gridRef = useGridShiftAnimation(displayPhotos.map((photo) => photo.id).join())

    const submit = () => {
        const cards: CardInput[] = recordSlots.map((passed) => {
            const saved = drafts[passed.slotId] ?? defaultDraft
            return {
                slotId: passed.slotId,
                cardPhotoKeys: saved.photoKeys,
                // 대표는 첫 장이다 (Draft 주석 참고)
                thumbnailKey: saved.photoKeys[0] ?? null,
                memo: saved.memo.trim() || null,
            }
        })
        onSubmit(cards, location)
    }

    if (!slot) return null

    return (
        // break-keep은 상속된다 — 이 화면 전체에서 한글이 단어 중간에 끊기지 않는다
        <div className="flex h-full flex-col break-keep bg-surface-app">
            <header className="flex shrink-0 items-center gap-3 px-5 py-4">
                <button type="button" onClick={() => (step === 0 ? onBack() : setStep(step - 1))} aria-label="뒤로가기">
                    <ArrowLeftIcon size={22} aria-hidden className="text-neutral-900" />
                </button>
                <span className="font-display text-lg text-content-primary">음식별 기록</span>
                <span className="ml-auto rounded-full bg-watermelon-50 px-2.5 py-1 text-xs font-bold text-content-link">
                    {step + 1} / {total}
                </span>
            </header>

            <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-4">
                <div className="flex items-baseline gap-2">
                    <h1 className="font-display text-xl text-content-primary">{slot.slotName}</h1>
                    <span className="text-xs text-content-secondary">{slot.category}</span>
                </div>

                {/* AI가 확인하지 못한 칸은 검토를 거쳐야 열린다 — 기록 시점에 미리 알린다 */}
                {!slot.matched && (
                    <p className="mt-2 flex items-start gap-1.5 rounded-2xl bg-surface-accent p-3 text-xs leading-5 text-content-secondary">
                        <ClockIcon size={14} aria-hidden className="mt-0.5 shrink-0 text-content-link" />
                        <span>
                            이 음식은 사진으로 확인되지 않아 <strong className="text-content-link">검토 후</strong>{' '}
                            도감이 열려요. 지금 남긴 기록은 그대로 저장돼요.
                        </span>
                    </p>
                )}

                <section className="mt-5" aria-label="카드 사진 고르기">
                    <p className="text-sm font-medium text-content-secondary">카드에 넣을 사진</p>
                    <p className="mt-0.5 text-xs text-content-secondary">
                        <strong>1번이 대표 사진</strong>으로 올라가요. 원하는 사진을 선택하고, 길게 눌러서 순서를 바꿀
                        수 있어요
                    </p>

                    {/*
                        손짓은 훅이 document에서 듣는다 — 여기에 걸면 손가락이 격자를 벗어나는
                        순간(맨 윗줄 위로 끌어 올릴 때) 소식이 끊겨 사진이 얼어붙는다.
                        relative는 배치 기준을 이 격자로 당겨 둔다 (칸의 offsetParent)
                    */}
                    {/* grid-snap-3 — 칸을 정수 픽셀로 맞춘다. 소수 픽셀이면 같은 2px 테두리가
                        아래쪽만 두꺼워 보인다 (globals.css의 주석 참고) */}
                    <div ref={gridRef} className="grid-snap-3 relative mt-2.5 grid grid-cols-3 gap-2.5">
                        {displayPhotos.map((photo, index) => {
                            const picked = index < pickedPhotos.length
                            const order = picked ? index : -1
                            const dragging = drag.draggingKey === photo.key
                            return (
                                <div
                                    key={photo.id}
                                    data-photo-id={photo.id}
                                    data-dragging={dragging || undefined}
                                    // 끌고 있는 칸이 어느 자리 위에 왔는지 이 값으로 읽는다.
                                    // 뺀 사진에는 붙이지 않는다 — 끼울 자리가 아니다
                                    data-order-index={picked ? index : undefined}
                                    // 따라다니는 위치는 훅이 이 요소에 직접 쓴다.
                                    // 손짓마다 state를 바꾸면 격자 전체가 다시 그려져 다른 칸들이 끊긴다
                                    className={`relative ${
                                        dragging
                                            ? // 받으면 elementFromPoint가 자기 자신만 되돌려 대상 칸을 못 고른다
                                              'pointer-events-none z-10'
                                            : // 손을 뗐을 때 손가락 자리에서 제 칸으로 미끄러져 들어간다
                                              'transition-transform duration-200 ease-out'
                                    }`}
                                >
                                    {/* 확대는 이 겹이 맡는다. 순번·분석 뱃지가 사진과 같이 커지도록
                                        relative를 여기에 둔다 — 바깥에 두면 뱃지만 제자리에 남는다 */}
                                    <div
                                        className={`relative transition-transform duration-200 ease-out ${
                                            dragging ? 'scale-105 drop-shadow-2xl' : ''
                                        }`}
                                    >
                                        <button
                                            type="button"
                                            onPointerDown={(event) => drag.onPointerDown(event, photo.key)}
                                            onClick={() => {
                                                // 끌어서 옮긴 직후의 click은 무시한다. 안 그러면 놓자마자 사진이 빠진다
                                                if (drag.consumeClick()) return
                                                togglePhoto(photo.key)
                                            }}
                                            aria-pressed={picked}
                                            aria-label={
                                                picked
                                                    ? `${order + 1}번째 사진 빼기`
                                                    : `사진 넣기 (맨 뒤 ${draft.photoKeys.length + 1}번)`
                                            }
                                            // touch-none을 걸면 사진 위에서 화면을 굴릴 수 없다.
                                            // 격자가 폭을 다 쓰니 굴릴 자리가 없어진다는 뜻이라,
                                            // 스크롤 막기는 훅이 '끌기가 시작된 뒤'로 미룬다
                                            className={`aspect-square w-full select-none overflow-hidden rounded-2xl border-2 ${
                                                picked
                                                    ? 'border-edge-active'
                                                    : 'border-transparent opacity-45 grayscale'
                                            }`}
                                        >
                                            {/* draggable=false — 데스크톱에서 길게 누르면 브라우저의
                                                이미지 끌기가 먼저 잡아채 pointer 이벤트가 끊긴다 */}
                                            {/* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 */}
                                            <img
                                                src={photo.previewUrl}
                                                alt=""
                                                draggable={false}
                                                className="h-full w-full object-cover"
                                            />
                                        </button>

                                        {/* 순번. 대표(1번)만 채운 색이라 어느 것이 표지인지 한눈에 보인다 */}
                                        {picked && (
                                            <span
                                                aria-hidden
                                                className={`absolute left-1 top-1 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold tabular-nums ${
                                                    order === 0
                                                        ? 'bg-action-primary text-content-on-action'
                                                        : 'bg-white/90 text-content-primary'
                                                }`}
                                            >
                                                {order + 1}
                                            </span>
                                        )}

                                        {photo.id === analysisPhoto?.id && (
                                            <span className="absolute right-1 top-1 rounded-full bg-white/90 px-2 py-0.5 text-xs font-bold text-content-primary">
                                                분석
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {draft.photoKeys.length === 0 && (
                        <p className="mt-2 text-xs font-medium text-feedback-error">
                            사진을 하나도 안 넣으면 카드에 사진이 없어요
                        </p>
                    )}
                </section>

                <section className="mt-6" aria-label="메모">
                    <div className="flex items-center justify-between">
                        <label htmlFor="memo" className="text-sm font-medium text-content-secondary">
                            메모 <span className="text-xs">(선택)</span>
                        </label>
                        <button
                            ref={templateTriggerRef}
                            type="button"
                            onClick={() => setTemplateOpen((open) => !open)}
                            aria-expanded={templateOpen}
                            aria-label="저장한 메모 템플릿 열기"
                            className="flex min-h-touch items-center gap-1 px-1 text-xs text-content-link"
                        >
                            <BookmarkIcon size={14} aria-hidden />
                            메모 불러오기
                        </button>
                    </div>
                    <textarea
                        id="memo"
                        value={draft.memo}
                        maxLength={MEMO_MAX}
                        onChange={(event) => patch({ memo: event.target.value })}
                        placeholder={`${slot.slotName} 어땠나요?`}
                        // break-words가 없으면 띄어쓰기 없는 긴 문자열이 break-keep 탓에 줄바꿈되지 못해
                        // 가로로 흘러 스크롤바가 생긴다. 일반 문장은 그대로 단어 단위로 끊긴다
                        className="mt-1.5 h-24 w-full resize-none break-words rounded-2xl border border-edge-default bg-surface-card px-4 py-3 text-sm outline-none focus:border-edge-active"
                    />
                    <p className="mt-1 text-right text-xs text-content-secondary">
                        {draft.memo.length} / {MEMO_MAX}
                    </p>

                    {templateOpen && (
                        <MemoTemplatePanel
                            currentMemo={draft.memo}
                            triggerRef={templateTriggerRef}
                            // 불러오기는 작성의 시작점이다 — 넣은 뒤 그대로 고칠 수 있다
                            onPick={(content) => patch({ memo: content })}
                            onClose={() => setTemplateOpen(false)}
                        />
                    )}
                </section>

                <section className="mt-4" aria-label="수집 위치">
                    {/* 고르고 나면 입력창이 사라져 label의 대상이 없어진다 — 설명 문구로 두고
              PlacePicker 내부에서 aria-label을 단다 */}
                    <p className="text-sm font-medium text-content-secondary">
                        수집 위치 <span className="text-xs">(선택)</span>
                    </p>
                    <PlacePicker value={location} onChange={setLocation} />
                </section>

                {error && (
                    <p role="alert" className="mt-4 flex items-center gap-1.5 text-xs text-feedback-error">
                        <AlertCircleIcon size={14} aria-hidden />
                        {error}
                    </p>
                )}
            </main>

            <div className="shrink-0 px-5 pb-8 pt-4">
                <button
                    type="button"
                    disabled={submitting}
                    onClick={() => (last ? submit() : setStep(step + 1))}
                    className="flex h-cta w-full items-center justify-center gap-2 rounded-2xl bg-action-primary font-display text-lg text-content-on-action shadow-card disabled:opacity-40"
                >
                    {last && <CheckIcon size={18} aria-hidden />}
                    {submitting ? '등록하는 중…' : last ? '등록 완료' : '다음'}
                </button>
            </div>
        </div>
    )
}
