/**
 * BE `domain/illustration`의 enum·DTO와 1:1로 맞춘다.
 * 여기 이름이 서버와 어긋나면 요청 자체가 400으로 떨어진다.
 */

/** 그림이 걸릴 자리. 프롬프트 파일이 자리로만 갈린다 */
export type IllustrationPurpose = 'LOGIT_COVER' | 'CHALLENGE_COVER' | 'CHALLENGE_SLOT' | 'BADGE'

/** `STYLIZE`는 사진 변환, `GENERATE`는 설명만으로 생성 — 뱃지만 후자를 쓸 수 있다 */
export type IllustrationMode = 'STYLIZE' | 'GENERATE'

export type IllustrationStatus = 'GENERATING' | 'DONE' | 'REJECTED' | 'FAILED'

export interface IllustrationJob {
    jobId: number
    status: IllustrationStatus
    /** 저장할 값. 화면에 그리는 건 previewUrl이다 */
    imageKey: string | null
    /** 만료되는 프리사인 URL. 상태를 다시 조회하면 새로 내려온다 */
    previewUrl: string | null
    revisionDepth: number
    canRevise: boolean
    instructions: string | null
    /** `REJECTED`·`FAILED`일 때만 채워진다 */
    failureCode: string | null
}

export interface RevisionPreset {
    code: string
    label: string
}

export interface CreateIllustrationInput {
    purpose: IllustrationPurpose
    mode: IllustrationMode
    sourceImageKey?: string
    description?: string
}

export interface ReviseIllustrationInput {
    presets: string[]
    freeText?: string
}

/**
 * 자리마다 결과를 받아 갈 화면이 다르다. 진입할 때 쿼리로 들고 와서
 * 끝나면 `sessionStorage`로 돌려준다 — 챌린짓 개설이 여러 단계의 상태를 들고 있어
 * 라우트를 떠났다 돌아와야 하기 때문이다.
 */
export interface IllustrationHandoff {
    purpose: IllustrationPurpose
    imageKey: string
    previewUrl: string
    /**
     * 진입한 쪽이 넣어 둔 표식. 일러스트 화면은 읽지 않고 그대로 돌려준다.
     * 챌린짓 슬롯처럼 **같은 자리가 여러 개**일 때 어느 칸의 결과인지 가리는 데 쓴다.
     */
    ref?: string
}
