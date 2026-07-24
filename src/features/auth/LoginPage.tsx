'use client';

/**
 * 소셜 로그인 화면.
 * 핵심: 각 버튼은 fetch가 아니라 "페이지 이동"으로 BE의 OAuth2 시작 URL로 보낸다.
 * (BE가 프로바이더 로그인 → 콜백 → JWT 쿠키 세팅 → /oauth/callback 리다이렉트까지 처리)
 */

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type Provider = 'google' | 'kakao' | 'naver';

const PROVIDERS: { key: Provider; label: string; className: string }[] = [
  { key: 'kakao', label: '카카오로 시작하기', className: 'bg-[#FEE500] text-black' },
  { key: 'naver', label: '네이버로 시작하기', className: 'bg-[#03C75A] text-white' },
  { key: 'google', label: 'Google로 시작하기', className: 'bg-white text-black border border-gray-300' },
];

export function LoginPage() {
  // 버튼 클릭 시 BE OAuth2 엔드포인트로 브라우저를 통째로 이동시킨다.
  const startLogin = (provider: Provider) => {
    window.location.href = `${API_BASE}/oauth2/authorization/${provider}`;
  };

  return (
    <main className="flex h-full flex-col items-center justify-center gap-8 px-6">
      <header className="text-center">
        <h1 className="font-display text-3xl">먹킷리스트 도감</h1>
        <p className="mt-2 text-sm text-gray-500">
          먹은 음식을 도감으로 모아 보세요
        </p>
      </header>

      <div className="flex w-full max-w-xs flex-col gap-3">
        {PROVIDERS.map(({ key, label, className }) => (
          <button
            key={key}
            type="button"
            onClick={() => startLogin(key)}
            className={`h-12 rounded-lg text-sm font-medium ${className}`}>
            {label}
          </button>
        ))}
      </div>
    </main>
  );
}