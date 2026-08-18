/** 「내가 쓴 리뷰」·「좋아요한 리뷰」가 함께 쓰는 표시 헬퍼 */

/** `8월 12일`. 해가 바뀌면 연도까지 — 작년 리뷰가 올해 것처럼 보이면 안 됨 */
export function reviewDate(iso: string): string {
    const d = new Date(iso)
    const md = `${d.getMonth() + 1}월 ${d.getDate()}일`
    return d.getFullYear() === new Date().getFullYear() ? md : `${d.getFullYear()}년 ${md}`
}

/**
 * 고친 적이 있는지.
 *
 * 1초 여유를 둔다 — 생성 시각과 수정 시각은 저장할 때 함께 찍혀 같은 값이지만,
 * 밀리초가 어긋나면 손대지 않은 리뷰에 「수정됨」이 붙어 버린다
 */
export function wasEdited(review: { createdAt: string; updatedAt: string }): boolean {
    return new Date(review.updatedAt).getTime() - new Date(review.createdAt).getTime() > 1000
}
