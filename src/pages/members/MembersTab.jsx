// [여행계획] 멤버 탭: 멤버 목록 + 초대 코드(복사, 방장은 새로 만들기) + 방장의 멤버 내보내기. 멤버만 볼 수 있어요.
// 서버: GET /api/plans/{id}/members, GET/POST /api/plans/{id}/invites, DELETE /api/plans/{id}/members/{pm_id}
// 초대 코드는 만료일이 지나면 쓸 수 없고 한 번 쓰면 사용 처리돼요. 코드로 참여하는 곳은 "여행계획" 목록의 [초대 코드로 참여] 입니다.
import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Avatar from '../../components/common/Avatar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { planApi } from '../../api/planApi.js';

const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
const newCode = () => `${rand()}-${rand()}`; // 예: 7K2P-Q9XD (영문·숫자만)

export default function MembersTab() {
  const { trip, canEdit, owner, reloadTrip } = useOutletContext();
  const [members, setMembers] = useState([]);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      const [m, i] = await Promise.all([planApi.listMembers(trip.trip_id), planApi.latestInvite(trip.trip_id)]);
      setMembers(m); setInvite(i); setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [trip.trip_id]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  if (!canEdit) return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="멤버 정보는 이 여행의 멤버에게만 보여요." />;

  const copy = async () => {
    try { await navigator.clipboard.writeText(invite.i_code); } catch { /* 복사 권한이 없어도 화면 표시는 진행 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const makeInvite = async () => {
    try { setInvite(await planApi.createInvite(trip.trip_id, newCode())); setError(''); }
    catch (err) { setError(err.message); }
  };
  const kick = async (m) => {
    try { await planApi.removeMember(trip.trip_id, m.pm_id); await load(); reloadTrip?.(); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      <section className="card invite-box">
        <div>
          <span>초대 코드</span>
          <b>{invite ? invite.i_code : '없음'}</b>
          <small>{invite ? `${String(invite.i_expire).slice(0, 10)}까지, 한 번만 사용할 수 있어요` : '아직 사용할 수 있는 코드가 없어요'}</small>
        </div>
        <div className="invite-box__btns">
          {invite && <button type="button" className="btn" onClick={copy}>{copied ? '복사됨' : '복사'}</button>}
          {owner && <button type="button" className="btn" onClick={makeInvite}>새 코드 만들기</button>}
        </div>
      </section>
      {error && <p className="form-error" role="alert">{error}</p>}
      {loading ? <p className="list-count" role="status">불러오는 중…</p> : (
        <ul className="card">
          {members.map((m) => (
            <li key={m.pm_id} style={{ padding: '16px 22px', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Avatar name={m.u_name || '?'} /><b>{m.u_name || `회원 ${m.u_id}`}</b>
              <span style={{ marginLeft: 'auto', color: 'var(--ink-sub)' }}>{m.u_id === trip.owner_id ? '방장' : '참여자'}</span>
              {owner && m.u_id !== trip.owner_id && <button type="button" className="btn btn--text" onClick={() => kick(m)}>내보내기</button>}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
