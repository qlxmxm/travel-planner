// [공통] 백엔드 호출 함수. 모든 API는 이 request()를 통해 호출합니다.
// vite.config.js 의 proxy 덕분에 '/api/...' → FastAPI(localhost:8000) 로 전달됩니다.
// [로그인] 로그인 토큰(JWT)은 localStorage 에 저장하고, 있으면 Authorization: Bearer 헤더를 자동으로 붙입니다.
const BASE = '/api';
const TOKEN_KEY = 'access_token';

export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* 저장소를 못 쓰는 환경이면 무시 */ }
}

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const token = getToken();
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    // FastAPI 검증 오류(422)는 detail 이 배열이라 문자열이 아닐 수 있음
    const msg = typeof err.detail === 'string' ? err.detail : null;
    throw new Error(msg || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
