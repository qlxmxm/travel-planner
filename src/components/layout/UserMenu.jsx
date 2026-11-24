// [로그인] 헤더 오른쪽 위 "○○님" 버튼 → 오른쪽에서 부드럽게 열리는 "내 정보" 패널: 이름 수정 / 비밀번호 변경 / 로그아웃.
//  - 이름 수정은 userMenu/NameForm.jsx, 비밀번호 변경은 userMenu/PasswordSection.jsx 에 있습니다. 이름을 바꾸면 헤더 이름도 바로 바뀝니다.
//  - 헤더에 blur(backdrop-filter)가 걸려 있어서 패널을 그 안에 그리면 position: fixed 가 헤더 크기에 갇혀 잘립니다.
//    그래서 createPortal 로 body 에 직접 그립니다.
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import Avatar from '../common/Avatar.jsx';
import NameForm from './userMenu/NameForm.jsx';
import PasswordSection from './userMenu/PasswordSection.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const SLIDE_MS = 260;

export default function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false); // 화면에 그려져 있는지 (닫으면 이름·비밀번호 입력값도 같이 초기화)
  const [shown, setShown] = useState(false);     // 슬라이드로 들어온 상태인지 (애니메이션용)

  const open = () => {
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

            <NameForm />
            <PasswordSection />

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
