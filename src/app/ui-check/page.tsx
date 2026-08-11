'use client'

/**
 * `/ui-check` — 공통 컴포넌트 갤러리. 제품 화면이 아니다.
 *
 * 새 컴포넌트를 만들거나 색·크기를 바꿨을 때 **한 화면에서 전부 눈으로 확인**하려고 둔다.
 * 다른 화면처럼 로그인이 필요해서 (AuthGate 예외 없음) 바깥에 노출되지는 않는다.
 *
 * 공통 컴포넌트를 추가하면 여기에도 한 줄 넣어 둔다 — 그래야 다음 사람이 무엇이 있는지 안다.
 */
import { useState } from 'react'
import {
    AppScreen,
    Avatar,
    BottomNav,
    Button,
    Dialog,
    EmptyState,
    LoadingView,
    type NavTab,
    PageHeader,
    Skeleton,
    Text,
    TextArea,
    TextField,
    useToast,
} from '@/shared/ui'

/** 역할 하나씩. 위에서 아래로 위계가 내려간다 */
const TEXT_ROLES = [
    ['display', '해금! 삼겹살'],
    ['screenTitle', '나의 음식 도감'],
    ['sectionTitle', '이번 주 챌린지'],
    ['body', '오늘 먹은 음식을 기록하면 도감이 채워져요.'],
    ['bodyStrong', '본문 중 강조하고 싶은 문장'],
    ['secondary', '사진은 최대 5장까지 올릴 수 있어요'],
    ['label', '닉네임'],
    ['caption', '2026. 8. 11. 오후 7:24'],
    ['numeric', '1 · 11 · 108'],
] as const

export default function UiCheckPage() {
    const toast = useToast()
    const [dialog, setDialog] = useState<'alert' | 'confirm' | 'danger' | null>(null)
    const [name, setName] = useState('')
    const [tab, setTab] = useState<NavTab>('제작')

    return (
        <AppScreen
            header={<PageHeader title="공통 컴포넌트 점검" onBack={() => history.back()} />}
            footer={<BottomNav active={tab} onTab={setTab} />}
        >
            <div className="flex flex-col gap-8 pb-10">
                <section className="flex flex-col gap-3">
                    <Text variant="sectionTitle">Text — 역할별 위계</Text>
                    {TEXT_ROLES.map(([variant, sample]) => (
                        <div key={variant} className="border-b border-edge-default pb-2">
                            <Text variant="caption" tone="muted" as="p">
                                {variant}
                            </Text>
                            {/* as="p"로 낮춰 둔다 — 갤러리에 h1이 여러 개면 문서 구조가 거짓이 된다 */}
                            <Text variant={variant} as="p">
                                {sample}
                            </Text>
                        </div>
                    ))}
                </section>

                <section className="flex flex-col gap-2">
                    <Text variant="sectionTitle">Button</Text>
                    <Button fullWidth>주 동작 (cta)</Button>
                    <Button variant="secondary" fullWidth>
                        보조
                    </Button>
                    <Button variant="soft" size="md" fullWidth>
                        약한 동작
                    </Button>
                    <Button variant="danger" size="md" fullWidth>
                        위험
                    </Button>
                    <Button variant="ghost" size="sm" fullWidth>
                        고스트
                    </Button>
                    <Button fullWidth loading>
                        처리 중
                    </Button>
                    <Button fullWidth disabled>
                        잠김
                    </Button>
                </section>

                <section className="flex flex-col gap-4">
                    <Text variant="sectionTitle">TextField</Text>
                    <TextField
                        label="닉네임"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="두 글자 이상"
                        hint="한글·영문·숫자만 쓸 수 있어요"
                        count={{ current: name.length, max: 10 }}
                        maxLength={10}
                    />
                    <TextField label="에러 상태" defaultValue="ㅋ" error="두 글자 이상 적어 주세요" />
                    <TextArea label="소개말" placeholder="자유롭게" rows={3} />
                </section>

                <section className="flex flex-col gap-3">
                    <Text variant="sectionTitle">Avatar</Text>
                    <div className="flex items-end gap-2">
                        <Avatar name="가나다" size="xs" />
                        <Avatar name="라마바" size="sm" />
                        <Avatar name="사아자" size="md" />
                        <Avatar name="차카타" size="lg" ring="ring-2 ring-edge-active" />
                    </div>
                </section>

                <section className="flex flex-col gap-3">
                    <Text variant="sectionTitle">Skeleton · LoadingView</Text>
                    <Skeleton shape="title" className="w-28" />
                    <Skeleton shape="text" count={3} />
                    <LoadingView label="사진을 분석하는 중" scene="analyzing" />
                    <LoadingView label="도감을 여는 중" scene="unlocking" />
                </section>

                <section>
                    <Text variant="sectionTitle">EmptyState</Text>
                    <EmptyState
                        icon="🍽️"
                        title="아직 기록이 없어요"
                        description="오늘 먹은 걸 남겨 보세요"
                        action={{ label: '기록 남기기', onClick: () => toast.info('여기서 기록 화면으로') }}
                    />
                    <EmptyState
                        tone="error"
                        title="불러오지 못했어요"
                        description="잠시 후 다시 시도해 주세요"
                        action={{ label: '다시 시도', onClick: () => toast.error('또 실패했어요') }}
                    />
                </section>

                <section className="flex flex-col gap-2">
                    <Text variant="sectionTitle">Toast</Text>
                    <Button size="md" fullWidth onClick={() => toast.success('닉네임을 바꿨어요')}>
                        성공
                    </Button>
                    <Button
                        size="md"
                        variant="secondary"
                        fullWidth
                        onClick={() => toast.error('저장하지 못했어요. 잠시 후 다시 시도해 주세요')}
                    >
                        실패
                    </Button>
                </section>

                <section className="flex flex-col gap-2">
                    <Text variant="sectionTitle">Dialog</Text>
                    <Button size="md" fullWidth onClick={() => setDialog('alert')}>
                        알림
                    </Button>
                    <Button size="md" variant="secondary" fullWidth onClick={() => setDialog('confirm')}>
                        확인
                    </Button>
                    <Button size="md" variant="danger" fullWidth onClick={() => setDialog('danger')}>
                        위험
                    </Button>
                </section>
            </div>

            {dialog === 'alert' && (
                <Dialog title="개설 실패" message="같은 이름의 챌린지가 이미 있어요." onClose={() => setDialog(null)} />
            )}
            {dialog === 'confirm' && (
                <Dialog
                    title="이 설정으로 만들까요?"
                    message="설정한 내용은 나중에 바꿀 수 있어요."
                    cancelText="아니요"
                    action={{ label: '네, 만들게요', onClick: () => setDialog(null) }}
                    onClose={() => setDialog(null)}
                />
            )}
            {dialog === 'danger' && (
                <Dialog
                    title="기록을 지울까요?"
                    message={'사진과 음식 이름이 함께 사라져요.\n되돌릴 수 없어요.'}
                    danger
                    action={{ label: '삭제하기', onClick: () => setDialog(null) }}
                    onClose={() => setDialog(null)}
                />
            )}
        </AppScreen>
    )
}
