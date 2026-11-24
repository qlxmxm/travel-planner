// [여행계획] 멤버 탭 - 멤버용 화면: 초대 코드(방장) / 참여 요청 / 멤버 목록
import InviteBox from './InviteBox.jsx';
import JoinRequestList from './JoinRequestList.jsx';
import MemberRows from './MemberRows.jsx';
import { useMembers } from './useMembers.js';

export default function MemberList({ trip, owner, reloadTrip }) {
  const m = useMembers(trip, owner, reloadTrip);
  return (
    <>
      {owner && <InviteBox invite={m.invite} onCreate={m.makeInvite} />}
      {m.error && <p className="form-error" role="alert">{m.error}</p>}
      <JoinRequestList requests={m.requests} owner={owner} onApprove={m.approveRequest} onReject={m.rejectRequest} />
      <MemberRows members={m.members} trip={trip} owner={owner} loading={m.loading} onSetRole={m.setRole} onRemove={m.removeMember} />
    </>
  );
}
