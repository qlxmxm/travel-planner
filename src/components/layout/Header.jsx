// [공통] 상단 헤더
import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Header() {
  const { isLoggedIn, user } = useAuth();
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-logo">여행<b>플래너</b></Link>
        <nav className="app-nav" aria-label="주요 메뉴">
          <NavLink to="/" end>홈</NavLink>
          <NavLink to="/trips">여행계획</NavLink>
          <NavLink to="/journals">여행기</NavLink>
          <NavLink to="/places">장소</NavLink>
        </nav>
        <div className="app-header__auth">
          {isLoggedIn ? (
            <Link to="/login" className="btn btn--small" title="로그인 화면으로 이동">{user.user_name} 님</Link>
          ) : (
            <>
              <Link to="/login" className="btn btn--small">로그인</Link>
              <Link to="/register" className="btn btn--small btn--primary">회원가입</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
