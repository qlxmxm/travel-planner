// [여행계획] 멤버 탭
//  - 멤버(방장·편집자·참여자): 멤버 목록 + 참여 요청 목록
//      · 방장: 초대 코드 보기·새로 만들기, 참여 요청 승인("멤버 추가")·거절, 멤버를 편집자로 지정/해제, 멤버 내보내기
//      · 편집자: 방장처럼 일정·예산·여행 정보를 고칠 수 있는 멤버 / 참여자: 일정·예산을 보기만 하는 멤버
//  - 멤버가 아닌 사람(공개된 여행을 구경하는 사람): "여행플래너 요청하기" 카드 → 방장이 승인하면 멤버가 됩니다.
// 서버: GET /api/plans/{id}/members · PUT/DELETE /api/plans/{id}/members/{pm_id} · GET/POST /api/plans/{id}/invites
//       POST/GET /api/plans/{id}/join-requests · POST …/{jr_id}/approve · DELETE …/{jr_id}
// 초대 코드는 만료일이 지나면 쓸 수 없고 한 번 쓰면 사용 처리돼요. 코드로 참여하는 곳은 "여행계획" 목록의 [초대 코드로 참여] 입니다.
import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Avatar from '../../components/common/Avatar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { planApi } from '../../api/planApi.js';

const rand = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
const newCode = () => `${rand()}-${rand()}`; // 예: 7K2P-Q9XD (영문·숫자만)
const roleLabel = (m, trip) => (m.u_id === trip.owner_id ? '방장' : m.role === '편집자' ? '편집자' : '참여자');

export default function MembersTab() {
  const { trip, isMember, owner, reloadTrip } = useOutletContext();
  return isMember ? <MemberList trip={trip} owner={owner} reloadTrip={reloadTrip} /> : <JoinRequestCard trip={trip} />;
}

// ---------- 공개 여행을 구경하는 사람: 여행플래너 요청하기 ----------
function JoinRequestCard({ trip }) {
  const [mine, setMine] = useState(null);     // null: 확인 중 / { requested, jr_id }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    planApi.myJoinRequest(trip.trip_id)
      .then((r) => { if (!cancelled) setMine(r); })
      .catch((err) => { if (!cancelled) { setMine({ requested: false }); setError(err.message); } });
    return () => { cancelled = true; };
  }, [trip.trip_id]);

  const send = async () => {
    setBusy(true);
    try { const r = await planApi.requestJoin(trip.trip_id); setMine({ requested: true, jr_id: r.jr_id }); setError(''); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true);
    try { await planApi.removeJoinRequest(trip.trip_id, mine.jr_id); setMine({ requested: false }); setError(''); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };

  if (trip.is_public !== 'Y') return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="멤버 정보는 이 여행의 멤버에게만 보여요." />;

  return (
    <section className="join-card" aria-label="참여 요청">
      <div className="join-card__icon" aria-hidden="true">✈️</div>
      <p className="join-card__lead">{trip.owner_name ? `${trip.owner_name}님의 ` : ''}{trip.destination} 여행, 함께 가고 싶나요?</p>
      {mine === null ? <p className="list-count" role="status">확인하는 중…</p>
        : mine.requested ? (
          <>
            <p className="join-card__sent">요청을 보냈어요! 방장이 승인하면 이 여행의 멤버가 돼요.</p>
            <button type="button" className="btn" disabled={busy} onClick={cancel}>요청 취소</button>
          </>
        ) : (
          <>
            <button type="button" className="join-card__btn" disabled={busy} onClick={send}>여행플래너 요청하기</button>
            <small className="join-card__sub">같이가자!~</small>
          </>
        )}
      {error && <p className="form-error" role="alert">{error}</p>}
    </section>
  );
}

// ---------- 멤버: 목록 / 초대 코드 / 참여 요청 ----------
function MemberList({ trip, owner, reloadTrip }) {
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    try {
      // 초대 코드는 방장만 조회할 수 있어서(서버 규칙) 방장일 때만 불러옵니다.
      const [m, i, r] = await Promise.all([planApi.listMembers(trip.trip_id), owner ? planApi.latestInvite(trip.trip_id) : null, planApi.listJoinRequests(trip.trip_id)]);
      setMembers(m); setInvite(i); setRequests(r); setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [trip.trip_id, owner]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  const copy = async () => {
    try { await navigator.clipboard.writeText(invite.i_code); } catch { /* 복사 권한이 없어도 화면 표시는 진행 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const run = async (action) => {
    try { await action(); await load(); reloadTrip?.(); setError(''); }
    catch (err) { setError(err.message); }
  };
  const makeInvite = async () => {
    try { setInvite(await planApi.createInvite(trip.trip_id, newCode())); setError(''); }
    catch (err) { setError(err.message); }
  };

  return (
    <>
      {owner && (
      <section className="card invite-box">
        <div>
          <span>초대 코드</span>
          <b>{invite ? invite.i_code : '없음'}</b>
          <small>{invite ? `${String(invite.i_expire).slice(0, 10)}까지, 한 번만 사용할 수 있어요` : '아직 사용할 수 있는 코드가 없어요'}</small>
        </div>
        <div className="invite-box__btns">
          {invite && <button type="button" className="btn" onClick={copy}>{copied ? '복사됨' : '복사'}</button>}
          <button type="button" className="btn" onClick={makeInvite}>새 코드 만들기</button>
        </div>
      </section>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}

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
                  <button type="button" className="btn btn--primary btn--small" onClick={() => run(() => planApi.approveJoinRequest(trip.trip_id, r.jr_id))}>멤버 추가</button>
                  <button type="button" className="btn btn--text" onClick={() => run(() => planApi.removeJoinRequest(trip.trip_id, r.jr_id))}>거절</button>
                </>
              )
              : <small className="members-list__wait">방장이 승인하면 멤버가 돼요</small>}
          </li>
        ))}
      </ul>

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
                      ? <button type="button" className="btn btn--small" onClick={() => run(() => planApi.setMemberRole(trip.trip_id, m.pm_id, '편집자'))}>편집자 지정</button>
                      : <button type="button" className="btn btn--small" onClick={() => run(() => planApi.setMemberRole(trip.trip_id, m.pm_id, '멤버'))}>참여자로 변경</button>}
                    <button type="button" className="btn btn--text" onClick={() => run(() => planApi.removeMember(trip.trip_id, m.pm_id))}>내보내기</button>
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
