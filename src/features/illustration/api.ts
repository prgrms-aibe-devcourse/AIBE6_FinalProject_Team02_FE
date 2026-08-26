import { apiFetch } from '@/shared/lib/api'
import type {
    CreateIllustrationInput,
    IllustrationJob,
    ReviseIllustrationInput,
    RevisionPreset,
} from './types'

const BASE = '/api/v1/illustrations'

/**
 * 작업만 만들고 끝난다. **응답의 status는 대부분 `GENERATING`이다** —
 * 생성이 20초 안팎 걸려서 결과는 `findIllustrationJob` 폴링으로 받는다.
 */
export function createIllustrationJob(input: CreateIllustrationInput): Promise<IllustrationJob> {
    return apiFetch<IllustrationJob>(BASE, {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

/**
 * 수정 요청. 새 jobId가 내려온다 — 서버가 부모를 두고 새 작업을 만들기 때문이다.
 * 원본 사진은 부모 것을 물려받으므로 여기서 다시 올리지 않는다.
 */
export function reviseIllustrationJob(jobId: number, input: ReviseIllustrationInput): Promise<IllustrationJob> {
    return apiFetch<IllustrationJob>(`${BASE}/${jobId}/revisions`, {
        method: 'POST',
        body: JSON.stringify(input),
    })
}

export function findIllustrationJob(jobId: number): Promise<IllustrationJob> {
    return apiFetch<IllustrationJob>(`${BASE}/${jobId}`)
}

/** 지시 문구는 서버가 들고 있다. 프롬프트를 고칠 때 화면을 같이 배포하지 않으려는 것 */
export function fetchRevisionPresets(): Promise<RevisionPreset[]> {
    return apiFetch<RevisionPreset[]>(`${BASE}/revision-presets`)
}
