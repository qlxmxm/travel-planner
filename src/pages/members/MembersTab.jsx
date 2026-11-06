// [여행계획] 멤버 탭: 멤버 목록 + 초대 코드(복사, 방장은 새로 만들기) + 방장의 멤버 내보내기. 멤버만 볼 수 있어요.
// 초대 코드는 만료일(invite_expire)이 지나면 쓸 수 없고, 코드로 참여하는 곳은 "여행계획" 목록의 [초대 코드로 참여] 입니다.
// TODO: POST /plans/{id}/invites, GET /plans/{id}/members, DELETE /plans/{id}/members/{u_id} 연결, 권한 체크
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Avatar from '../../components/common/Avatar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { sampleMembers } from '../../data/sampleTrips.js';

const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
const newCode = () => `${rand()}-${rand()}`; // 예: 7K2P-Q9XD (영문·숫자만)
const plus7 = () => new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);

export default function MembersTab() {
  const { trip, canEdit, owner } = useOutletContext();
  const [members, setMembers] = useState(() => sampleMembers.filter((m) => trip.member_ids.includes(m.user_id)).map((m) => ({ ...m, role: m.user_id === trip.owner_id ? '방장' : '참여자' })));
  const [invite, setInvite] = useState({ code: trip.invite_code, expire: trip.invite_expire });
  const [copied, setCopied] = useState(false);

  if (!canEdit) return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="멤버 정보는 이 여행의 멤버에게만 보여요." />;

  const copy = async () => {
    try { await navigator.clipboard.writeText(invite.code); } catch { /* 복사 권한이 없어도 화면 표시는 진행 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <>
      <section className="card invite-box">
        <div>
          <span>초대 코드</span>
          <b>{invite.code}</b>
          <small>{invite.expire}까지 사용할 수 있어요</small>
        </div>
        <div className="invite-box__btns">
          <button type="button" className="btn" onClick={copy}>{copied ? '복사됨' : '복사'}</button>
          {owner && <button type="button" className="btn" onClick={() => setInvite({ code: newCode(), expire: plus7() })}>새 코드 만들기</button>}
        </div>
      </section>
      <ul className="card">
        {members.map((m) => (
          <li key={m.user_id} style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar name={m.user_name} /><b>{m.user_name}</b>
            <span style={{ marginLeft: 'auto', color: 'var(--ink-sub)' }}>{m.role}</span>
            {owner && m.role !== '방장' && <button type="button" className="btn btn--text" onClick={() => setMembers((l) => l.filter((x) => x.user_id !== m.user_id))}>내보내기</button>}
          </li>
        ))}
      </ul>
    </>
  );
}
