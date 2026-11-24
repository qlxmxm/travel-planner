// [여행계획] 멤버 탭 - 멤버 목록 (방장은 편집자 지정/해제, 내보내기)
import Avatar from '../../../components/common/Avatar.jsx';

const roleLabel = (member, trip) => (member.u_id === trip.owner_id ? '방장' : member.role === '편집자' ? '편집자' : '참여자');

export default function MemberRows({ members, trip, owner, loading, onSetRole, onRemove }) {
  return (
    <>
      <h2 className="members-title">멤버 <em>{members.length}</em></h2>
      {loading ? <p className="list-count" role="status">불러오는 중…</p> : (
        <ul className="card members-list">
          {members.map((m) => {
            const label = roleLabel(m, trip);
            return (
              <li key={m.pm_id}>
                <Avatar name={m.u_name || '?'} /><b>{m.u_name || `회원 ${m.u_id}`}</b>
                <span className={`members-list__role members-list__role--${label}`}>{label}</span>
                {owner && m.u_id !== trip.owner_id && (
                  <>
                    {label === '참여자'
                      ? <button type="button" className="btn btn--small" onClick={() => onSetRole(m.pm_id, '편집자')}>편집자 지정</button>
                      : <button type="button" className="btn btn--small" onClick={() => onSetRole(m.pm_id, '멤버')}>참여자로 변경</button>}
                    <button type="button" className="btn btn--text" onClick={() => onRemove(m.pm_id)}>내보내기</button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
