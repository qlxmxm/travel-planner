// [로그인] 로그인 상태 보관소 (지금은 뼈대만 있음)
// TODO(로그인): login/register/logout 구현 → JWT를 localStorage에 저장, 앱 시작 시 /auth/me 로 복원
// 다른 사람은 const { user } = useAuth() 로 "누가 로그인했는지"만 가져다 쓰면 됩니다.
import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // 템플릿 단계에서는 임시 사용자. 실제 로그인 구현 시 null 로 시작하게 바꾸기
  const [user] = useState({ user_id: 1, user_name: '홍길동' });

  const value = {
    user,
    isLoggedIn: !!user,
    login: async () => { /* TODO(로그인) */ },
    register: async () => { /* TODO(로그인) */ },
    logout: () => { /* TODO(로그인) */ },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth는 AuthProvider 안에서만 쓸 수 있습니다');
  return ctx;
}
