// [여행계획] 멤버 탭 - 참여 요청 목록 (방장은 승인·거절 버튼)
import Avatar from '../../../components/common/Avatar.jsx';

export default function JoinRequestList({ requests, owner, onApprove, onReject }) {
  return (
    <>
      <h2 className="members-title">참여 요청 <em>{requests.length}</em></h2>
      <ul className="card members-list">
        {requests.length === 0 && <li className="members-empty">아직 참여 요청이 없어요.</li>}
        {requests.map((r) => (
          <li key={r.jr_id}>
            <Avatar name={r.u_name || '?'} /><b>{r.u_name || `회원 ${r.u_id}`}</b>
            <span className="members-list__role">같이 가고 싶어해요</span>
            {owner
              ? (
                <>
                  <button type="button" className="btn btn--primary btn--small" onClick={() => onApprove(r.jr_id)}>멤버 추가</button>
                  <button type="button" className="btn btn--text" onClick={() => onReject(r.jr_id)}>거절</button>
                </>
              )
              : <small className="members-list__wait">방장이 승인하면 멤버가 돼요</small>}
          </li>
        ))}
      </ul>
    </>
  );
}
