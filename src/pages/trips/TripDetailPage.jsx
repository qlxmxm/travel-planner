// [여행계획] 여행 상세의 틀: 대표 사진 + "도쿄, 4박 5일 여행일정입니다." + 탭 + 탭별 내용(Outlet)
//   일정 → schedule/ScheduleTab · 예산 → budget/BudgetTab · 장소 → places/PlacesTab · 멤버 → members/MembersTab
//  - 여행은 방장·멤버만 볼 수 있습니다. (GET /api/plans/{id} + 멤버/해시태그)
//  - 방장은 해시태그를 바꿀 수 있습니다. (공개 여부는 서버에 컬럼이 없어 지원하지 않아요)
//  - 여행 기간(end_date)이 지나면 "여행기에 추가" 버튼이 나타나고, 누르면 여행을 완료 처리(p_status)한 뒤 여행기 작성 화면으로 넘어갑니다.
import { useState } from 'react';
import { Link, Outlet, useNavigate, useParams } from 'react-router-dom';
import TabNav from '../../components/common/TabNav.jsx';
import Tags from '../../components/common/Tags.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';
import Modal from '../../components/common/Modal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useAsync from '../../hooks/useAsync.js';
import { planApi } from '../../api/planApi.js';
import { isMember, isEnded } from './tripUtils.js';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { data: trip, loading, error, reload } = useAsync(() => planApi.get(tripId), [tripId, user.user_id]);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState([]);
  const [actionError, setActionError] = useState('');

  if (loading) return <p className="list-count" role="status">불러오는 중…</p>;
  if (error || !trip || !isLoggedIn || !isMember(trip, user)) {
    return <EmptyState icon="🔒" title="볼 수 없는 여행이에요" description={error && isLoggedIn ? error : '없는 여행이거나 멤버가 아니에요. 로그인했는지, 초대 코드로 참여했는지 확인해 보세요.'}><Link to="/trips" className="btn btn--primary">여행계획 목록으로</Link></EmptyState>;
  }
  const owner = trip.owner_id === user.user_id;
  const ended = isEnded(trip);

  const saveTags = async () => {
    try { await planApi.setTags(trip.trip_id, trip.hashtags, tagDraft); setTagOpen(false); setActionError(''); reload(); }
    catch (err) { setActionError(err.message); }
  };
  const toJournal = async () => {
    try { if (!trip.completed) await planApi.complete(trip.trip_id); navigate(`/journals/new/from/${trip.trip_id}`); }
    catch (err) { setActionError(err.message); }
  };

  return (
    <>
      <header className="trip-head">
        <img className="trip-head__photo" src={trip.photo} alt="" />
        <h1>{trip.destination}, {trip.duration}<br /><em>여행일정</em>입니다.</h1>
        <p>{trip.start_date} ~ {trip.end_date} · 함께하는 친구 {trip.members}명</p>
        <div className="trip-head__tags"><Tags tags={trip.hashtags} /></div>
        {owner && (
          <div className="trip-head__tools">
            <button type="button" className="btn btn--small" onClick={() => { setTagDraft(trip.hashtags); setTagOpen(true); }}>해시태그 편집</button>
          </div>
        )}
        {ended
          ? <div className="trip-head__journal"><button type="button" className="btn btn--primary" onClick={toJournal}>여행기에 추가</button><small>여행이 끝났어요. 이 여행의 일정을 가져와 여행기를 써보세요.</small></div>
          : <p className="trip-head__hint">여행 기간이 끝나면 “여행기에 추가” 버튼이 나타나요.</p>}
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
      </header>
      <TabNav tripId={tripId} isMember />
      <Outlet context={{ trip, canEdit: true, owner, reloadTrip: reload }} />
      <Modal open={tagOpen} title="해시태그 편집" onClose={() => setTagOpen(false)} width={460}>
        <TagPicker value={tagDraft} onChange={setTagDraft} />
        <div className="form-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn--primary" onClick={saveTags}>완료</button></div>
      </Modal>
    </>
  );
}
