// [여행계획] 여행계획 목록: 내 여행(만들었거나 초대로 참여, GET /api/plans/user/{u_id}) + 다른 사람이 공개한 여행(GET /api/plans/public)
//  - 위 칩: 전체 / 내 여행계획 / 다른 사람 계획, 검색(제목·여행지·해시태그·만든 사람), 해시태그 필터
//  - 비공개(N) 여행은 멤버에게만 보입니다. 삭제는 방장만. "초대 코드로 참여"는 코드를 입력해 멤버가 되는 흐름입니다.
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import TripCard from '../../components/common/TripCard.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAsync from '../../hooks/useAsync.js';
import { planApi } from '../../api/planApi.js';
import { tagList } from '../../data/hashtags.js';
import { isMember } from './tripUtils.js';

const SCOPES = ['전체', '내 여행계획', '다른 사람 계획'];

export default function TripListPage() {
  const { user, isLoggedIn } = useAuth();
  // 내 여행 + 다른 사람의 공개 여행을 합칩니다. (같은 여행이 두 번 나오지 않게 번호로 중복 제거)
  const { data, loading, error, reload } = useAsync(async () => {
    if (!isLoggedIn) return [];
    const [mine, open] = await Promise.all([planApi.listMine(user.user_id), planApi.listPublic()]);
    const seen = new Set(mine.map((t) => t.trip_id));
    return [...mine, ...open.filter((t) => !seen.has(t.trip_id))];
  }, [user.user_id]);
  const trips = data ?? [];
  const [scope, setScope] = useState('전체');
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const [removing, setRemoving] = useState(null);
  const [removeError, setRemoveError] = useState('');
  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState('');
  const [joinMsg, setJoinMsg] = useState(null); // { ok, text }

  const kw = q.trim().toLowerCase();
  const list = trips.filter((t) => {
    const mine = isMember(t, user);
    if (scope === '내 여행계획' && !mine) return false;
    if (scope === '다른 사람 계획' && mine) return false;
    if (tag && !t.hashtags.includes(tag)) return false;
    return !kw || [t.title, t.destination, t.owner_name, ...t.hashtags].some((s) => String(s).toLowerCase().includes(kw));
  });

  const join = async (e) => {
    e.preventDefault();
    try {
      await planApi.join(code.trim(), user.user_id);
      setJoinMsg({ ok: true, text: '여행에 참여했어요!' });
      setCode('');
      reload();
    } catch (err) { setJoinMsg({ ok: false, text: err.message }); }
  };
  const closeJoin = () => { setJoinOpen(false); setJoinMsg(null); setCode(''); };
  const remove = async () => {
    try { await planApi.remove(removing.trip_id); setRemoving(null); setRemoveError(''); reload(); }
    catch (err) { setRemoveError(err.message); }
  };

  if (!isLoggedIn) {
    return <EmptyState icon="🔒" title="로그인이 필요해요" description="여행계획은 로그인한 뒤에 만들고 볼 수 있어요."><Link to="/login" className="btn btn--primary">로그인</Link></EmptyState>;
  }

  return (
    <>
      <PageHeader
        title="여행계획"
        description="내 여행과 다른 사람들이 공개한 여행계획을 함께 볼 수 있어요."
        actions={<div className="header-actions"><button type="button" className="btn" onClick={() => setJoinOpen(true)}>초대 코드로 참여</button><Link to="/trips/new" className="btn btn--primary">+ 새 여행</Link></div>}
      />
      <div className="list-toolbar">
        <div className="chip-row">
          {SCOPES.map((sc) => <button key={sc} type="button" className={`chip${sc === scope ? ' active' : ''}`} onClick={() => setScope(sc)}>{sc}</button>)}
        </div>
        <input type="search" className="list-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 여행지, 해시태그, 만든 사람 검색" aria-label="여행계획 검색" />
      </div>
      <div className="chip-row chip-row--tags" aria-label="해시태그 필터">
        {[...new Set([...tagList, ...trips.flatMap((t) => t.hashtags)])].map((t) => <button key={t} type="button" className={`chip chip--tag${t === tag ? ' active' : ''}`} aria-pressed={t === tag} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>)}
      </div>
      {loading ? (
        <p className="list-count" role="status">불러오는 중…</p>
      ) : error ? (
        <EmptyState icon="⚠️" title="여행계획을 불러오지 못했어요" description={error}><button type="button" className="btn btn--primary" onClick={reload}>다시 시도</button></EmptyState>
      ) : list.length === 0 ? (
        <EmptyState title={trips.length ? '조건에 맞는 여행계획이 없어요' : '아직 여행계획이 없어요'} description={trips.length ? '검색어나 필터를 바꿔 보세요.' : '첫 여행을 만들어 보세요.'}>
          <Link to="/trips/new" className="btn btn--primary">여행 만들기</Link>
        </EmptyState>
      ) : (
        <div className="trip-grid">
          {list.map((t) => <TripCard key={t.trip_id} trip={t} showOwner={!isMember(t, user)} onDelete={t.owner_id === user.user_id ? setRemoving : undefined} />)}
        </div>
      )}

      <Modal open={!!removing} title="여행 삭제" onClose={() => { setRemoving(null); setRemoveError(''); }} width={400}>
        <p style={{ marginBottom: 20 }}>“{removing?.title}”을(를) 삭제할까요?<br />일정과 예산이 모두 사라지고 되돌릴 수 없어요.</p>
        {removeError && <p className="form-error" role="alert">{removeError}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => { setRemoving(null); setRemoveError(''); }}>취소</button>
          <button type="button" className="btn btn--danger" onClick={remove}>삭제</button>
        </div>
      </Modal>
      <Modal open={joinOpen} title="초대 코드로 참여" onClose={closeJoin} width={420}>
        <form onSubmit={join}>
          <label className="field"><span>친구에게 받은 초대 코드</span><input value={code} onChange={(e) => setCode(e.target.value)} placeholder="예) 7K2P-Q9XD" autoFocus /></label>
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
