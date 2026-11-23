// [로그인] 헤더 오른쪽 위 "○○님" 버튼 → 오른쪽에서 부드럽게 열리는 "내 정보" 패널: 이름 수정 / 비밀번호 변경 / 로그아웃.
//  - 서버 저장: PUT /api/users/me(이름), PUT /api/users/me/password(비밀번호). 이름을 바꾸면 헤더 이름도 바로 바뀝니다.
//  - 헤더에 blur(backdrop-filter)가 걸려 있어서 패널을 그 안에 그리면 position: fixed 가 헤더 크기에 갇혀 잘립니다.
//    그래서 createPortal 로 body 에 직접 그립니다.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const SLIDE_MS = 260;

export default function UserMenu() {
  const { user, logout, updateName, changePassword } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false); // 화면에 그려져 있는지
  const [shown, setShown] = useState(false);     // 슬라이드로 들어온 상태인지 (애니메이션용)
  const [name, setName] = useState('');
  const [nameMsg, setNameMsg] = useState(null);  // { ok, text }
  const [pwOpen, setPwOpen] = useState(false);
  const [pw, setPw] = useState({ current: '', next: '', again: '' });
  const [pwMsg, setPwMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = () => {
    setName(user.user_name); setNameMsg(null); setPwOpen(false); setPw({ current: '', next: '', again: '' }); setPwMsg(null);
    setMounted(true);
    requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
  };
  const close = () => { setShown(false); setTimeout(() => setMounted(false), SLIDE_MS); };

  useEffect(() => {
    if (!mounted) return undefined;
    const esc = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [mounted]);

  const saveName = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setNameMsg({ ok: false, text: '이름을 입력해 주세요.' });
    if (name.trim() === user.user_name) return setNameMsg({ ok: false, text: '지금 이름과 같아요.' });
    setBusy(true);
    try { await updateName(name.trim()); setNameMsg({ ok: true, text: '이름을 바꿨어요.' }); }
    catch (err) { setNameMsg({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  };
  const savePw = async (e) => {
    e.preventDefault();
    if (!pw.current) return setPwMsg({ ok: false, text: '현재 비밀번호를 입력해 주세요.' });
    if (pw.next.length < 4) return setPwMsg({ ok: false, text: '새 비밀번호는 4자 이상이어야 해요.' });
    if (pw.next !== pw.again) return setPwMsg({ ok: false, text: '새 비밀번호가 서로 달라요.' });
    setBusy(true);
    try { await changePassword(pw.current, pw.next); setPw({ current: '', next: '', again: '' }); setPwMsg({ ok: true, text: '비밀번호를 바꿨어요.' }); }
    catch (err) { setPwMsg({ ok: false, text: err.message }); }
    finally { setBusy(false); }
  };
  const doLogout = async () => { close(); await logout(); navigate('/'); };

  return (
    <>
      <button type="button" className="btn btn--small" aria-haspopup="dialog" aria-expanded={mounted} onClick={open}>{user.user_name} 님</button>
      {mounted && createPortal(
        <div className={`drawer-back${shown ? ' on' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <aside className={`drawer${shown ? ' on' : ''}`} role="dialog" aria-modal="true" aria-label="내 정보">
            <div className="drawer__head">
              <h2>내 정보</h2>
              <button type="button" className="chat__close" onClick={close} aria-label="닫기">✕</button>
            </div>

            <div className="drawer__me">
              <Avatar name={user.user_name} />
              <div><b>{user.user_name}</b><span>{user.user_email}</span></div>
            </div>

            <form className="drawer__sec" onSubmit={saveName}>
              <label htmlFor="drawer-name">이름</label>
              <div className="drawer__row">
                <input id="drawer-name" value={name} onChange={(e) => { setName(e.target.value); setNameMsg(null); }} maxLength={100} />
                <button type="submit" className="btn btn--primary btn--small" disabled={busy}>저장</button>
              </div>
              {nameMsg && <p className={nameMsg.ok ? 'drawer__ok' : 'drawer__err'} role="status">{nameMsg.text}</p>}
            </form>

            <div className="drawer__sec">
              <button type="button" className="drawer__toggle" aria-expanded={pwOpen} onClick={() => { setPwOpen((v) => !v); setPwMsg(null); }}>
                비밀번호 변경 <span aria-hidden="true">{pwOpen ? '▴' : '▾'}</span>
              </button>
              {pwOpen && (
                <form onSubmit={savePw} className="drawer__pw">
                  <input type="password" autoComplete="current-password" placeholder="현재 비밀번호" aria-label="현재 비밀번호" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} />
                  <input type="password" autoComplete="new-password" placeholder="새 비밀번호 (4자 이상)" aria-label="새 비밀번호" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} />
                  <input type="password" autoComplete="new-password" placeholder="새 비밀번호 확인" aria-label="새 비밀번호 확인" value={pw.again} onChange={(e) => setPw({ ...pw, again: e.target.value })} />
                  {pwMsg && <p className={pwMsg.ok ? 'drawer__ok' : 'drawer__err'} role="status">{pwMsg.text}</p>}
                  <button type="submit" className="btn btn--primary btn--small" disabled={busy}>비밀번호 변경</button>
                </form>
              )}
            </div>

            <div className="drawer__foot">
              <button type="button" className="btn drawer__logout" onClick={doLogout}>로그아웃</button>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
