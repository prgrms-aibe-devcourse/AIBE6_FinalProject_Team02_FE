import { apiFetch } from '@/shared/lib/api'

/** 서버가 용도별로 다른 상한을 두므로 경로가 갈린다 */
export type UploadPurpose = 'default' | 'logit-record' | 'illustration'

const PRESIGN_PATH: Record<UploadPurpose, string> = {
    default: '/api/v1/uploads/presigned',
    'logit-record': '/api/v1/uploads/presigned/logit-records',
    illustration: '/api/v1/uploads/presigned/illustrations',
}

/** BE UploadPurpose와 맞춘다 — 넘기면 서버가 막는다 */
export const MAX_PHOTOS: Record<UploadPurpose, number> = {
    default: 5,
    'logit-record': 8,
    illustration: 1,
}

/** 장당 최대 10MB */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024

/** BE S3PresignedUrlService.ALLOWED_CONTENT_TYPES와 같은 목록을 유지해야 한다 */
export const ACCEPTED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/heif']

export const PHOTO_INPUT_ACCEPT = ACCEPTED_PHOTO_TYPES.join(',')

/**
 * 일러스트 원본만 HEIC를 뺀다. 서버가 사진을 **디코딩해서** 크레파스 그림으로 바꾸는데
 * `ImageIO`가 HEIC를 읽지 못해 변환 단계에서 터진다 — 서버도 presign에서 400으로 막는다.
 * 저장만 하는 프로필·표지는 그대로 HEIC를 받으므로 `ACCEPTED_PHOTO_TYPES`는 건드리지 않는다.
 */
export const ACCEPTED_ILLUSTRATION_TYPES = ['image/jpeg', 'image/png']

export const ILLUSTRATION_INPUT_ACCEPT = ACCEPTED_ILLUSTRATION_TYPES.join(',')

export interface UploadTarget {
    key: string
    uploadUrl: string
}

interface PresignedResponse {
    uploads: UploadTarget[]
}

/**
 * 클라이언트 1차 검증. 서버도 형식을 다시 보지만 즉시 알려 주려고 여기서도 본다.
 * 용량은 presigned PUT 구조상 서버가 볼 수 없다 — 바이트가 서버를 거치지 않는다.
 */
export function validatePhotoFile(file: File): string | null {
    if (!ACCEPTED_PHOTO_TYPES.includes(file.type)) {
        return `"${file.name}" — JPG·PNG·HEIC만 올릴 수 있어요`
    }
    if (file.size > MAX_PHOTO_BYTES) {
        return `"${file.name}" — 사진 한 장은 10MB까지예요`
    }
    return null
}

/**
 * 일러스트 원본 1차 검증. HEIC를 여기서 걸러야 20초를 기다린 뒤 실패하지 않는다.
 * 형식 문구를 따로 두는 이유는 "HEIC는 되는데 여기선 안 된다"를 말해 줘야 하기 때문이다.
 */
export function validateIllustrationFile(file: File): string | null {
    if (!ACCEPTED_ILLUSTRATION_TYPES.includes(file.type)) {
        return 'AI 그림은 JPG·PNG만 쓸 수 있어요 (HEIC는 아직 지원하지 않아요)'
    }
    if (file.size > MAX_PHOTO_BYTES) {
        return '사진 한 장은 10MB까지예요'
    }
    return null
}

/** 파일 순서와 응답 uploads 순서는 1:1로 대응한다 */
export function requestUploadTargets(files: File[], purpose: UploadPurpose): Promise<UploadTarget[]> {
    return apiFetch<PresignedResponse>(PRESIGN_PATH[purpose], {
        method: 'POST',
        body: JSON.stringify({
            files: files.map((file) => ({ fileName: file.name, contentType: file.type })),
        }),
    }).then((response) => response.uploads)
}

/**
 * S3에 직접 PUT.
 * 공통 apiFetch를 쓰지 않는다 — S3는 우리 응답 래퍼를 모르고, 인증 쿠키를 실어 보내면 안 된다.
 * 서명에 contentType이 묶여 있어 PUT도 같은 값이어야 한다.
 */
export async function putToS3(blob: Blob, contentType: string, target: UploadTarget): Promise<void> {
    const response = await fetch(target.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: blob,
    })
    if (!response.ok) {
        throw new Error(`사진을 올리지 못했어요 (${response.status})`)
    }
}

/**
 * 한 장을 올리고 저장용 key를 돌려준다. 표지·프로필처럼 낱장을 쓰는 화면용.
 *
 * `purpose`를 넘길 수 있게 둔 이유는 서버가 **발급 용도까지 대조**하기 때문이다 —
 * `default`로 받은 key를 일러스트 생성에 넘기면 서버가 거절한다.
 */
export async function uploadImageToS3(
    blob: Blob,
    fileName: string,
    purpose: UploadPurpose = 'default',
): Promise<{ key: string }> {
    const contentType = blob.type || 'image/jpeg'
    const [target] = await requestUploadTargets([new File([blob], fileName, { type: contentType })], purpose)
    await putToS3(blob, contentType, target)
    return { key: target.key }
}
