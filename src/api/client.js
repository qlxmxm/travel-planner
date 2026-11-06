// [공통] 백엔드 호출 함수. 모든 API는 이 request()를 통해 호출합니다.
// vite.config.js 의 proxy 덕분에 '/api/...' → FastAPI(localhost:8000) 로 전달됩니다.
// TODO(로그인): 로그인 후 토큰이 있으면 Authorization: Bearer <token> 헤더 자동 추가
const BASE = '/api';

export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `요청 실패 (${res.status})`);
  }
  return res.status === 204 ? null : res.json();
}
