# 캣칫 CatchEat - Frontend

> 먹은 음식을 사진으로 남겨 **도감으로 모으는** 수집형 기록 서비스

| | |
| --- | --- |
| 서비스 | <https://projectjm.co.kr> |
| API | <https://api.projectjm.co.kr> |
| API 문서 | <https://api.projectjm.co.kr/swagger-ui.html> |
| 백엔드 저장소 | [`AIBE6_FinalProject_Team02_BE`](https://github.com/prgrms-aibe-devcourse/AIBE6_FinalProject_Team02_BE) |
| 기간 | 2026-07-16 ~ 2026-08-28 |

---

## 목차

1. [프로젝트 개요](#1-프로젝트-개요)
2. [주요 기능](#2-주요-기능)
3. [기술 스택](#3-기술-스택)
4. [시스템 아키텍처](#4-시스템-아키텍처)
5. [디자인 시스템](#5-디자인-시스템)
6. [API 연동](#6-api-연동)
7. [프로젝트 구조](#7-프로젝트-구조)
8. [Jira 협업 구조](#8-jira-협업-구조)

---

## 1. 프로젝트 개요

### 무엇을 만들었나

사진 한 장을 AI가 판별해 도감 칸을 열고, 그 기록을 혼자 또는 함께 쌓는다.
같은 "기록"이라도 **성격이 다른 세 종류의 도감**으로 나눴다.

| | **베이짓** | **로그잇** | **챌린짓** |
| --- | --- | --- | --- |
| 성격 | 개인 수집 | 1~6인 **공동 기록** | 다인 참여 **시즌 경쟁** |
| 칸 목록 | 운영진 지정 **138칸 고정** | 유저가 직접 정의 | 개설자가 지정 |
| AI 판별 | O | **X** | **X → 위치 인증** |
| 진행률·수집률 | O | **X** | O |
| 소셜 | 없음 | 초대 · 댓글 · 좋아요 · 하루 카드 | 리뷰 · 좋아요 · 랭킹 |

**모바일 우선 PWA다.** 홈 화면에 설치하면 주소창 없이 뜨고, 화면은 실제 기기 폭(390px)을 기준으로 짰다.

### 팀 구성과 역할

| 이름 | 담당 영역 | 주요 화면 |
| --- | --- | --- |
| 정연수 / [`@tke0329`](https://github.com/tke0329) | 인프라 · 로그잇 · 베이짓 · 알림 | `/made` `/basicDex` 알림 |
| 윤하빈 / [`@yunabin`](https://github.com/yunabin) | 로그잇 · 등록 플로우(AI 판별) · 일러스트 | `/made` `/register` `/illustration` |
| 신재희 / [`@SHINJAEHEE-DEV`](https://github.com/SHINJAEHEE-DEV) | 챌린짓 · 인증/인가 · 관리자 콘솔 | `/challenge` `/login` `/admin` |
| 김락현 / [`@Rakhyunn`](https://github.com/Rakhyunn) | 마이페이지 · 뱃지 · 공통 UI · 온보딩 | `/my` `/users` `/ui-check` |

---

## 2. 주요 기능

| 베이짓 | 로그잇 | 챌린짓 |
| :---: | :---: | :---: |
| <img width="200" height="400" alt="베이짓" src="https://github.com/user-attachments/assets/b93b242c-6ef3-47bf-a406-0220d8dcfb18" /> | <img width="200" height="400" alt="로그잇" src="https://github.com/user-attachments/assets/236ffe24-e471-4385-bd01-6c0f1e79db2a" /> | <img width="200" height="400" alt="챌린짓" src="https://github.com/user-attachments/assets/320cd8a7-dcb3-4362-9bc9-790c4d1a2242" /> |
| 138칸 도감 · 수집률 | 하루 식탁 · 하루 카드 | 위치 인증 · 랭킹 |

### 2.1 등록 플로우 — 사진 → AI 판별 → 칸 해금

`/register → /analyze → /record → /unlock` 네 단계 마법사다.

- 사진은 **서버를 거치지 않는다.** presigned URL을 받아 브라우저에서 S3로 직접 올린다
- 업로드 전에 브라우저에서 **리사이즈·압축**한다 (장변 512px · JPEG 0.8). 512를 넘기면 AI 비용의 타일 수가 1개에서 4개로 뛴다
- 도감 검색은 **초성·별칭**으로 찾는다. 별칭 사전은 등록 화면에서만 받아 그리드에는 싣지 않는다

### 2.2 로그잇 — 하루 카드를 브라우저에서 만든다

**핵심 구현 — 9:16 공유 영상을 서버가 아니라 클라이언트가 인코딩한다**

- 영상 인코딩은 CPU를 오래 잡는 작업이라 API 서버에 올리면 그동안 다른 요청을 막는다
- `mediabunny`로 **브라우저에서 MP4를 굽고**, 실패하면 PNG로 폴백한다
- 작업이 사용자 기기에 분산되므로 서버는 사진 URL만 내려주면 된다

> `src/features/made/share/encodeFilm.ts`

### 2.3 챌린짓 — 위치 인증과 랭킹

- 해금 인증에 **현재 좌표**를 함께 보낸다. 서버가 슬롯 좌표와의 거리를 재서 80m 이내인지 판정한다
- 탐색 목록은 **최근 7일** 기준 조회 · 참여 · 해금 세 축으로 정렬한다. 무한 스크롤로 이어 받는다
- 개설 시 보상 뱃지를 직접 만들 수 있고, 이미지도 presigned로 올린다

### 2.4 실시간 알림

- 로그인하면 **WebSocket**으로 붙어 댓글 · 좋아요 · 기록 업로드 · 친구 요청 알림을 받는다
- 알림 뱃지(안 읽은 수)는 소켓 수신과 목록 조회 두 경로로 갱신된다

> `src/features/notification/realtime.ts`

### 2.5 마이페이지 · 온보딩

- 프로필 사진은 **원형 크롭**해서 올리고, 없으면 닉네임 첫 글자를 보여준다
- 대표 뱃지를 닉네임 옆에 장착한다
- 내 활동 내역(쓴 리뷰 · 댓글, 좋아요한 것)을 한곳에서 본다
- 첫 방문 화면마다 **코치마크**를 띄우고, 본 가이드는 키 단위로 서버에 기록한다

---

## 3. 기술 스택

| 구분 | 사용 기술 | 버전 |
| --- | --- | --- |
| 프레임워크 | Next.js (App Router) | 15.5 |
| 런타임 · UI | React · React DOM | 18.3 |
| 언어 | TypeScript (`strict: true`) | 5.7+ |
| 스타일 | Tailwind CSS · PostCSS · Autoprefixer | 3.4.17 |
| 디자인 토큰 | CSS 변수(`globals.css`) → Tailwind theme | — |
| 애니메이션 | framer-motion | 11.18 |
| 아이콘 | lucide-react | 0.522 |
| 클래스 유틸 | clsx · tailwind-merge | — |
| 날짜 | react-day-picker | 10.0 |
| **영상 인코딩** | **mediabunny** (브라우저 MP4) | 1.53 |
| **폰트 서브셋** | **subset-font** (빌드 스크립트) | 2.5 |
| 테스트 | Jest | 30.4 |
| 품질 | ESLint(`eslint-config-next`) · Prettier | — |
| 배포 | Vercel | — |

### 의도적으로 쓰지 않은 것

| 안 쓴 것 | 이유 |
| --- | --- |
| 상태관리 라이브러리 (Redux · Zustand) | 공유 상태가 한 덩어리라 **React Context**로 충분했다. 대신 컨텍스트를 좁게 쪼개 무관한 상태 변경에 화면이 함께 리렌더되지 않게 했다 |
| 컴포넌트 라이브러리 (MUI · shadcn) | 디자인 토큰 규칙을 강제하려고 **자체 atoms**를 만들었다. 색·모양은 prop으로만 바꾼다 |
| 데이터 페칭 라이브러리 (React Query · SWR) | 화면 수 대비 캐시 정책이 단순해 공통 `fetch` 클라이언트로 처리했다 |

**안 쓴 이유를 말할 수 있으면 쓴 이유도 믿긴다.**

---

## 4. 시스템 아키텍처

<img width="800" height="450" alt="시스템아키텍처" src="https://github.com/user-attachments/assets/1d22ac0f-891b-4454-9941-d6f55fd2db02" />

**프론트엔드가 서 있는 자리**

- nginx가 HTTPS(443)를 받아 프론트(3000)와 백엔드(8080)로 나눠 보낸다
- 브라우저는 API를 **직접 호출**한다. 인증은 httpOnly 쿠키라 `credentials: 'include'`로 실어 보낸다
- 사진은 **API 서버를 통과하지 않는다.** presigned URL을 받아 브라우저 → S3로 직접 올린다
- 알림은 WebSocket으로 서버에서 밀어 준다

---

## 5. 디자인 시스템

### 토큰

색은 하드코딩하지 않고 **시맨틱 토큰**으로 쓴다 (`text-content-primary`, `bg-action-primary`).
`globals.css`의 CSS 변수를 Tailwind theme에 연결해, 값이 바뀌면 화면 전체가 함께 바뀐다.

| 역할 | 의미 |
| --- | --- |
| 수박 핑크 `#FC6C85` | **하는 것** — 주 액션 |
| 새싹 초록 `#35A16B` | **된 것** — 진행 · 달성 |
| 뉴트럴 | 텍스트 · 배경 · 테두리 |
| 사람 색 7종 | 로그잇에서 작성자를 구분하는 파스텔 |

**대비(WCAG)를 값 옆에 주석으로 남긴다.** 예를 들어 보조 텍스트는 흰 배경에서 4.5:1을 넘겨야 해서
`#B5B5BA`(2.04:1)를 `#767679`로 올렸다. 값만 있으면 다음 사람이 다시 낮춘다.

### 공용 컴포넌트

```
shared/ui/
├── atoms/      Button · Text · TextField · Avatar · Badge · Chip · ProgressBar
│               SearchBar · Skeleton · StarRank · EquippedBadge · ServerBadge · HelpIcon
├── molecules/  조합 컴포넌트
├── feedback/   ToastProvider + useToast (layout에 배선돼 있음)
└── hooks/
```

- **`@/shared/ui` 배럴 하나로 가져다 쓴다.** `next.config.mjs`의 `optimizePackageImports`가
  실제 파일 import로 바꿔 줘서, 배럴을 써도 화면 하나가 공통 UI 전체를 끌고 오지 않는다
- **`/ui-check`** 페이지에서 모든 atoms의 variant를 한눈에 본다. 새 컴포넌트를 추가하면 여기에도 올린다
- 색·모양은 **prop으로 바꾼다.** 화면에서 임의로 클래스를 덧씌우지 않는다

### 폰트 — 6.1MB 한글 TTF를 조각내서 쓴다

서비스 폰트(온글잎 딩궁딩굴) 원본이 **6.1MB**라 그대로는 못 쓴다.
한글은 글자 수가 많아 woff2 변환만으로는 부족하고 **유니코드 구간별로 쪼개야** 한다.

- **0번 조각(핵심)** — 라틴 · 숫자 · 문장부호 · 자모 + **앱 소스에 실제로 등장하는 한글**.
  화면에 박혀 있는 문구는 전부 여기 들어가므로 첫 화면은 이 조각 하나로 그려진다
- **1번 이후** — 나머지 음절을 코드포인트 순서로 쪼개 필요할 때만 받는다

```bash
npm run build:font
```

### 일러스트 — 빌드 타임에 매니페스트를 굽는다

기본 도감 일러스트는 S3가 아니라 `public/illustrate`에서 서빙한다.
브라우저는 파일 존재를 미리 알 수 없어서, **빌드 때 실제로 있는 파일 목록을 구워** 런타임에 참조한다.

```bash
npm run build:illustrations   # predev · prebuild에서 자동 실행
```

`next.config.mjs`에서 일러스트에 하루 캐시를 물린다 — 도감은 한 화면에 칸이 수십 개라
매번 조건부 요청(304)이 왕복하면 그대로 체감된다.

### PWA

- 홈 화면 설치형에서는 **주소창이 없다.** 뒤로 가기를 화면 안에 두어야 하고, 그래서 상단 바를 직접 그린다
- 서비스워커(`public/sw.js`)는 **캐시 전략을 켜지 않았다.** 낡은 워커가 낡은 HTML을 붙잡으면 배포 후 흰 화면이 된다
- `sw.js`에는 `no-cache, no-store`를 박아 둔다. CDN이 물고 있으면 배포해도 새 워커가 안 내려온다

---

## 6. API 연동

### 공통 클라이언트

모든 요청은 `src/shared/lib/api.ts`의 공통 클라이언트를 거친다.

- **`credentials: 'include'`** — 인증은 httpOnly 쿠키라 브라우저가 알아서 실어 보낸다
- **응답 봉투를 벗겨서** `data`만 돌려주고, 실패는 예외로 던진다
- 서버 에러는 `ApiError(code, message)`로 감싼다. **`message`는 사용자 노출용, `code`는 분기용**이다

```ts
// 서버 공통 응답
interface ApiResponse<T> {
    success: boolean
    data: T | null
    error: { code: string; message: string } | null
}
```

### 핵심 구현 — 토큰 재발급을 single-flight로 묶는다

access가 만료되면 `401` → `/api/v1/auth/reissue` → **원요청 1회 재시도**로 복구한다.

문제는 화면 하나가 API를 여러 개 동시에 부를 때다. **전부 같이 401을 받으면 재발급도 동시에 여러 번 나간다.**
서버의 refresh 토큰은 회전(rotation)하므로, 동시 재발급은 서로의 토큰을 무효화해 **세션이 통째로 끊긴다.**

그래서 진행 중인 재발급 Promise를 공유해 **재발급은 한 번만** 나가게 했다.

```ts
let reissueInFlight: Promise<boolean> | null = null

function reissue(): Promise<boolean> {
    if (!reissueInFlight) {
        reissueInFlight = fetch(`${API_BASE}/api/v1/auth/reissue`, {
            method: 'POST',
            credentials: 'include',
        })
            .then((res) => res.ok)
            .catch(() => false)
            .finally(() => { reissueInFlight = null })
    }
    return reissueInFlight
}
```

재시도는 **딱 한 번만** 한다 — 무한 재시도로 서버를 두드리지 않기 위해서다.
재발급까지 실패하면 `UnauthorizedError`를 던져 호출부가 로그인 화면으로 보낸다.

> 이 동작은 `api.singleflight.test.ts`로 테스트한다.

### API 명세

전체 명세는 백엔드 Swagger에서 본다 — <https://api.projectjm.co.kr/swagger-ui.html>
25개 그룹 · 114개 오퍼레이션에 한국어 이름과 설명이 붙어 있다.

---

## 7. 프로젝트 구조

```
AIBE6_FinalProject_Team02_FE/
├── src/
│   ├── app/                      # App Router — 라우트와 레이아웃만
│   │   ├── basicDex · dex        # 베이짓 (도감 그리드 · 칸 상세)
│   │   ├── made                  # 로그잇 (식탁 · 하루 카드 · 참여자)
│   │   ├── challenge             # 챌린짓 (탐색 · 상세 · 개설)
│   │   ├── register              # 등록 플로우 (analyze → record → unlock)
│   │   ├── my · users · friends  # 마이페이지 · 공개 프로필 · 친구
│   │   ├── login · oauth         # 로그인 · 소셜 콜백
│   │   ├── illustration · admin  # AI 일러스트 · 관리자
│   │   └── ui-check              # 공용 컴포넌트 카탈로그
│   ├── features/                 # 도메인별 화면 로직 (12개)
│   │   └── <도메인>/              #   api.ts · types.ts · 컴포넌트
│   └── shared/
│       ├── ui/                   # atoms · molecules · feedback · hooks
│       ├── lib/                  # api.ts · routes.ts · upload.ts · dexSearch.ts …
│       ├── store/                # AppStateProvider (React Context)
│       ├── data/                 # 정적 데이터 (도감 · 뱃지 에셋)
│       └── pwa/                  # 서비스워커 등록
├── public/                       # fonts · illustrate · icon · badge · sw.js
├── scripts/                      # build-font · build-icons · build-illustration-manifest
└── assets/                       # 원본 에셋 (빌드 입력)
```

### 규칙

- **페이지(컨테이너)는 상태를 다루고, 프레젠테이셔널 컴포넌트는 props만 받는다**
- API 호출은 `shared/lib/api.ts` 공통 클라이언트로만
- 컴포넌트 `PascalCase` · 훅 `use~` · Context는 `~Context` + `use~` 훅으로만 소비
- 색은 시맨틱 토큰으로. 하드코딩한 hex를 넣지 않는다

### 실행

```bash
npm install
npm run dev            # http://localhost:3000
```

| 환경 변수 | 설명 |
| --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | 백엔드 주소. 없으면 `http://localhost:8080` |
| `NEXT_PUBLIC_TEST_LOGIN_ENABLED` | 심사용 로그인 버튼 노출 |

```bash
npm run build          # 프로덕션 빌드 (타입 검사 포함)
npm run lint           # ESLint
npm run test           # Jest
npm run format         # Prettier
```

> 로컬에서 API를 붙이려면 백엔드도 함께 띄워야 한다 — [백엔드 저장소](https://github.com/prgrms-aibe-devcourse/AIBE6_FinalProject_Team02_BE) 참고.

---

## 8. Jira 협업 구조

### 이슈 → 브랜치 → PR → 릴리즈

```
Jira 이슈 CATCHEAT-00
   └─ 브랜치  CATCHEAT-00/feat/담당자
        └─ PR (squash merge) → develop
             └─ 릴리즈 PR → main → [Release] Vn
```

브랜치 이름을 `CATCHEAT-<이슈번호>/<타입>/<담당자>`로 고정해서
**브랜치 · PR · 커밋이 전부 하나의 이슈 키로 이어진다.** 타입은 `feat` · `fix` · `chore`.

| 규칙 | |
| --- | --- |
| `main` | 보호. 직접 push · force push 금지 |
| 작업 → `develop` | PR + **squash merge** |
| `develop` → `main` | 릴리즈 PR, `[Release] Vn` 커밋으로 남긴다 |
| PR 본문 | 관련 이슈 / 작업 내용 / 스크린샷 · 테스트 결과 / 리뷰 포인트 (템플릿 4섹션) |

**FE는 PR에 화면 스크린샷을 붙인다.** 공용 컴포넌트를 건드린 PR은 `/ui-check` 캡처를 함께 올린다.

<!-- ▼ Jira 캡처 (docs/images/) -->

**타임라인 및 하위 목록 구성**

<img width="700" height="600" alt="image" src="https://github.com/user-attachments/assets/1dcaa26f-ae32-4d7f-b015-f1882a5b6e8d" />
<img width="600" height="550" alt="image" src="https://github.com/user-attachments/assets/bad62d0a-0ab4-425e-afb8-d673dafff1b8" />

**보드**

<img width="800" height="650" alt="image" src="https://github.com/user-attachments/assets/b538d3bb-3702-461e-9d18-c31f7cde3643" />

<!-- ▲ Jira 캡처 -->

### 코드 리뷰

PR마다 팀 리뷰를 거쳤고, CodeRabbit 자동 리뷰도 함께 받았다.
