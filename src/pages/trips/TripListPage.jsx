// [여행계획] 여행계획 목록 (예전 "내 여행"). 내가 참여한 여행 + 다른 사람이 "공개"한 여행계획을 함께 보여줍니다.
// - 위 칩: 전체 / 내 여행계획 / 다른 사람 계획, 검색(제목·여행지·해시태그·만든 사람), 해시태그 필터
// - 비공개(N) 여행은 멤버에게만 보입니다. 삭제는 방장만. "초대 코드로 참여"는 코드를 입력해 멤버가 되는 흐름의 틀입니다.
// TODO: GET /plans?q=&hashtag=&mine=, DELETE /plans/{id}, POST /invites/join 연결 (권한 체크는 서버에서 한 번 더)
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader.jsx";
import TripCard from "../../components/common/TripCard.jsx";
import EmptyState from "../../components/common/EmptyState.jsx";
import Modal from "../../components/common/Modal.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { planApi, isMember, canSee } from "../../api/planApi.js";
import { tagList } from "../../data/hashtags.js";
import { request } from "../../api/client.js";

const SCOPES = ["전체", "내 여행계획", "다른 사람 계획"];

export default function TripListPage() {
  const { user, ready } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState("전체");
  const [q, setQ] = useState("");
  const [tag, setTag] = useState("");
  const [removing, setRemoving] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [joinOpen, setJoinOpen] = useState(false);
  const [code, setCode] = useState("");
  const [joinMsg, setJoinMsg] = useState(null);
  const [joining, setJoining] = useState(false);

  const loadTrips = useCallback(async () => {
    if (!user?.user_id) {
      setTrips([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await planApi.getPlans();
      setTrips(data);
    } catch (err) {
      console.error("여행 목록 조회 실패:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.user_id]);

  useEffect(() => {
    if (ready) loadTrips();
  }, [ready, loadTrips]);

  const kw = q.trim().toLowerCase();
  const list = trips.filter((t) => {
    if (!canSee(t, user)) return false;
    const mine = isMember(t, user);
    if (scope === "내 여행계획" && !mine) return false;
    if (scope === "다른 사람 계획" && mine) return false;
    if (tag && !t.hashtags.includes(tag)) return false;
    return (
      !kw ||
      [t.title, t.destination, t.owner_name, ...t.hashtags].some((s) =>
        s.toLowerCase().includes(kw),
      )
    );
  });

  const handleDelete = async () => {
    if (!removing || deleting) return;
    setDeleting(true);
    try {
      await planApi.deletePlan(removing.trip_id);
      setTrips((prev) => prev.filter((x) => x.trip_id !== removing.trip_id));
      setRemoving(null);
    } catch (err) {
      alert(err.message || "여행 삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const join = async (e) => {
    e.preventDefault();
    if (joining) return;

    const inviteCode = code.trim();
    if (!inviteCode) return;

    setJoining(true);
    setJoinMsg(null);

    try {
      await request("/plans/invites/verify", {
        method: "POST",
        body: { i_code: inviteCode },
      });

      await request("/plans/invites/join", {
        method: "POST",
        body: { i_code: inviteCode },
      });

      setJoinMsg({ ok: true, text: "여행에 참여했어요!" });
      setCode("");
      await loadTrips(); // 참여한 여행이 바로 목록에 뜨도록 새로고침
    } catch (error) {
      setJoinMsg({
        ok: false,
        text: error.message || "초대 코드를 확인할 수 없습니다.",
      });
    } finally {
      setJoining(false);
    }
  };

  const closeJoin = () => {
    setJoinOpen(false);
    setJoinMsg(null);
    setCode("");
  };

  return (
    <>
      <PageHeader
        title="여행계획"
        description="내 여행과 다른 사람들이 공개한 여행계획을 함께 볼 수 있어요."
        actions={
          <div className="header-actions">
            <button
              type="button"
              className="btn"
              onClick={() => setJoinOpen(true)}
            >
              초대 코드로 참여
            </button>
            <Link to="/trips/new" className="btn btn--primary">
              + 새 여행
            </Link>
          </div>
        }
      />
      <div className="list-toolbar">
        <div className="chip-row">
          {SCOPES.map((s) => (
            <button
              key={s}
              type="button"
              className={`chip${s === scope ? " active" : ""}`}
              onClick={() => setScope(s)}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          type="search"
          className="list-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 여행지, 해시태그, 만든 사람 검색"
          aria-label="여행계획 검색"
        />
      </div>
      <div className="chip-row chip-row--tags" aria-label="해시태그 필터">
        {tagList.map((t) => (
          <button
            key={t}
            type="button"
            className={`chip chip--tag${t === tag ? " active" : ""}`}
            aria-pressed={t === tag}
            onClick={() => setTag(tag === t ? "" : t)}
          >
            #{t}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ padding: "40px 0", textAlign: "center" }}>
          여행계획을 불러오는 중...
        </p>
      ) : list.length === 0 ? (
        <EmptyState
          title="조건에 맞는 여행계획이 없어요"
          description="검색어나 필터를 바꿔 보세요."
        >
          <Link to="/trips/new" className="btn btn--primary">
            여행 만들기
          </Link>
        </EmptyState>
      ) : (
        <div className="trip-grid">
          {list.map((t) => (
            <TripCard
              key={t.trip_id}
              trip={t}
              showOwner={!isMember(t, user)}
              onDelete={t.owner_id === user.user_id ? setRemoving : undefined}
            />
          ))}
        </div>
      )}

      <Modal
        open={!!removing}
        title="여행 삭제"
        onClose={() => setRemoving(null)}
        width={400}
      >
        <p style={{ marginBottom: 20 }}>
          “{removing?.title}”을(를) 삭제할까요?
          <br />
          일정과 대화가 모두 사라지고 되돌릴 수 없어요.
        </p>
        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={() => setRemoving(null)}
            disabled={deleting}
          >
            취소
          </button>
          <button
            type="button"
            className="btn btn--danger"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? "삭제 중..." : "삭제"}
          </button>
        </div>
      </Modal>

      <Modal
        open={joinOpen}
        title="초대 코드로 참여"
        onClose={closeJoin}
        width={420}
      >
        <form onSubmit={join}>
          <label className="field">
            <span>친구에게 받은 초대 코드</span>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="예) 8F2A1C-9B4D0E"
              autoFocus
            />
          </label>
          {joinMsg && (
            <p className={joinMsg.ok ? "form-ok" : "form-error"} role="status">
              {joinMsg.text}
            </p>
          )}
          <div className="form-actions">
            <button type="button" className="btn" onClick={closeJoin}>
              닫기
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={joining || !code.trim()}
            >
              {joining ? "참여 중..." : "참여하기"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
