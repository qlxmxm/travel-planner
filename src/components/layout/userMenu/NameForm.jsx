// [로그인] 내 정보 패널 - 이름 수정 (서버 저장: PUT /api/users/me)
import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext.jsx';

export default function NameForm() {
  const { user, updateName } = useAuth();
  const [name, setName] = useState(user.user_name);
  const [message, setMessage] = useState(null);  // { ok, text }
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setMessage({ ok: false, text: '이름을 입력해 주세요.' });
    if (name.trim() === user.user_name) return setMessage({ ok: false, text: '지금 이름과 같아요.' });
    setBusy(true);
    try { await updateName(name.trim()); setMessage({ ok: true, text: '이름을 바꿨어요.' }); }
    catch (err) { setMessage({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  };

  return (
    <form className="drawer__sec" onSubmit={submit}>
      <label htmlFor="drawer-name">이름</label>
      <div className="drawer__row">
        <input id="drawer-name" value={name} onChange={(e) => { setName(e.target.value); setMessage(null); }} maxLength={100} />
        <button type="submit" className="btn btn--primary btn--small" disabled={busy}>저장</button>
      </div>
      {message && <p className={message.ok ? 'drawer__ok' : 'drawer__err'} role="status">{message.text}</p>}
    </form>
  );
}
