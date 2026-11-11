// [로그인] 로그인 관련 데이터 출처. 화면/Context 는 sampleAuth 인지 apiAuth 인지 몰라도 되게 같은 함수 이름으로 맞춰 둡니다.
// 실제 서버와 연결하려면 USE_API 를 true 로 바꾸세요. (백엔드: src/backend/login/router.py)
import { request, getToken, setToken } from './client.js';

const USE_API = false;

// 샘플 사용자. 다른 화면들이 user.user_id / user.user_name 을 쓰고 있어서 이름을 그대로 둡니다.
const SAMPLE_USER = { user_id: 1, user_name: '홍길동', user_email: 'hong@example.com' };

// 서버가 주는 {u_id, u_email, u_name} 을 화면에서 쓰는 모양으로 바꿈
const toUser = (apiUser) => ({ user_id: apiUser.u_id, user_name: apiUser.u_name, user_email: apiUser.u_email });

// 샘플 모드: 처음부터 홍길동으로 로그인된 것처럼 움직입니다. (다른 역할의 화면 개발용)
const sampleAuth = {
  initialUser: SAMPLE_USER,
  restoreUser: async () => SAMPLE_USER,
  login: async (email) => ({ ...SAMPLE_USER, user_email: email }),
  register: async () => {},
  logout: async () => SAMPLE_USER,            // 샘플 모드에서는 계속 홍길동
};

// API 모드: 서버와 JWT 로 통신합니다. 실패하면 Error(message) 를 던집니다.
const apiAuth = {
  initialUser: null,
  async restoreUser() {                        // 새로고침해도 로그인 유지: 저장된 토큰으로 내 정보를 다시 가져옴
    if (!getToken()) return null;
    try {
      return toUser(await request('/users/me'));
    } catch {
      setToken(null);
      return null;
    }
  },
  async login(email, password) {
    const { access_token: accessToken } = await request('/auth/login', { method: 'POST', body: { u_email: email, u_pw: password } });
    setToken(accessToken);
    return toUser(await request('/users/me'));
  },
  async register(email, name, password) {
    await request('/auth/register', { method: 'POST', body: { u_email: email, u_name: name, u_pw: password } });
  },
  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch { /* 이미 만료됐어도 로그아웃은 진행 */ }
    setToken(null);
    return null;
  },
};

export const authApi = USE_API ? apiAuth : sampleAuth;
