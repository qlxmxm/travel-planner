// [여행계획] 여행 상세의 틀: 대표 사진 + "도쿄, 4박 5일 여행일정입니다." + 탭 + 탭별 내용(Outlet)
// 일정 → schedule/ScheduleTab (손오공) · 예산 → budget/BudgetTab · 장소 → places/PlacesTab (손오공) · 멤버 → members/MembersTab (아서)
// - 멤버만 일정을 고치고 예산·멤버 탭을 볼 수 있습니다. 공개(Y)된 다른 사람의 여행은 일정을 읽기만 할 수 있어요.
// - 방장은 공개 여부(Y/N)와 해시태그를 바꿀 수 있습니다.
// - 여행 기간(end_date)이 지나면 "여행기에 추가" 버튼이 나타나고, 누르면 이 여행의 일정이 여행기 작성 화면으로 넘어갑니다.
// TODO: GET /trips/{id}, PUT /trips/{id}(공개 여부), 해시태그 API, POST /trips/{id}/to-journal 연결
import { useEffect, useState } from "react";
import { Link, Outlet, useParams } from "react-router-dom";
import TabNav from "../../components/common/TabNav.jsx";
import Tags from "../../components/common/Tags.jsx";
import TagPicker from "../../components/common/TagPicker.jsx";
import Modal from "../../components/common/Modal.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { planApi, isMember, canSee, isEnded } from "../../api/planApi.js";

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { user, ready } = useAuth();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [tagOpen, setTagOpen] = useState(false);
  const [draftTags, setDraftTags] = useState([]);
  const [savingTags, setSavingTags] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;

    async function fetchTrip() {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await planApi.getPlan(tripId);
        if (!cancelled) {
          setTrip(data);
          setDraftTags(data.hashtags);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchTrip();
    return () => {
      cancelled = true;
    };
  }, [tripId, ready]);

  if (loading) {
    return (
      <p style={{ padding: "60px 0", textAlign: "center" }}>
        여행 정보를 불러오는 중...
      </p>
    );
  }

  if (notFound || !trip || !canSee(trip, user)) {
    return (
      <EmptyState
        icon="🔒"
        title="볼 수 없는 여행이에요"
        description="없는 여행이거나 비공개 여행이에요."
      >
        <Link to="/trips" className="btn btn--primary">
          여행계획 목록으로
        </Link>
      </EmptyState>
    );
  }

  const member = isMember(trip, user);
  const owner = trip.owner_id === user.user_id;
  const ended = isEnded(trip);

  const togglePublic = async () => {
    const nextStatus = trip.is_public === "Y" ? "N" : "Y";
    try {
      await planApi.updatePublicStatus(trip.trip_id, nextStatus);
      setTrip((prev) => ({ ...prev, is_public: nextStatus }));
    } catch (err) {
      alert(err.message || "공개 여부 변경에 실패했습니다.");
    }
  };

  const openTagModal = () => {
    setDraftTags(trip.hashtags);
    setTagOpen(true);
  };

  const saveTags = async () => {
    if (savingTags) return;
    setSavingTags(true);
    try {
      const updatedTagObjs = await planApi.updateHashtags(
        trip.trip_id,
        draftTags,
        trip.hashtagObjs || [],
      );
      setTrip((prev) => ({
        ...prev,
        hashtags: updatedTagObjs.map((t) => t.h_name),
        hashtagObjs: updatedTagObjs,
      }));
      setTagOpen(false);
    } catch (err) {
      alert(err.message || "해시태그 저장에 실패했습니다.");
    } finally {
      setSavingTags(false);
    }
  };

  return (
    <>
      <header className="trip-head">
        <img className="trip-head__photo" src={trip.photo} alt="" />
        <h1>
          {trip.destination}, {trip.duration}
          <br />
          <em>여행일정</em>입니다.
        </h1>
        <p>
          {trip.start_date} ~ {trip.end_date} · 함께하는 친구 {trip.members}명
          {!member && ` · ${trip.owner_name}님의 공개 여행계획`}
        </p>
        <div className="trip-head__tags">
          <span
            className={`badge ${trip.is_public === "Y" ? "badge--on" : ""}`}
          >
            {trip.is_public === "Y" ? "공개" : "비공개"}
          </span>
          <Tags tags={trip.hashtags} />
        </div>
        {owner && (
          <div className="trip-head__tools">
            <button
              type="button"
              className="btn btn--small"
              onClick={togglePublic}
            >
              {trip.is_public === "Y" ? "비공개로 전환" : "공개로 전환"}
            </button>
            <button
              type="button"
              className="btn btn--small"
              onClick={openTagModal}
            >
              해시태그 편집
            </button>
          </div>
        )}
        {member &&
          (ended ? (
            <div className="trip-head__journal">
              <Link
                to={`/journals/new/from/${trip.trip_id}`}
                className="btn btn--primary"
              >
                여행기에 추가
              </Link>
              <small>
                여행이 끝났어요. 이 여행의 일정을 가져와 여행기를 써보세요.
              </small>
            </div>
          ) : (
            <p className="trip-head__hint">
              여행 기간이 끝나면 “여행기에 추가” 버튼이 나타나요.
            </p>
          ))}
      </header>
      <TabNav tripId={tripId} isMember={member} />
      <Outlet context={{ trip, canEdit: member, owner }} />
      <Modal
        open={tagOpen}
        title="해시태그 편집"
        onClose={() => setTagOpen(false)}
        width={460}
      >
        <TagPicker value={draftTags} onChange={setDraftTags} />
        <div className="form-actions" style={{ marginTop: 16 }}>
          <button
            type="button"
            className="btn"
            onClick={() => setTagOpen(false)}
            disabled={savingTags}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={saveTags}
            disabled={savingTags}
          >
            {savingTags ? "저장 중..." : "완료"}
          </button>
        </div>
      </Modal>
    </>
  );
}
