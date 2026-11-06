// [공통] 모든 페이지를 감싸는 틀: 헤더 + 본문(Outlet) + 푸터 (PC 웹 전용)
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

export default function Layout() {
  const { pathname } = useLocation();
  const wide = pathname === '/'; // 홈은 가로 전체를 쓰는 소개 화면
  return (
    <div className="app-shell">
      <Header />
      <main className={wide ? 'app-main app-main--wide' : 'app-main'}><Outlet /></main>
      <Footer />
    </div>
  );
}
