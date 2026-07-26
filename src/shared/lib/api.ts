// 공통 API 클라이언트
// BASE URL은 환경변수(NEXT_PUBLIC_API_BASE_URL), 기본은 로컬 BE(8080)

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export type ApiError = { code: string; message: string };

export class ApiException extends Error {
  readonly code: string;

  constructor(error: ApiError) {
    super(error.message);
    this.name = "ApiException";
    this.code = error.code;
  }
}

type ApiEnvelope<T> =
  | { success: true; data: T }
  | { success: false; error: ApiError };

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  const body: ApiEnvelope<T> = await res.json();
  if (!body.success) throw new ApiException(body.error);
  return body.data;
}
