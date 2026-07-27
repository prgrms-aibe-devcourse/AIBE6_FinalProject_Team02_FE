import { apiFetch } from "@/shared/lib/api";

/** GET /api/v1/my/profile 응답 */
export interface MyProfile {
  nickname: string;
  nicknameChangeable: boolean; // 지금 닉네임 변경 가능한지 (1개월 제한 통과 여부)
  nicknameChangeableAt: string | null; // 다음 변경 가능 시각. null이면 즉시 가능
}

// POST /api/v1/my/nickname — 최초 닉네임 세팅 (온보딩 전)
// 규칙: 2~8자, 한글/영문/숫자/밑줄
export function postInitialNickname(nickname: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/nickname", {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
}

// GET /api/v1/my/profile — 마이페이지 프로필(닉네임 + 변경 가능 여부/가능 시각)
export function getMyProfile(): Promise<MyProfile> {
  return apiFetch<MyProfile>("/api/v1/my/profile");
}

// PATCH /api/v1/my/nickname — 닉네임 변경 (1개월 1회)
// 너무 이르면 NICKNAME_CHANGE_TOO_SOON, 중복이면 NICKNAME_DUPLICATED 메시지가 던져진다.
export function patchNickname(nickname: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/nickname", {
    method: "PATCH",
    body: JSON.stringify({ nickname }),
  });
}
