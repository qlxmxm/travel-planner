// [로그인] 로그인·회원가입이 같이 쓰는 부품: 왼쪽 여행 소개 + 오른쪽 폼 틀, 아이콘 입력칸, 비밀번호 입력칸
import { useState } from 'react';
import hero from '../../assets/photos/cta.jpg';

const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);
export const icons = {
  mail: <Icon><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Icon>,
  lock: <Icon><rect x="4" y="10" width="16" height="10" rx="3" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></Icon>,
  user: <Icon><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></Icon>,
  eye: <Icon><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>,
  eyeOff: <Icon><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.2 7.7A16 16 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>,
  plan: <Icon><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>,
  wallet: <Icon><path d="M4 7a3 3 0 0 1 3-3h11v4" /><rect x="3" y="7" width="18" height="13" rx="3" /><circle cx="16.5" cy="13.5" r="1.2" /></Icon>,
  book: <Icon><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Z" /><path d="M9 8h6M9 12h6" /></Icon>,
  plane: <Icon><path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4-4a2 2 0 0 1 3 3l-4 4 .5 9L16 20.5l-2.5-7.5-3 3-1-2.5Z" /></Icon>,
};

// 왼쪽: 여행 플랫폼 소개 / 오른쪽: children(폼)
export function AuthShell({ children }) {
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

// 앞에 아이콘이 붙은 입력칸
export function IconField({ icon, label, hint, children }) {
  return (
    <label className="afield">
      <span className="afield__label">{label}</span>
      <span className="afield__box">
        <span className="afield__icon">{icon}</span>
        {children}
      </span>
      {hint && <small className="afield__hint">{hint}</small>}
    </label>
  );
}

// 눈 모양 버튼으로 비밀번호 보기/숨기기
export function PasswordInput(props) {
  const [show, setShow] = useState(false);
  return (
    <>
      <input {...props} type={show ? 'text' : 'password'} />
      <button type="button" className="afield__eye" onClick={() => setShow((v) => !v)} aria-label={show ? '비밀번호 숨기기' : '비밀번호 보기'} tabIndex={-1}>
        {show ? icons.eyeOff : icons.eye}
      </button>
    </>
  );
}

// 비밀번호 세기 막대 (4자 미만 약함 / 8자 이상+영문·숫자 섞이면 강함)
export function Strength({ value }) {
  if (!value) return null;
  let score = 0;
  if (value.length >= 4) score = 1;
  if (value.length >= 8) score = 2;
  if (value.length >= 8 && /[a-zA-Z]/.test(value) && /\d/.test(value)) score = 3;
  const label = ['너무 짧아요', '사용할 수 있어요', '좋아요', '아주 좋아요'][score];
  return (
    <div className={`strength strength--${score}`} aria-live="polite">
      <div className="strength__bar"><i /><i /><i /></div>
      <small>{label}</small>
    </div>
  );
}
