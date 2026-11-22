
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { journalApi } from '../../api/journalApi.js';

export default function JournalDetailPage() {
  const { journalId } = useParams();
  const { user } = useAuth();

  const [journal, setJournal] = useState(null);
  const [days, setDays] = useState([]);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [liked, setLiked] = useState(false);

  const [content, setContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const userId = user?.user_id;
  const owner = journal && userId != null &&
    Number(journal.u_id) === Number(userId);

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError('');
      setJournal(null);
      setDays([]);
      setComments([]);
      setLikeCount(0);
      setLiked(false);

      try {
        const [detail, countResult] = await Promise.all([
          journalApi.getDetail(journalId),
          journalApi.getLikeCount(journalId),
        ]);

        if (cancelled) return;

        setJournal(detail.journal);
        setDays(detail.days ?? []);
        setComments(detail.comments ?? []);
        setLikeCount(countResult.like_count ?? 0);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '여행기를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [journalId]);

  useEffect(() => {
    let cancelled = false;

    const loadMyLikes = async () => {
      if (userId == null) {
        setLiked(false);
        return;
      }

      try {
        const likes = await journalApi.getMyLikes();

        if (!cancelled) {
          setLiked(likes.some(
            (like) => Number(like.j_id) === Number(journalId)
          ));
        }
      } catch {
        if (!cancelled) setLiked(false);
      }
    };

    loadMyLikes();

    return () => {
      cancelled = true;
    };
  }, [journalId, userId]);

  const toggleLike = async () => {
    if (busy) return;

    if (userId == null) {
      setError('좋아요를 누르려면 로그인해 주세요.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      if (liked) {
        await journalApi.removeLike(journalId);
      } else {
        await journalApi.addLike(journalId);
      }

      setLiked((prev) => !prev);

      const result = await journalApi.getLikeCount(journalId);
      setLikeCount(result.like_count ?? 0);
    } catch (err) {
      setError(err.message || '좋아요를 변경하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();

    if (busy) return;

    if (userId == null) {
      setError('댓글을 작성하려면 로그인해 주세요.');
      return;
    }

    if (!content.trim()) {
      setError('댓글 내용을 입력해 주세요.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const comment = await journalApi.addComment(
        journalId,
        content.trim()
      );

      setComments((prev) => [...prev, comment]);
      setContent('');
    } catch (err) {
      setError(err.message || '댓글을 작성하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const startEditComment = (comment) => {
    setEditingCommentId(comment.jc_id);
    setEditingContent(comment.jc_content);
    setError('');
  };

  const updateComment = async (commentId) => {
    if (busy) return;

    if (!editingContent.trim()) {
      setError('댓글 내용을 입력해 주세요.');
      return;
    }

    setBusy(true);
    setError('');

    try {
      const updated = await journalApi.updateComment(
        commentId,
        editingContent.trim()
      );

      setComments((prev) => prev.map((comment) =>
        comment.jc_id === commentId ? updated : comment
      ));

      setEditingCommentId(null);
      setEditingContent('');
    } catch (err) {
      setError(err.message || '댓글을 수정하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const removeComment = async (commentId) => {
    if (busy) return;
    if (!window.confirm('댓글을 삭제할까요?')) return;

    setBusy(true);
    setError('');

    try {
      await journalApi.removeComment(commentId);

      setComments((prev) => prev.filter(
        (comment) => comment.jc_id !== commentId
      ));
    } catch (err) {
      setError(err.message || '댓글을 삭제하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return <p>여행기를 불러오는 중입니다.</p>;
  }

  if (!journal) {
    return (
      <EmptyState
        icon="🔒"
        title="여행기를 불러올 수 없습니다."
        description={error || '여행기 정보를 확인해 주세요.'}
      >
        <Link to="/journals" className="btn btn--primary">
          여행기 목록으로
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="form-page" style={{ maxWidth: 800 }}>
      <PageHeader
        title={journal.j_title}
        description={journal.j_intro || ''}
        actions={
          owner && (
            <Link
              to={`/journals/${journalId}/edit`}
              className="btn btn--primary"
            >
              여행기 수정
            </Link>
          )
        }
      />

      {journal.j_photo && (
        <img
          src={journal.j_photo}
          alt={journal.j_title}
          style={{
            width: '100%',
            maxHeight: 400,
            objectFit: 'cover',
            borderRadius: 12,
            marginBottom: 24,
          }}
        />
      )}

      <div className="journal-card__by" style={{ marginBottom: 24 }}>
        <Avatar name={`사용자 ${journal.u_id}`} />
        <span>사용자 {journal.u_id}</span>
        {journal.loc && <span>{journal.loc}</span>}
        <span>{journal.p_create?.slice(0, 10)}</span>
      </div>

      {days.length === 0 && (
        <p>등록된 여행 일정이 없습니다.</p>
      )}

      {days.map((day, i) => (
        <section
          key={day.ji_day ?? i}
          className="editor-day"
        >
          <div className="editor-day__head">
            <span className="day-pill">
              Day {day.ji_day ?? i + 1}
            </span>
            <span>{day.date || ''}</span>
          </div>

          {day.items.map((item) => (
            <div
              key={item.ji_id}
              className="editor-item"
            >
              <div className="editor-item__top">
                <strong>{item.ji_title}</strong>
                <span>{item.ji_time || ''}</span>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span
                  aria-label={
                    item.ji_rating == null
                      ? '별점 없음'
                      : `${item.ji_rating}점`
                  }
                >
                  {item.ji_rating == null
                    ? '별점 없음'
                    : '★'.repeat(item.ji_rating) +
                      '☆'.repeat(5 - item.ji_rating)}
                </span>
              </div>

              {item.ji_content && (
                <p style={{
                  whiteSpace: 'pre-wrap',
                  marginBottom: 16,
                }}>
                  {item.ji_content}
                </p>
              )}

              {item.ji_photo && (
                <img
                  src={item.ji_photo}
                  alt={`${item.ji_title} 여행 사진`}
                  style={{
                    width: '100%',
                    maxHeight: 360,
                    objectFit: 'cover',
                    borderRadius: 10,
                  }}
                />
              )}
            </div>
          ))}
        </section>
      ))}

      <div
        className="card"
        style={{ marginTop: 24, marginBottom: 24 }}
      >
        <div className="form-actions">
          <button
            type="button"
            className="btn"
            onClick={toggleLike}
            disabled={busy}
            aria-pressed={liked}
          >
            {liked ? '♥ 좋아요 취소' : '♡ 좋아요'}
            {' '}{likeCount}
          </button>

          <Link to="/journals" className="btn">
            목록으로
          </Link>
        </div>
      </div>

      <section className="card" style={{ padding: 24 }}>
        <h2 style={{ marginBottom: 20 }}>
          댓글 {comments.length}
        </h2>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <form onSubmit={addComment}>
          <label className="field field--full">
            <span>댓글 작성</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                userId == null
                  ? '로그인 후 댓글을 작성할 수 있습니다.'
                  : '여행기에 대한 댓글을 남겨 보세요.'
              }
              disabled={userId == null || busy}
            />
          </label>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn--primary"
              disabled={userId == null || busy}
            >
              댓글 등록
            </button>
          </div>
        </form>

        {comments.length === 0 && (
          <p style={{ marginTop: 24 }}>
            아직 댓글이 없습니다.
          </p>
        )}

        {comments.map((comment) => {
          const myComment = userId != null &&
            Number(comment.u_id) === Number(userId);

          const isEditing = editingCommentId === comment.jc_id;

          return (
            <div
              key={comment.jc_id}
              style={{
                borderTop: '1px solid var(--border, #ddd)',
                paddingTop: 20,
                marginTop: 20,
              }}
            >
              <div className="journal-card__by">
                <Avatar name={`사용자 ${comment.u_id}`} />
                <strong>사용자 {comment.u_id}</strong>
                <span>{comment.jc_create?.slice(0, 10)}</span>
              </div>

              {isEditing ? (
                <div style={{ marginTop: 12 }}>
                  <textarea
                    className="field"
                    style={{ width: '100%' }}
                    value={editingContent}
                    onChange={(e) =>
                      setEditingContent(e.target.value)
                    }
                  />

                  <div className="form-actions">
                    <button
                      type="button"
                      className="btn"
                      disabled={busy}
                      onClick={() => {
                        setEditingCommentId(null);
                        setEditingContent('');
                      }}
                    >
                      취소
                    </button>

                    <button
                      type="button"
                      className="btn btn--primary"
                      disabled={busy}
                      onClick={() => updateComment(comment.jc_id)}
                    >
                      저장
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p style={{
                    marginTop: 12,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {comment.jc_content}
                  </p>

                  {myComment && (
                    <div className="form-actions">
                      <button
                        type="button"
                        className="btn"
                        disabled={busy}
                        onClick={() => startEditComment(comment)}
                      >
                        수정
                      </button>

                      <button
                        type="button"
                        className="btn btn--danger"
                        disabled={busy}
                        onClick={() => removeComment(comment.jc_id)}
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
