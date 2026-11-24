// [여행계획] 멤버 탭 - 공개 여행을 구경하는 사람(멤버 아님): "여행플래너 요청하기" 카드
import { useEffect, useState } from 'react';
import EmptyState from '../../../components/common/EmptyState.jsx';
import { memberApi } from '../../../api/memberApi.js';

export default function JoinRequestCard({ trip }) {
  const [mine, setMine] = useState(null);     // null: 확인 중 / { requested, jr_id }
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    memberApi.myJoinRequest(trip.trip_id)
      .then((r) => { if (!cancelled) setMine(r); })
      .catch((err) => { if (!cancelled) { setMine({ requested: false }); setError(err.message); } });
    return () => { cancelled = true; };
  }, [trip.trip_id]);

  const send = async () => {
    setBusy(true);
    try { const r = await memberApi.requestJoin(trip.trip_id); setMine({ requested: true, jr_id: r.jr_id }); setError(''); }
    catch (err) { setError(err.message); }
    finally { setBusy(false); }
  };
  const cancel = async () => {
    setBusy(true);
    try { await memberApi.removeJoinRequest(trip.trip_id, mine.jr_id); setMine({ requested: false }); setError(''); }
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
