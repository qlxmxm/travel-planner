
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Modal from '../../components/common/Modal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import Tags from '../../components/common/Tags.jsx';
import { journalApi } from '../../api/journalApi.js';
import { planApi } from '../../api/planApi.js';
import { tagList } from '../../data/hashtags.js';
import { isEnded } from '../trips/tripUtils.js';

export default function JournalListPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [tag, setTag] = useState('');
  const [writeOpen, setWriteOpen] = useState(false);   // "여행기 쓰기": 끝난 여행을 고르는 팝업
  const [myTrips, setMyTrips] = useState([]);
  const [tripsState, setTripsState] = useState({ loading: false, error: '' });
  const [list, setList] = useState([]);
  const [removing, setRemoving] = useState(null);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadJournals = async () => {
      setLoading(true);
      setError('');

      try {
        const result = await journalApi.getList();

        if (!cancelled) {
          setList(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '여행기 목록을 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadJournals();

    return () => {
      cancelled = true;
    };
  }, []);

  const shown = useMemo(() => {
    const keyword = q.trim().toLowerCase();

    return list.filter((journal) => {
      if (tag && !(journal.hashtags ?? []).includes(tag)) return false;
      if (!keyword) return true;

      const searchable = [
        journal.j_title,
        journal.j_intro,
        journal.loc,
        journal.u_name,
        ...(journal.hashtags ?? []),
      ];

      return searchable.some((value) =>
        String(value ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [list, q, tag]);

  const allTags = useMemo(
    () => [...new Set([...tagList, ...list.flatMap((journal) => journal.hashtags ?? [])])],
    [list],
  );

  // "여행기 쓰기": 새로 쓰는 버튼이므로, 내 여행 중 기간이 끝났고 내가 아직 여행기를 쓰지 않은 여행만 보여줍니다. 고르면 완료 처리 후 작성 화면으로 이동
  const openWrite = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setWriteOpen(true);
    setTripsState({ loading: true, error: '' });
    try {
      const [trips, journals] = await Promise.all([planApi.listMine(user.user_id), journalApi.getList()]);
      const written = new Set(journals.filter((j) => Number(j.u_id) === Number(user.user_id) && j.p_id != null).map((j) => Number(j.p_id)));   // 내가 이미 여행기를 쓴 여행
      setMyTrips(trips.filter((t) => t.owner_id === user.user_id || t.member_ids.includes(user.user_id)).filter((t) => t.completed || isEnded(t)).filter((t) => !written.has(Number(t.trip_id))));
      setTripsState({ loading: false, error: '' });
    } catch (err) {
      setTripsState({ loading: false, error: err.message });
    }
  };
  const writeFrom = async (trip) => {
    try {
      navigate(`/journals/new/from/${trip.trip_id}`);
    } catch (err) {
      setTripsState({ loading: false, error: err.message });
    }
  };

  const removeJournal = async () => {
    if (!removing || deleting) return;

    setDeleting(true);
    setError('');

    try {
      await journalApi.remove(removing.j_id);

      setList((prev) =>
        prev.filter((journal) => journal.j_id !== removing.j_id)
      );

      setRemoving(null);
    } catch (err) {
      setError(err.message || '여행기를 삭제하지 못했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <PageHeader
        title="여행기"
        description="다녀온 사람들의 사진과 이야기를 만나보세요."
        actions={<button type="button" className="btn btn--primary" onClick={openWrite}>여행기 쓰기</button>}
      />

      <div className="list-toolbar">
        <div className="chip-row" aria-label="해시태그 필터">
          <button type="button" className={`chip chip--tag${tag === '' ? ' active' : ''}`} aria-pressed={tag === ''} onClick={() => setTag('')}>전체</button>
          {allTags.map((t) => (
            <button key={t} type="button" className={`chip chip--tag${t === tag ? ' active' : ''}`} aria-pressed={t === tag} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>
          ))}
        </div>
        <input
          type="search"
          className="list-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 작성자, 해시태그 검색"
          aria-label="여행기 검색"
        />
      </div>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {loading ? (
        <p>여행기 목록을 불러오는 중입니다.</p>
      ) : (
        <>
          {!error && shown.length === 0 && (
            <EmptyState
              icon="🔍"
              title={q ? '검색 결과가 없어요' : '등록된 여행기가 없어요'}
              description={
                q
                  ? '다른 검색어를 입력해 보세요.'
                  : '완료된 여행계획에서 첫 여행기를 작성해 보세요.'
              }
            />
          )}

          <div className="journal-grid">
            {shown.map((journal) => {
              const owner = user != null &&
                Number(journal.u_id) === Number(user.user_id);

              const author = journal.u_name || `사용자 ${journal.u_id}`;

              return (
                <div
                  key={journal.j_id}
                  className="trip-card-wrap"
                >
                  <Link
                    to={`/journals/${journal.j_id}`}
                    className="journal-card"
                  >
                    {journal.j_photo && (
                      <img
                        src={journal.j_photo}
                        alt={journal.j_title}
                      />
                    )}

                    <h3>{journal.j_title}</h3>

                    <p>{journal.j_intro || journal.loc || ''}</p>
                    <Tags tags={journal.hashtags ?? []} active={tag} />

                    <div className="journal-card__by">
                      <Avatar name={author} />
                      <span>{author}</span>
                      <span aria-label={`좋아요 ${journal.like_count ?? 0}개`}>♡ {journal.like_count ?? 0}</span>
                    </div>
                  </Link>

                  {owner && (
                    <button
                      type="button"
                      className="card-del"
                      onClick={() => setRemoving(journal)}
                      aria-label={`${journal.j_title} 삭제`}
                    >
                      삭제
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal
        open={!!removing}
        title="여행기 삭제"
        onClose={() => {
          if (!deleting) setRemoving(null);
        }}
        width={400}
      >
        <p style={{ marginBottom: 20 }}>
          “{removing?.j_title}” 여행기를 삭제할까요?
          <br />
          댓글도 함께 사라져요.
        </p>

        <div className="form-actions">
          <button
            type="button"
            className="btn"
            disabled={deleting}
            onClick={() => setRemoving(null)}
          >
            취소
          </button>

          <button
            type="button"
            className="btn btn--danger"
            disabled={deleting}
            onClick={removeJournal}
          >
            {deleting ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </Modal>

      <Modal open={writeOpen} title="여행기 쓰기" onClose={() => setWriteOpen(false)} width={440}>
        {tripsState.loading ? (
          <p className="list-count" role="status">불러오는 중…</p>
        ) : tripsState.error ? (
          <p className="form-error" role="alert">{tripsState.error}</p>
        ) : myTrips.length === 0 ? (
          <p style={{ marginBottom: 8 }}>새로 여행기를 쓸 수 있는 여행이 없어요.<br />여행 기간이 끝났고 아직 여행기를 쓰지 않은 여행이 있으면 여기에 나타나요.</p>
        ) : (
          <>
            <p style={{ marginBottom: 14 }}>여행기로 만들 여행을 골라 주세요.</p>
            <ul className="write-pick">
              {myTrips.map((trip) => (
                <li key={trip.trip_id}>
                  <button type="button" className="btn" onClick={() => writeFrom(trip)}>
                    <b>{trip.title}</b>
                    <span>{trip.start_date} ~ {trip.end_date}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="form-actions" style={{ marginTop: 16 }}><button type="button" className="btn" onClick={() => setWriteOpen(false)}>닫기</button></div>
      </Modal>
    </>
  );
}
