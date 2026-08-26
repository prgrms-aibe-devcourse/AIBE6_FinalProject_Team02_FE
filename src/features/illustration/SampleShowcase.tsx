'use client'

import Image from 'next/image'

/**
 * 진입 화면에서 사진을 고르기 전, 버튼 아래를 채우는 안내 카드.
 *
 * 글자는 이미지가 아니라 텍스트다. 카드를 통짜 PNG로 넣으면 375px 폭에서 글자가
 * 9~10px로 줄고 확대되지 않으며 스크린리더가 읽지 못한다.
 * `font-display`(Dinggul)가 손글씨라 텍스트로도 같은 느낌이 나므로,
 * 프레임과 샘플 세 장만 이미지로 둔다.
 *
 * 뱃지 진입에는 띄우지 않는다. 그 화면은 사진 없이 설명만으로도 만들 수 있어
 * "어떤 사진이든"과 맞지 않고, `TextField`가 들어와 자리도 없다.
 */

/** 카드를 두르는 노란 크레파스 테두리. 원본 577×433 */
const CARD_FRAME = '/images/big_yellow_frame.png'

/** 카드 아래 장식. 원본 1201×207 */
const CRAYON_ROW = '/images/crayon.png'

interface Sample {
    label: string
    /** 170×170 정사각. 칸도 정사각이라 늘어나지 않는다 */
    frame: string
    example: string
}

const SAMPLES: Sample[] = [
    { label: '인물', frame: '/images/blue_frame.png', example: '/images/illustration_example_person.png' },
    { label: '음식', frame: '/images/pink_frame.png', example: '/images/illustration_example_food.png' },
    { label: '캐릭터', frame: '/images/green_frame.png', example: '/images/illustration_example_character.png' },
]

/** 프레임 안쪽 여백. 선이 두꺼워 그림이 닿지 않도록 띄운다 */
const INNER_INSET = 'inset-[13%]'

export function SampleShowcase() {
    return (
        <section aria-labelledby="illustration-samples-title" className="mt-5 w-full pb-2">
            <div className="relative px-6 py-4">
                {/*
                    프레임은 배경으로 깐다. 손으로 그린 선이라 조금 늘어나도 티가 나지 않고,
                    `background-size: 100% 100%`면 카드 높이가 문구 길이에 따라 변해도 따라온다
                */}
                <div
                    aria-hidden
                    style={{ backgroundImage: `url('${CARD_FRAME}')` }}
                    className="pointer-events-none absolute inset-0 bg-[length:100%_100%] bg-no-repeat"
                />

                <h2 id="illustration-samples-title" className="text-center font-display text-lg text-content-primary">
                    사진 속 무엇이든 그려 드려요!
                </h2>

                <div className="relative mt-3 flex justify-center gap-3">
                    {SAMPLES.map((sample) => (
                        <SampleTile key={sample.label} {...sample} />
                    ))}
                </div>

                <p className="relative mt-3 whitespace-pre-line text-center text-xs leading-relaxed text-content-muted">
                    {'사람, 음식, 반려동물, 캐릭터 등\n어떤 사진이든 그림으로 변환해 드려요!'}
                </p>
            </div>

            <Image
                src={CRAYON_ROW}
                alt=""
                aria-hidden
                width={1201}
                height={207}
                sizes="300px"
                className="mx-auto mt-2 w-[300px] max-w-full"
            />
        </section>
    )
}

function SampleTile({ label, frame, example }: Sample) {
    return (
        <figure className="flex flex-col items-center gap-1.5">
            <div className="relative h-[4.5rem] w-[4.5rem]">
                {/* 원본 512×512를 72px로 그린다. next/image가 알맞은 크기로 줄여 내려보낸다 */}
                <div className={`absolute ${INNER_INSET}`}>
                    <Image src={example} alt="" fill sizes="72px" className="object-contain" />
                </div>
                {/* 프레임을 그림 위에 덮는다. 가운데가 비어 있어 선만 얹힌다 */}
                {/* eslint-disable-next-line @next/next/no-img-element -- 12KB 장식이라 최적화 왕복이 더 비싸다 */}
                <img src={frame} alt="" aria-hidden className="absolute inset-0 h-full w-full" />
            </div>
            <figcaption className="font-display text-sm text-content-primary">{label}</figcaption>
        </figure>
    )
}
