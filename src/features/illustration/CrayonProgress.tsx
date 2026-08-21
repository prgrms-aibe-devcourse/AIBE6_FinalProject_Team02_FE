'use client'

import Image from 'next/image'

/**
 * 크레용이 선을 칠하며 나아가는 진행바.
 *
 * 서버가 중간 상태를 주지 않아 실제 진행률이 아니라 경과 시간으로 그린다.
 * 끝에 닿지 않게 두는 이유는 100%에 붙은 채로 결과가 안 나오면 멈춘 화면이 되기 때문이다.
 *
 * 아래 좌표는 PNG의 알파값을 읽어 잰 값이다. 이미지를 교체하면 다시 재야 한다.
 */

/** 서버 평균. `GeneratingView`·`useIllustrationJob`과 같은 값 */
const EXPECTED_SEC = 20

/** 20초까지 차는 상한. 남은 10%가 예상 시간을 넘긴 구간을 담는다 */
const PACED_MAX = 90

/**
 * 20초를 넘기면 남은 10%를 25초마다 63%씩 좁힌다.
 * 45초에 95.7%, 90초에 98.8%로 100%에 수렴만 하고 도달하지 않는다.
 */
const CREEP_TAU = 25

/** 선 이미지: 캔버스 788×316에 선은 세로 정중앙, 두께 19px(6%) */
const BAR_RATIO = 316 / 788

/**
 * 크레용 그림. 캔버스 256×209에 실제 잉크는 가로 45% · 세로 82%.
 * 잉크가 오른쪽에 치우쳐 있어 가운데 정렬로는 맞지 않는다
 */
const CRAYON_SRC = '/images/bottom_nav/crayon_bar.png'
const CRAYON_RATIO = 1133 / 1388

/**
 * 크레용 심 끝의 캔버스 내 위치. 알파값을 읽어 잰 값이다.
 * `translate(-37.7%, -90.6%)`가 이미지의 이 점을 기준점으로 끌어온다
 */
const TIP_X = '37.7%'
const TIP_Y = '90.6%'

/** 선 창(窓) 높이와 바닥 여백. 선 중심은 바닥에서 14px */
const LINE_FROM_BOTTOM = 14

const TRACK_WIDTH = 240
/** 이 폭이면 실제 크레용이 29×42px로 그려진다 (트랙 240px의 약 17%) */
const CRAYON_WIDTH = 64

/** 경과 시간을 0~100 사이 진행률로 옮긴다 */
function toPercent(elapsedSec: number) {
    if (elapsedSec <= 0) return 0
    if (elapsedSec <= EXPECTED_SEC) return (elapsedSec / EXPECTED_SEC) * PACED_MAX
    const over = elapsedSec - EXPECTED_SEC
    return PACED_MAX + (100 - PACED_MAX) * 0.9 * (1 - Math.exp(-over / CREEP_TAU))
}

interface Props {
    elapsedSec: number
}

export function CrayonProgress({ elapsedSec }: Props) {
    const percent = toPercent(elapsedSec)
    const overdue = elapsedSec > EXPECTED_SEC

    return (
        // 추정치라 progressbar 역할을 주지 않는다. 상태는 위쪽 문구가 알린다
        <div aria-hidden className="relative mx-auto h-16" style={{ width: TRACK_WIDTH }}>
            {/*
                선 창. 원본의 95%가 투명 여백이라 그대로 두면 96px을 차지한다.
                가로만 창에 맞추고 세로는 비율대로 둔 뒤 넘치는 여백을 잘라 낸다
            */}
            <div className="absolute inset-x-0 bottom-2 h-3 overflow-hidden">
                <BarImage src="/images/gray_bar.png" />
                {/*
                    분홍 선은 같은 자리에 겹쳐 두고 오른쪽에서 잘라 낸다.
                    폭을 줄이면 그림이 눌리므로 clip-path로 자른다
                */}
                <BarImage
                    src="/images/pink_bar.png"
                    style={{
                        clipPath: `inset(0 ${100 - percent}% 0 0)`,
                        transition: 'clip-path 1s linear',
                    }}
                />
            </div>

            {/* 심 끝이 분홍과 회색의 경계에 오도록 이미지 전체를 옮긴다 */}
            <span
                className="absolute"
                style={{
                    left: `${percent}%`,
                    top: `calc(100% - ${LINE_FROM_BOTTOM}px)`,
                    transform: `translate(-${TIP_X}, -${TIP_Y})`,
                    transition: 'left 1s linear',
                }}
            >
                <Image
                    src={CRAYON_SRC}
                    alt=""
                    width={CRAYON_WIDTH}
                    height={Math.round(CRAYON_WIDTH * CRAYON_RATIO)}
                    className={`max-w-none ${overdue ? 'crayon-wobble' : ''}`}
                    style={{ transformOrigin: `${TIP_X} ${TIP_Y}` }}
                />
            </span>
        </div>
    )
}

function BarImage({ src, style }: { src: string; style?: React.CSSProperties }) {
    return (
        <Image
            src={src}
            alt=""
            width={788}
            height={Math.round(788 * BAR_RATIO)}
            sizes={`${TRACK_WIDTH}px`}
            style={style}
            className="absolute left-0 top-1/2 w-full max-w-none -translate-y-1/2"
        />
    )
}
