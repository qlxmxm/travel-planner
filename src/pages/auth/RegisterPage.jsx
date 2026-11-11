// [로그인] 회원가입 화면
// 이메일(= 로그인 아이디), 이름, 비밀번호, 비밀번호 확인 → useAuth().register() → 성공하면 /login 으로 이동
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { AuthShell, IconField, PasswordInput, Strength, icons } from './AuthParts.jsx';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', name: '', pw: '', pw2: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  function validate() {
    if (!EMAIL_RE.test(form.email.trim())) return '이메일 형식이 올바르지 않습니다';
    if (!form.name.trim()) return '이름을 입력해 주세요';
    if (form.pw.length < 4) return '비밀번호는 4자 이상이어야 합니다';
    if (form.pw !== form.pw2) return '비밀번호가 서로 다릅니다';
    return '';
  }

  async function onSubmit(e) {
    e.preventDefault();
    const msg = validate();
    if (msg) { setError(msg); return; }
    setBusy(true); setError('');
    try {
      await register(form.email.trim(), form.name.trim(), form.pw);
      navigate('/login', { state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      setError(err.message);                      // 예: 이미 가입된 이메일입니다 (409)
    } finally {
      setBusy(false);
    }
  }

  const mismatch = form.pw2 && form.pw !== form.pw2;
  return (
    <AuthShell>
      <p className="auth-kicker">JOIN</p>
      <h1>여행을 시작해 볼까요?</h1>
      <p className="auth-sub">1분이면 가입할 수 있어요.</p>
      <form onSubmit={onSubmit} noValidate>
        <IconField icon={icons.mail} label="이메일 (아이디)">
          <input type="email" name="u_email" autoComplete="username" value={form.email} onChange={set('email')} placeholder="example@email.com" />
        </IconField>
        <IconField icon={icons.user} label="이름 (닉네임)">
          <input name="u_name" value={form.name} onChange={set('name')} maxLength={100} placeholder="여행기에 표시될 이름" />
        </IconField>
        <IconField icon={icons.lock} label="비밀번호">
          <PasswordInput name="u_pw" autoComplete="new-password" value={form.pw} onChange={set('pw')} placeholder="4자 이상" />
        </IconField>
        <Strength value={form.pw} />
        <IconField icon={icons.lock} label="비밀번호 확인" hint={mismatch ? '비밀번호가 서로 달라요' : ''}>
          <PasswordInput name="u_pw2" autoComplete="new-password" value={form.pw2} onChange={set('pw2')} placeholder="한 번 더 입력" />
        </IconField>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="btn btn--primary btn--block auth-submit" type="submit" disabled={busy}>{busy ? '가입 중…' : '가입하기'}</button>
      </form>
      <p className="auth-foot">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </AuthShell>
  );
}
