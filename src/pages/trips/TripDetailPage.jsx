// [여행계획] 여행 상세의 틀: 대표 사진 + "도쿄, 4박 5일 여행일정입니다." + 탭 + 탭별 내용(Outlet)
//   일정 → schedule/ScheduleTab (손오공) · 예산 → budget/BudgetTab · 장소 → places/PlacesTab (손오공) · 멤버 → members/MembersTab (아서)
//  - 멤버만 일정을 고치고 예산·멤버 탭을 볼 수 있습니다. 공개(Y)된 다른 사람의 여행은 일정을 읽기만 할 수 있어요.
//  - 방장은 공개 여부(Y/N)와 해시태그를 바꿀 수 있습니다.
//  - 여행 기간(end_date)이 지나면 "여행기에 추가" 버튼이 나타나고, 누르면 이 여행의 일정이 여행기 작성 화면으로 넘어갑니다.
// TODO: GET /trips/{id}, PUT /trips/{id}(공개 여부), 해시태그 API, POST /trips/{id}/to-journal 연결
import { useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import TabNav from '../../components/common/TabNav.jsx';
import Tags from '../../components/common/Tags.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';
import Modal from '../../components/common/Modal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { sampleTrips, isMember, canSee, isEnded } from '../../data/sampleTrips.js';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { user } = useAuth();
  const found = sampleTrips.find((t) => String(t.trip_id) === tripId); // TODO: GET /trips/{id}
  const [isPublic, setIsPublic] = useState(found?.is_public ?? 'N');
  const [tags, setTags] = useState(found?.hashtags ?? []);
  const [tagOpen, setTagOpen] = useState(false);

  if (!found || !canSee({ ...found, is_public: isPublic }, user)) {
    return <EmptyState icon="🔒" title="볼 수 없는 여행이에요" description="없는 여행이거나 비공개 여행이에요."><Link to="/trips" className="btn btn--primary">여행계획 목록으로</Link></EmptyState>;
  }
  const trip = { ...found, is_public: isPublic, hashtags: tags };
  const member = isMember(trip, user);
  const owner = trip.owner_id === user.user_id;
  const ended = isEnded(trip);

  return (
    <>
      <header className="trip-head">
        <img className="trip-head__photo" src={trip.photo} alt="" />
        <h1>{trip.destination}, {trip.duration}<br /><em>여행일정</em>입니다.</h1>
        <p>{trip.start_date} ~ {trip.end_date} · 함께하는 친구 {trip.members}명{!member && ` · ${trip.owner_name}님의 공개 여행계획`}</p>
        <div className="trip-head__tags">
          <span className={`badge ${isPublic === 'Y' ? 'badge--on' : ''}`}>{isPublic === 'Y' ? '공개' : '비공개'}</span>
          <Tags tags={tags} />
        </div>
        {owner && (
          <div className="trip-head__tools">
            <button type="button" className="btn btn--small" onClick={() => setIsPublic(isPublic === 'Y' ? 'N' : 'Y')}>{isPublic === 'Y' ? '비공개로 전환' : '공개로 전환'}</button>
            <button type="button" className="btn btn--small" onClick={() => setTagOpen(true)}>해시태그 편집</button>
          </div>
        )}
        {member && (
          ended
            ? <div className="trip-head__journal"><Link to={`/journals/new/from/${trip.trip_id}`} className="btn btn--primary">여행기에 추가</Link><small>여행이 끝났어요. 이 여행의 일정을 가져와 여행기를 써보세요.</small></div>
            : <p className="trip-head__hint">여행 기간이 끝나면 “여행기에 추가” 버튼이 나타나요.</p>
        )}
      </header>
      <TabNav tripId={tripId} isMember={member} />
      <Outlet context={{ trip, canEdit: member, owner }} />
      <Modal open={tagOpen} title="해시태그 편집" onClose={() => setTagOpen(false)} width={460}>
        <TagPicker value={tags} onChange={setTags} />
        <div className="form-actions" style={{ marginTop: 16 }}><button type="button" className="btn btn--primary" onClick={() => setTagOpen(false)}>완료</button></div>
      </Modal>
    </>
  );
}
