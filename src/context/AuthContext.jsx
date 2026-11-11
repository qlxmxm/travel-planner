// [로그인] 로그인 상태 보관소. 다른 사람은 const { user } = useAuth() 로 "누가 로그인했는지"만 가져다 쓰면 됩니다.
// 샘플 모드/서버 모드 구분은 api/authApi.js 가 맡고, 여기서는 결과(user)를 보관만 합니다.
import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(authApi.initialUser);
  const [ready, setReady] = useState(authApi.initialUser !== null);   // 앱 시작 때 토큰 확인이 끝났는지

  useEffect(() => {
    authApi.restoreUser().then(setUser).finally(() => setReady(true));
  }, []);

  // 로그인/가입에 실패하면 Error(message) 를 던집니다. 화면에서 catch 해서 보여주세요.
  async function login(email, password) {
    setUser(await authApi.login(email, password));
  }

  async function register(email, name, password) {
    await authApi.register(email, name, password);
  }

  async function logout() {
    setUser(await authApi.logout());
  }

  const value = { user, ready, isLoggedIn: !!user, login, register, logout };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다');
  return ctx;
}
