// [로그인] 내 정보 패널 - 비밀번호 변경 (서버 저장: PUT /api/users/me/password)
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';

const EMPTY_PASSWORDS = { current: '', next: '', again: '' };

export default function PasswordSection() {
  const { changePassword } = useAuth();
  const [open, setOpen] = useState(false);
  const [pw, setPw] = useState(EMPTY_PASSWORDS);
  const [message, setMessage] = useState(null);  // { ok, text }
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!pw.current) return setMessage({ ok: false, text: '현재 비밀번호를 입력해 주세요.' });
    if (pw.next.length < 4) return setMessage({ ok: false, text: '새 비밀번호는 4자 이상이어야 해요.' });
    if (pw.next !== pw.again) return setMessage({ ok: false, text: '새 비밀번호가 서로 달라요.' });
    setBusy(true);
    try { await changePassword(pw.current, pw.next); setPw(EMPTY_PASSWORDS); setMessage({ ok: true, text: '비밀번호를 바꿨어요.' }); }
    catch (err) { setMessage({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  };

  return (
    <div className="drawer__sec">
      <button type="button" className="drawer__toggle" aria-expanded={open} onClick={() => { setOpen((v) => !v); setMessage(null); }}>
        비밀번호 변경 <span aria-hidden="true">{open ? '▴' : '▾'}</span>
      </button>
      {open && (
        <form onSubmit={submit} className="drawer__pw">
          <input type="password" autoComplete="current-password" placeholder="현재 비밀번호" aria-label="현재 비밀번호" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 (4자 이상)" aria-label="새 비밀번호" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
          <input type="password" autoComplete="new-password" placeholder="새 비밀번호 확인" aria-label="새 비밀번호 확인" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
          {message && <p className={message.ok ? 'drawer__ok' : 'drawer__err'} role="status">{message.text}</p>}
          <button type="submit" className="btn btn--primary btn--small" disabled={busy}>비밀번호 변경</button>
        </form>
      )}
    </div>
  );
}
