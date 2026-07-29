## 📌 관련 이슈

Jira: CATCHEAT-10

BE PR(CATCHEAT-10)과 함께 봐주세요. 이 화면은 BE의 관리자 콘솔 API를 그대로 소비합니다.

## ✨ 작업 내용

관리자 콘솔 화면(`/admin`)을 신설했습니다. 관리자가 처리할 두 개의 큐를 탭으로 나눠 보여주고, 목록 조회 + 채택·완료·반려까지 한 화면에서 처리합니다.

- **등록 요청 탭** — AI가 끝까지 판정하지 못한 등록 → 증빙 사진 확인 후 완료(칸 해금)/반려
- **제보 탭** — 도감에 없는 음식 제보 → 채택/반려

## 커밋

| 커밋 | 내용 |
|---|---|
| `ae16c7e` feat | admin 타입 · API 클라이언트 |
| `24c6729` feat | 콘솔 화면(AdminConsole) + 이미지 설정 |
| `bde24aa` feat | `/admin` 페이지 라우트 + ADMIN 가드 |

## 화면 / 라우트

| 라우트 | 내용 |
|---|---|
| `/admin` | 관리자 콘솔 (등록 요청 / 제보 탭 전환) |

새 파일: `features/admin/{types.ts, api.ts, AdminConsole.tsx}`, `app/admin/page.tsx`, `shared/lib/routes.ts`에 `admin` 경로 추가.

## 주요 구현

**1. 공통 API 클라이언트를 그대로 씁니다**
admin API 호출도 `shared/lib/api.ts`의 `apiFetch`를 통합니다. 쿠키 인증(`credentials:'include'`)과 401→재발급 재시도가 이미 처리되므로, admin 쪽은 경로·메서드·body만 넘깁니다.

**2. 접근 가드는 두 겹입니다**
전역 `AuthGate`가 비로그인을 로그인 페이지로 보내고, `/admin` 페이지가 `me.role === 'ADMIN'`이 아니면 홈으로 돌려보냅니다. 판정 전에는 콘솔을 그리지 않아 비관리자에게 화면이 번쩍 보이지 않게 했습니다. 진짜 방어선은 BE의 `hasRole("ADMIN")`(403)이고, 이건 UX용입니다.

**3. 처리 후 목록을 낙관적으로 갱신합니다**
채택/완료/반려가 성공하면 서버를 다시 부르지 않고 해당 항목만 목록에서 제거합니다 — 어차피 처리되면 PENDING 목록에서 빠지기 때문입니다.

**4. 증빙 사진은 `next/image` + presigned URL**
등록 요청은 증빙 사진(`evidenceUrl`)을 썸네일로 보여줘 관리자가 사진을 보고 판단합니다. presigned URL은 만료·쿼리파라미터가 있어 `unoptimized`로 두고, `next.config.mjs`의 `images.remotePatterns`에 S3 호스트를 허용했습니다.

## 📸 테스트 결과

⚠️ 브라우저 실제 왕복(관리자 로그인 → `/admin` → 목록 → 완료로 칸 열림)은 아직 검증하지 못했습니다. BE + DB를 띄우고 관리자 계정으로 한 번 돌려봐야 합니다.

확인 예정 항목:
- 일반 USER로 `/admin` 접근 → 홈으로 리다이렉트
- ADMIN으로 접근 → 콘솔 표시, 두 탭 목록 로드
- 채택/완료/반려 후 목록에서 즉시 사라짐
- 증빙 사진 썸네일 렌더 (remotePatterns 호스트 확인)

## 🔍 리뷰 포인트

**반려 사유 입력이 `window.prompt`(임시)입니다**
BE가 `{reason}`을 요구해서 우선 `prompt`로 받습니다. 앱 톤에 맞는 `BottomSheet` 입력으로 바꾸면 좋겠습니다.

**`next.config.mjs` remotePatterns 호스트 확인 필요**
BE `S3PresignedUrlService`가 만드는 presigned URL의 실제 호스트와 허용 패턴(`**.s3.ap-northeast-2.amazonaws.com` 등)이 맞는지 봐주세요. 안 맞으면 이미지가 깨집니다.

**BE PR과 함께 동작합니다**
관리자 계정 승격은 UI가 없어 DB에서 `UPDATE users SET role='ADMIN'` 후 재로그인이 필요합니다(BE PR 참고).

## 참고사항

- 관리자 진입 링크(네비 등)는 아직 없습니다. 지금은 `/admin` 직접 접근이며, 필요하면 별도로 추가하겠습니다.
- 제보를 생성하는 사용자 쪽 UI는 이 PR 범위가 아닙니다(콘솔은 소비만).
