// [여행계획] 여행 상세의 틀: 대표 사진 + "도쿄, 4박 5일 여행일정입니다." + 탭 + 탭별 내용(Outlet)
//   일정 → schedule/ScheduleTab · 예산 → budget/BudgetTab · 장소 → places/PlacesTab · 멤버 → members/MembersTab
//  - 멤버만 일정을 고치고 예산·멤버 탭을 볼 수 있습니다. 공개(Y)된 다른 사람의 여행은 일정을 읽기만 할 수 있어요.
//  - 방장은 공개 여부(Y/N)와 해시태그를, 멤버(방장 포함)는 여행 제목·여행지·날짜를 바꿀 수 있습니다. (PUT /api/plans/{id} 의 p_public)
//  - 여행 기간(end_date)이 지나면 "여행기에 추가" 버튼이 나타나고, 누르면 여행을 완료 처리(p_status)한 뒤 여행기 작성 화면으로 넘어갑니다.
//    내가 이미 이 여행으로 여행기를 썼다면 "내 여행기 보기"가 나와서 그 여행기로 이동합니다.
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
import { journalApi } from '../../api/journalApi.js';
import { isMember, canSee, isEnded } from './tripUtils.js';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const { data: trip, loading, error, reload } = useAsync(() => planApi.get(tripId), [tripId, user.user_id]);
  // 내가 이 여행으로 이미 쓴 여행기 (없으면 null) - 있으면 "여행기에 추가" 대신 "내 여행기 보기"를 보여줌
  const { data: myJournal, loading: journalLoading } = useAsync(async () => {
    if (!isLoggedIn) return null;
    const list = await journalApi.getList();
    return list.find((j) => Number(j.u_id) === Number(user.user_id) && Number(j.p_id) === Number(tripId)) ?? null;
  }, [tripId, user.user_id]);
  const [tagOpen, setTagOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState([]);
  const [actionError, setActionError] = useState('');
  const [infoOpen, setInfoOpen] = useState(false);
  const [infoDraft, setInfoDraft] = useState(null);

  if (loading) return <p className="list-count" role="status">불러오는 중…</p>;
  if (error || !trip || !isLoggedIn || !canSee(trip, user)) {
    return <EmptyState icon="🔒" title="볼 수 없는 여행이에요" description={error && isLoggedIn ? error : '없는 여행이거나 비공개 여행이에요. 로그인했는지, 초대 코드로 참여했는지 확인해 보세요.'}><Link to="/trips" className="btn btn--primary">여행계획 목록으로</Link></EmptyState>;
  }
  const member = isMember(trip, user);
  const owner = trip.owner_id === user.user_id;
  const ended = isEnded(trip);

  const saveTags = async () => {
    try { await planApi.setTags(trip.trip_id, trip.hashtags, tagDraft); setTagOpen(false); setActionError(''); reload(); }
    catch (err) { setActionError(err.message); }
  };
  const saveInfo = async () => {
    const { title, destination, start_date, end_date } = infoDraft;
    if (!title.trim() || !destination.trim() || !start_date || !end_date) { setActionError('제목, 여행지, 출발일, 도착일을 모두 입력해 주세요.'); return; }
    if (end_date < start_date) { setActionError('도착일은 출발일보다 빠를 수 없어요.'); return; }
    try { await planApi.updateInfo(trip, { title: title.trim(), destination: destination.trim(), start_date, end_date }); setInfoOpen(false); setActionError(''); reload(); }
    catch (err) { setActionError(err.message); }
  };
  const togglePublic = async () => {
    try { await planApi.setPublic(trip.trip_id, trip.is_public === 'Y' ? 'N' : 'Y'); setActionError(''); reload(); }
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
        <p>{trip.start_date} ~ {trip.end_date} · 함께하는 친구 {trip.members}명{!member && ` · ${trip.owner_name}님의 공개 여행계획`}</p>
        <div className="trip-head__tags">
          <span className={`badge ${trip.is_public === 'Y' ? 'badge--on' : ''}`}>{trip.is_public === 'Y' ? '공개' : '비공개'}</span>
          <Tags tags={trip.hashtags} />
        </div>
        {member && (
          <div className="trip-head__tools">
            {!trip.completed && <button type="button" className="btn btn--small" onClick={() => { setInfoDraft({ title: trip.title, destination: trip.destination, start_date: trip.start_date, end_date: trip.end_date }); setActionError(''); setInfoOpen(true); }}>여행 정보·날짜 수정</button>}
            {owner && <button type="button" className="btn btn--small" onClick={togglePublic}>{trip.is_public === 'Y' ? '비공개로 전환' : '공개로 전환'}</button>}
            {owner && <button type="button" className="btn btn--small" onClick={() => { setTagDraft(trip.hashtags); setTagOpen(true); }}>해시태그 편집</button>}
          </div>
        )}
        {member && ended && journalLoading ? null
          : member && ended && myJournal
          ? <div className="trip-head__journal"><Link to={`/journals/${myJournal.j_id}`} className="btn btn--primary">내 여행기 보기</Link><small>이 여행으로 쓴 여행기가 있어요.</small></div>
          : member && (ended
          ? <div className="trip-head__journal"><button type="button" className="btn btn--primary" onClick={toJournal}>여행기에 추가</button><small>여행이 끝났어요. 이 여행의 일정을 가져와 여행기를 써보세요.</small></div>
          : <p className="trip-head__hint">여행 기간이 끝나면 “여행기에 추가” 버튼이 나타나요.</p>)}
        {actionError && <p className="form-error" role="alert">{actionError}</p>}
      </header>
      <TabNav tripId={tripId} isMember={member} />
      <Outlet context={{ trip, canEdit: member, owner, reloadTrip: reload }} />
      <Modal open={infoOpen} title="여행 정보 수정" onClose={() => setInfoOpen(false)} width={460}>
        {infoDraft && (
          <div className="form-grid">
            <label className="field field--full"><span>여행 제목</span><input value={infoDraft.title} onChange={(e) => setInfoDraft({ ...infoDraft, title: e.target.value })} /></label>
            <label className="field field--full"><span>여행지</span><input value={infoDraft.destination} onChange={(e) => setInfoDraft({ ...infoDraft, destination: e.target.value })} /></label>
            <label className="field"><span>출발일</span><input type="date" value={infoDraft.start_date} onChange={(e) => setInfoDraft({ ...infoDraft, start_date: e.target.value })} /></label>
            <label className="field"><span>도착일</span><input type="date" value={infoDraft.end_date} min={infoDraft.start_date} onChange={(e) => setInfoDraft({ ...infoDraft, end_date: e.target.value })} /></label>
            <p className="field field--full" style={{ color: 'var(--muted, #666)', fontSize: 13 }}>출발일을 바꾸면 등록된 일정도 같은 만큼 날짜가 옮겨져요. 도착일만 바꾸면 일정은 그대로예요.</p>
            {actionError && <p className="form-error field--full" role="alert">{actionError}</p>}
          </div>
        )}
        <div className="form-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn--primary" onClick={saveInfo}>저장</button></div>
      </Modal>
      <Modal open={tagOpen} title="해시태그 편집" onClose={() => setTagOpen(false)} width={460}>
        <TagPicker value={tagDraft} onChange={setTagDraft} />
        <div className="form-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn--primary" onClick={saveTags}>완료</button></div>
      </Modal>
    </>
  );
}
