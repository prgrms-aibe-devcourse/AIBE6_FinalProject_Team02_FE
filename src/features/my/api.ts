import { apiFetch } from "@/shared/lib/api";

// POST /api/v1/my/nickname — 최초 닉네임 세팅 (온보딩 전)
// BE 규칙: 2~8자, 한글/영문/숫자/밑줄
// 중복/이미설정 시 에러 message가 던져짐
export function postInitialNickname(nickname: string): Promise<void> {
  return apiFetch<void>("/api/v1/my/nickname", {
    method: "POST",
    body: JSON.stringify({ nickname }),
  });
}
