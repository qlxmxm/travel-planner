// [여행계획] 여행 상세 화면의 탭 (일정 / 예산 / 장소 / 멤버). 멤버가 아닌 사람(공개된 여행을 구경하는 사람)에게는 예산·멤버 탭을 숨깁니다.
import { NavLink } from 'react-router-dom';

export default function TabNav({ tripId, isMember = true }) {
  const base = `/trips/${tripId}`;
  return (
    <nav className="tab-nav" aria-label="여행 상세 탭">
      <NavLink to={base} end>일정</NavLink>
      {isMember && <NavLink to={`${base}/budget`}>예산</NavLink>}
      <NavLink to={`${base}/places`}>장소</NavLink>
      {isMember && <NavLink to={`${base}/members`}>멤버</NavLink>}
    </nav>
  );
}
