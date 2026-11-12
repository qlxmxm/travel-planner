// [로그인] 회원가입 화면
// 이메일(= 로그인 아이디), 이름, 비밀번호, 비밀번호 확인 → useAuth().register() → 성공하면 /login 으로 이동
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import useSubmit from '../../hooks/useSubmit.js';
import AuthShell from './AuthShell.jsx';
import { FormError, IconField, PasswordInput } from './AuthFields.jsx';
import PasswordStrength from './PasswordStrength.jsx';
import { icons } from './authIcons.jsx';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 4;

// 문제가 있으면 안내 문구를, 없으면 null 을 돌려줍니다.
function getRegisterError({ email, name, password, passwordConfirm }) {
  if (!EMAIL_PATTERN.test(email.trim())) return '이메일 형식이 올바르지 않습니다';
  if (!name.trim()) return '이름을 입력해 주세요';
  if (password.length < MIN_PASSWORD_LENGTH) return `비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다`;
  if (password !== passwordConfirm) return '비밀번호가 서로 다릅니다';
  return null;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', password: '', passwordConfirm: '' });
  const handleChange = (field) => (e) => setForm((current) => ({ ...current, [field]: e.target.value }));

  const { busy, error, handleSubmit } = useSubmit(async () => {
    const errorMessage = getRegisterError(form);
    if (errorMessage) throw new Error(errorMessage);
    await register(form.email.trim(), form.name.trim(), form.password);      // 이미 가입된 이메일이면 409 메시지가 error 로 나옵니다
    navigate('/login', { state: { registered: true, email: form.email.trim() } });
  });

  const isPasswordMismatch = form.passwordConfirm && form.password !== form.passwordConfirm;
  return (
    <AuthShell>
      <p className="auth-kicker">JOIN</p>
      <h1>여행을 시작해 볼까요?</h1>
      <p className="auth-sub">1분이면 가입할 수 있어요.</p>
      <form onSubmit={handleSubmit} noValidate>
        <IconField icon={icons.mail} label="이메일 (아이디)">
          <input type="email" name="u_email" autoComplete="username" value={form.email} onChange={handleChange('email')} placeholder="example@email.com" />
        </IconField>
        <IconField icon={icons.user} label="이름 (닉네임)">
          <input name="u_name" value={form.name} onChange={handleChange('name')} maxLength={100} placeholder="여행기에 표시될 이름" />
        </IconField>
        <IconField icon={icons.lock} label="비밀번호">
          <PasswordInput name="u_pw" autoComplete="new-password" value={form.password} onChange={handleChange('password')} placeholder="4자 이상" />
        </IconField>
        <PasswordStrength value={form.password} />
        <IconField icon={icons.lock} label="비밀번호 확인" hint={isPasswordMismatch ? '비밀번호가 서로 달라요' : ''}>
          <PasswordInput name="u_pw2" autoComplete="new-password" value={form.passwordConfirm} onChange={handleChange('passwordConfirm')} placeholder="한 번 더 입력" />
        </IconField>
        <FormError message={error} />
        <button className="btn btn--primary btn--block auth-submit" type="submit" disabled={busy}>{busy ? '가입 중…' : '가입하기'}</button>
      </form>
      <p className="auth-foot">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </AuthShell>
  );
}
