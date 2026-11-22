
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Modal from '../../components/common/Modal.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { journalApi } from '../../api/journalApi.js';

export default function JournalListPage() {
  const { user } = useAuth();

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

    if (!keyword) return list;

    return list.filter((journal) => {
      const searchable = [
        journal.j_title,
        journal.j_intro,
        journal.loc,
        String(journal.u_id),
      ];

      return searchable.some((value) =>
        String(value ?? '').toLowerCase().includes(keyword)
      );
    });
  }, [list, q]);

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
      />

      <div className="list-toolbar">
        <input
          type="search"
          className="list-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="제목, 소개, 지역 검색"
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

              const author = `사용자 ${journal.u_id}`;

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

                    <div className="journal-card__by">
                      <Avatar name={author} />
                      <span>{author}</span>
                      <span>
                        {journal.p_create?.slice(0, 10)}
                      </span>
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
    </>
  );
}
