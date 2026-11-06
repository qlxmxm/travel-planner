// [여행계획] 여행계획 목록 (예전 "내 여행"). 내가 참여한 여행 + 다른 사람이 "공개"한 여행계획을 함께 보여줍니다.
//  - 위 칩: 전체 / 내 여행계획 / 다른 사람 계획, 검색(제목·여행지·해시태그·만든 사람), 해시태그 필터
//  - 비공개(N) 여행은 멤버에게만 보입니다. 삭제는 방장만. "초대 코드로 참여"는 코드를 입력해 멤버가 되는 흐름의 틀입니다.
// TODO: GET /plans?q=&hashtag=&mine=, DELETE /plans/{id}, POST /invites/join 연결 (권한 체크는 서버에서 한 번 더)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import TripCard from '../../components/common/TripCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { sampleTrips, isMember, canSee } from '../../data/sampleTrips.js';
import { tagList } from '../../data/hashtags.js';

const SCOPES = ['전체', '내 여행계획', '다른 사람 계획'];

export default function TripListPage() {
  const { user } = useAuth();
  const [trips, setTrips] = useState(sampleTrips); // TODO: API 데이터로 교체
  const [scope, setScope] = useState('전체');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [removing, setRemoving] = useState(null);
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joinMsg, setJoinMsg] = useState(null); // { ok, text }

  const kw = q.trim().toLowerCase();
  const list = trips.filter((t) => {
    if (!canSee(t, user)) return false;
    const mine = isMember(t, user);
    if (scope === '내 여행계획' && !mine) return false;
    if (scope === '다른 사람 계획' && mine) return false;
    if (tag && !t.hashtags.includes(tag)) return false;
    return !kw || [t.title, t.destination, t.owner_name, ...t.hashtags].some((s) => s.toLowerCase().includes(kw));
  });

  const join = (e) => {
    e.preventDefault();
    const found = trips.find((t) => t.invite_code === code.trim().toUpperCase());
    if (!found) return setJoinMsg({ ok: false, text: '존재하지 않는 초대 코드예요.' });
    if (new Date(found.invite_expire) < new Date(new Date().toDateString())) return setJoinMsg({ ok: false, text: '만료된 초대 코드예요.' });
    if (isMember(found, user)) return setJoinMsg({ ok: false, text: '이미 참여 중인 여행이에요.' });
    setTrips((l) => l.map((t) => (t.trip_id === found.trip_id ? { ...t, member_ids: [...t.member_ids, user.user_id], members: t.members + 1 } : t)));
    setJoinMsg({ ok: true, text: `“${found.title}”에 참여했어요!` });
    setCode('');
  };
  const closeJoin = () => { setJoinOpen(false); setJoinMsg(null); setCode(''); };

  return (
    <>
      <PageHeader
        title="여행계획"
        description="내 여행과 다른 사람들이 공개한 여행계획을 함께 볼 수 있어요."
        actions={<div className="header-actions"><button type="button" className="btn" onClick={() => setJoinOpen(true)}>초대 코드로 참여</button><Link to="/trips/new" className="btn btn--primary">+ 새 여행</Link></div>}
      />
      <div className="list-toolbar">
        <div className="chip-row">
          {SCOPES.map((s) => <button key={s} type="button" className={`chip${s === scope ? ' active' : ''}`} onClick={() => setScope(s)}>{s}</button>)}
        </div>
        <input type="search" className="list-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 여행지, 해시태그, 만든 사람 검색" aria-label="여행계획 검색" />
      </div>
      <div className="chip-row chip-row--tags" aria-label="해시태그 필터">
        {tagList.map((t) => <button key={t} type="button" className={`chip chip--tag${t === tag ? ' active' : ''}`} aria-pressed={t === tag} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>)}
      </div>
      {list.length === 0 ? (
        <EmptyState title="조건에 맞는 여행계획이 없어요" description="검색어나 필터를 바꿔 보세요.">
          <Link to="/trips/new" className="btn btn--primary">여행 만들기</Link>
        </EmptyState>
      ) : (
        <div className="trip-grid">
          {list.map((t) => <TripCard key={t.trip_id} trip={t} showOwner={!isMember(t, user)} onDelete={t.owner_id === user.user_id ? setRemoving : undefined} />)}
        </div>
      )}

      <Modal open={!!removing} title="여행 삭제" onClose={() => setRemoving(null)} width={400}>
        <p style={{ marginBottom: 20 }}>“{removing?.title}”을(를) 삭제할까요?<br />일정과 대화가 모두 사라지고 되돌릴 수 없어요.</p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setRemoving(null)}>취소</button>
          <button type="button" className="btn btn--danger" onClick={() => { setTrips((l) => l.filter((x) => x.trip_id !== removing.trip_id)); setRemoving(null); }}>삭제</button>
        </div>
      </Modal>
      <Modal open={joinOpen} title="초대 코드로 참여" onClose={closeJoin} width={420}>
        <form onSubmit={join}>
          <label className="field"><span>친구에게 받은 초대 코드</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="예) TOKYO-7K2P" autoFocus /></label>
          {joinMsg && <p className={joinMsg.ok ? 'form-ok' : 'form-error'} role="status">{joinMsg.text}</p>}
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeJoin}>닫기</button>
            <button type="submit" className="btn btn--primary" disabled={!code.trim()}>참여하기</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
