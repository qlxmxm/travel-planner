// [로그인] 로그인 화면
// 이메일(= 로그인 아이디) + 비밀번호 → useAuth().login() → 성공하면 /trips 로 이동
// 헤더의 "홍길동 님" 을 누르면 이 화면으로 옵니다.
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useSubmit from '../../hooks/useSubmit.js';
import AuthShell from './AuthShell.jsx';
import { FormError, IconField, PasswordInput } from './AuthFields.jsx';
import { icons } from './authIcons.jsx';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();               // 회원가입 직후라면 { registered: true }
  const [email, setEmail] = useState(state?.email || '');
  const [password, setPassword] = useState('');

  const { busy, error, handleSubmit } = useSubmit(async () => {
    if (!email.trim() || !password) throw new Error('이메일과 비밀번호를 입력해 주세요');
    await login(email.trim(), password);
    navigate('/trips');
  });

  return (
    <AuthShell>
      <p className="auth-kicker">WELCOME BACK</p>
      <h1>다시 만나서 반가워요</h1>
      <p className="auth-sub">로그인하고 여행 계획을 이어서 만들어 보세요.</p>
      {state?.registered && <p className="form-ok">가입이 완료되었습니다. 로그인해 주세요.</p>}
      {user && <p className="auth-now">지금은 <b>{user.user_name}</b> 님으로 로그인되어 있어요. (샘플)</p>}
      <form onSubmit={handleSubmit} noValidate>
        <IconField icon={icons.mail} label="이메일 (아이디)">
          <input type="email" name="u_email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="example@email.com" />
        </IconField>
        <IconField icon={icons.lock} label="비밀번호">
          <PasswordInput name="u_pw" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호를 입력해 주세요" />
        </IconField>
        <FormError message={error} />
        <button className="btn btn--primary btn--block auth-submit" type="submit" disabled={busy}>{busy ? '로그인 중…' : '로그인'}</button>
      </form>
      <p className="auth-foot">아직 계정이 없나요? <Link to="/register">회원가입</Link></p>
    </AuthShell>
  );
}
