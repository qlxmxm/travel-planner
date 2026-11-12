// [로그인] 로그인·회원가입이 같이 쓰는 틀: 왼쪽 여행 소개 + 오른쪽 children(폼)
import hero from '../../assets/photos/cta.jpg';
import { icons } from './authIcons.jsx';

export default function AuthShell({ children }) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <aside className="auth-visual" style={{ backgroundImage: `url(${hero})` }}>
          <div className="auth-visual__shade" />
          <div className="auth-visual__body">
            <span className="auth-eyebrow">{icons.plane} TRAVEL PLANNER</span>
            <h2>여행은 계획부터<br />이야기까지</h2>
            <p>일정을 짜고, 예산을 관리하고,<br />다녀온 뒤엔 여행기로 남겨 보세요.</p>
            <ul className="auth-points">
              <li><span>{icons.plan}</span><div><b>날짜별 일정</b><small>Day별로 장소와 시간을 정리해요</small></div></li>
              <li><span>{icons.wallet}</span><div><b>예산 가계부</b><small>쓴 돈과 남은 돈을 한눈에</small></div></li>
              <li><span>{icons.book}</span><div><b>여행기</b><small>일정 그대로 가져와 추억으로 남겨요</small></div></li>
            </ul>
          </div>
          <div className="auth-ticket" aria-hidden="true">
            <div className="auth-ticket__top"><b>도쿄 3박 4일</b><span>D-12</span></div>
            <div className="auth-ticket__row"><i style={{ background: 'var(--m3)' }} />09:00 인천공항 출발</div>
            <div className="auth-ticket__row"><i style={{ background: 'var(--m1)' }} />13:30 아사쿠사 산책</div>
            <div className="auth-ticket__row"><i style={{ background: 'var(--m5)' }} />19:00 이치란 라멘</div>
          </div>
        </aside>
        <section className="auth-form">{children}</section>
      </div>
    </div>
  );
}
