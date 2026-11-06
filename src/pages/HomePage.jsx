// [공통] 홈(소개) 화면: 스크롤에 따라 한 화면씩 반응하는 소개 페이지
//  - 히어로: 스크롤하면 서서히 사라지고 사진이 따로 움직임
//  - 스토리(내 여행 → 소통 → 여행기): 화면이 고정된 채 스크롤 진행률(0~1)에 따라 내용이 하나씩 나타남
//  - 오른쪽 점 메뉴: 현재 위치 표시, 누르면 해당 화면으로 이동
// 스크롤 값은 hooks/useScroll.js 의 훅으로 받아서 state 로 다루기 때문에, 값이 바뀔 때마다 React 가 화면을 다시 그립니다.
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../components/common/Avatar.jsx';
import { useScrollY, useStickyProgress, useEnterProgress, clamp, HEADER_H } from '../hooks/useScroll.js';
import { sampleTrips } from '../data/sampleTrips.js';
import { sampleJournals } from '../data/sampleJournals.js';
import { photos } from '../data/photos.js';
import ctaPhoto from '../assets/photos/cta.jpg'; // 마지막 화면 배경 사진

const MARKERS = ['var(--m1)', 'var(--m2)', 'var(--m3)', 'var(--m4)'];
const STEPS = [
  { name: '내 여행', title: <>시간 순서대로<br />한눈에 보는 일정</>, desc: '날짜별 일정을 시작 시간과 함께 정리해요. 일정을 누르면 그 장소에 대한 대화가 부드럽게 열려요.', to: '/trips', link: '내 여행 보러 가기' },
  { name: '친구들과 소통', title: <>일정마다<br />대화를 남겨요</>, desc: '일정 하나하나에 제목을 정하고, 메신저처럼 의견을 주고받아요. 제목은 언제든 고칠 수 있어요.', to: '/trips', link: '대화 해보기' },
  { name: '여행기', title: <>다녀온 이야기를<br />사진과 함께</>, desc: '시간별로 장소와 사진, 별점을 남기고 댓글로 이야기를 나눠요. 다른 사람의 여행기도 구경해 보세요.', to: '/journals', link: '여행기 둘러보기' },
];
const RAIL = ['시작', '내 여행', '소통', '여행기', '시작하기'];

// 마우스를 움직이면 사진이 살짝 따라 움직이는 효과 (CSS 변수 --mx, --my)
function onMove(e) {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
  e.currentTarget.style.setProperty('--my', ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
}

/* ---- 스토리 화면 안의 작은 화면(목업). q: 이 단계 안에서의 진행률 0~1 ---- */
function TimelineMock({ q, plans }) {
  const chatOpen = q > 0.78;
  return (
    <div className={`mock mock-tl${chatOpen ? ' chat-open' : ''}`}>
      <div className="card mini-card">
        <span className="mini-day">Day 1</span>
        {plans.map((p, i) => (
          <div key={p.plan_id} className={`mini-row${q > 0.05 + i * 0.17 ? ' vis' : ''}${chatOpen && i === 2 ? ' sel' : ''}`}>
            <span className="plan__time" style={{ background: MARKERS[i] }}>{p.time}</span>
            <img src={p.photo} alt="" /><b>{p.place}</b>
          </div>
        ))}
      </div>
      <div className="card mini-card mock-tl__chat">
        <div className="mock-tl__title">{plans[2].title}</div>
        {plans[2].comments.slice(0, 2).map((c) => (
          <div className="msg" key={c.id}><Avatar name={c.author_name} /><div><div className="msg__bubble">{c.text}</div></div></div>
        ))}
      </div>
    </div>
  );
}

function ChatMock({ q, plan }) {
  const typing = (q > 0.06 && q < 0.2) || (q > 0.32 && q < 0.45) || (q > 0.58 && q < 0.7);
  const msgs = [...plan.comments.slice(0, 2), { id: 'me', author_id: 1, author_name: '홍길동', text: '좋아요! 5시 반에 같이 가요' }];
  const at = [0.2, 0.45, 0.7];
  return (
    <div className="card mini-card mock-chat">
      <div className="mock-chat__title">{plan.title}</div>
      {msgs.map((c, i) => (
        <div key={c.id} className={`msg msg--pop${c.author_id === 1 ? ' msg--mine' : ''}${q > at[i] ? ' vis' : ''}`}>
          {c.author_id !== 1 && <Avatar name={c.author_name} />}
          <div>{c.author_id !== 1 && <div className="msg__name">{c.author_name}</div>}<div className="msg__bubble">{c.text}</div></div>
        </div>
      ))}
      <div className={`typing${typing ? ' vis' : ''}`} aria-hidden="true"><i /><i /><i /></div>
    </div>
  );
}

function JournalMock({ q, list }) {
  const spread = clamp(q * 1.8);
  const stars = Math.round(clamp((q - 0.4) / 0.5) * 5);
  return (
    <div className="mock-journals">
      {list.map((j, i) => {
        const k = i - 1; // -1, 0, 1
        return (
          <div key={j.journal_id} className="card mock-journal" style={{ zIndex: k === 0 ? 3 : 1, transform: `translateX(${k * spread * 170}px) translateY(${Math.abs(k) * spread * 18}px) rotate(${k * spread * 7}deg) scale(${k === 0 ? 1 + spread * 0.06 : 1})` }}>
            <img src={j.cover} alt="" />
            <b>{j.title}</b>
            {k === 0 && <span className="mock-journal__stars" aria-hidden="true">{'★'.repeat(stars)}{'☆'.repeat(5 - stars)}</span>}
          </div>
        );
      })}
    </div>
  );
}

export default function HomePage() {
  const storyRef = useRef(null);
  const ctaRef = useRef(null);
  const y = useScrollY();
  const p = useStickyProgress(storyRef);
  const cta = useEnterProgress(ctaRef);

  const trip = sampleTrips[0];
  const plans = trip.plans.filter((x) => x.day === 1);
  const chatPlan = trip.plans.find((x) => x.plan_id === 103);
  const step = Math.min(2, Math.floor(p * 3));
  const q = p * 3 - step;
  const active = cta > 0.6 ? 4 : y > (typeof window === 'undefined' ? 400 : window.innerHeight * 0.5) ? 1 + step : 0;
  const heroFade = clamp(1 - y / 520);

  const goTo = (i) => {
    let top = 0;
    if (i >= 1 && i <= 3) {
      const r = storyRef.current.getBoundingClientRect();
      const range = r.height - (window.innerHeight - HEADER_H);
      top = r.top + window.scrollY - HEADER_H + range * ((i - 1 + 0.6) / 3);
    } else if (i === 4) top = ctaRef.current.getBoundingClientRect().top + window.scrollY - HEADER_H;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  return (
    <div className="home">
      <nav className="rail" aria-label="화면 이동">
        {RAIL.map((label, i) => (
          <button key={label} type="button" className={`rail__dot${active === i ? ' on' : ''}`} onClick={() => goTo(i)} aria-label={label} aria-current={active === i}><span>{label}</span></button>
        ))}
      </nav>

      {/* 1. 시작 화면 */}
      <section className="hero screen" onMouseMove={onMove}>
        <div className="hero__blob hero__blob--a" /><div className="hero__blob hero__blob--b" />
        <div className="hero__inner">
          <div className="hero__text" style={{ opacity: heroFade, transform: `translateY(${y * 0.25}px)` }}>
            <h1><span>여행 계획,</span><span>친구들과 <em>함께</em> 짜요</span></h1>
            <p>가고 싶은 곳을 모으고, 시간별 일정을 만들고,<br />함께 가는 사람들과 이야기하며 완성하는 여행플래너</p>
            <div className="hero__cta">
              <Link to="/trips" className="btn btn--primary btn--lg">내 여행 보기</Link>
              <Link to="/journals" className="btn btn--lg">여행기 둘러보기</Link>
            </div>
          </div>
          <div className="hero__stage" aria-hidden="true" style={{ transform: `translateY(${-y * 0.18}px) scale(${1 + y * 0.0002})`, opacity: clamp(1.15 - y / 700) }}>
            <img className="hero__img hero__img--1" src={photos.tokyo} alt="" />
            <img className="hero__img hero__img--2" src={photos.jeju} alt="" />
            <img className="hero__img hero__img--3" src={photos.osaka} alt="" />
            <div className="hero__chip hero__chip--1"><span className="plan__time" style={{ background: 'var(--m1)' }}>10:30</span> 나리타 도착</div>
            <div className="hero__chip hero__chip--2"><Avatar name="손오공" /> 5시 반에 가봐요</div>
          </div>
        </div>
        <div className="hero__hint" style={{ opacity: heroFade }} aria-hidden="true">스크롤해 보세요 <i>↓</i></div>
      </section>

      {/* 2~4. 스크롤 진행률에 따라 한 화면씩 바뀌는 소개 */}
      <section className="story" ref={storyRef}>
        <div className="story__stage" data-step={step}>
          <div className="story__text">
            {STEPS.map((s, i) => (
              <div key={s.name} className={`story__block${i === step ? ' on' : i < step ? ' past' : ''}`}>
                <span className="story__name">{s.name}</span>
                <h2>{s.title}</h2>
                <p>{s.desc}</p>
                <Link to={s.to} className="home-sec__link" tabIndex={i === step ? 0 : -1}>{s.link} <i>›</i></Link>
              </div>
            ))}
            <div className="story__bars" aria-hidden="true">
              {STEPS.map((s, i) => <span key={s.name}><b style={{ width: `${(step > i ? 1 : step === i ? q : 0) * 100}%` }} /></span>)}
            </div>
          </div>
          <div className="story__mocks">
            {[
              <TimelineMock key="a" q={step === 0 ? q : step > 0 ? 1 : 0} plans={plans} />,
              <ChatMock key="b" q={step === 1 ? q : step > 1 ? 1 : 0} plan={chatPlan} />,
              <JournalMock key="c" q={step === 2 ? q : 0} list={sampleJournals.slice(0, 3)} />,
            ].map((m, i) => <div key={i} className={`story__mock${i === step ? ' on' : i < step ? ' past' : ''}`}>{m}</div>)}
          </div>
        </div>
      </section>

      {/* 5. 마무리 */}
      <section className="cta screen" ref={ctaRef} style={{ backgroundImage: `url(${ctaPhoto})`, backgroundPosition: `center ${30 + cta * 40}%` }}>
        <div style={{ opacity: clamp(cta * 1.6), transform: `scale(${0.86 + cta * 0.14}) translateY(${(1 - cta) * 40}px)` }}>
          <h2>다음 여행,<br />지금 시작해요</h2>
          <Link to="/trips/new" className="btn btn--lg cta__btn">새 여행 만들기</Link>
        </div>
      </section>
    </div>
  );
}
