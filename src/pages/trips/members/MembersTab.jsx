// [여행계획] 멤버 탭
//  - 멤버(방장·편집자·참여자): 멤버 목록 + 참여 요청 목록  → MemberList.jsx
//      · 방장: 초대 코드 보기·새로 만들기, 참여 요청 승인("멤버 추가")·거절, 멤버를 편집자로 지정/해제, 멤버 내보내기
//      · 편집자: 방장처럼 일정·예산·여행 정보를 고칠 수 있는 멤버 / 참여자: 일정·예산을 보기만 하는 멤버
//  - 멤버가 아닌 사람(공개된 여행을 구경하는 사람): "여행플래너 요청하기" 카드 → JoinRequestCard.jsx (방장이 승인하면 멤버가 됩니다)
// 서버: GET /api/plans/{id}/members · PUT/DELETE /api/plans/{id}/members/{pm_id} · GET/POST /api/plans/{id}/invites
//       POST/GET /api/plans/{id}/join-requests · POST …/{jr_id}/approve · DELETE …/{jr_id}
// 초대 코드는 만료일이 지나면 쓸 수 없고 한 번 쓰면 사용 처리돼요. 코드로 참여하는 곳은 "여행계획" 목록의 [초대 코드로 참여] 입니다.
import { useOutletContext } from 'react-router-dom';
import MemberList from './MemberList.jsx';
import JoinRequestCard from './JoinRequestCard.jsx';

export default function MembersTab() {
  const { trip, isMember, owner, reloadTrip } = useOutletContext();
  return isMember ? <MemberList trip={trip} owner={owner} reloadTrip={reloadTrip} /> : <JoinRequestCard trip={trip} />;
}
