
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import Tags from '../../components/common/Tags.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { journalApi } from '../../api/journalApi.js';
import { photoSrc } from '../../api/planApi.js';

export default function JournalDetailPage() {
  // 같은 화면을 세 가지로 씁니다:  보기 /journals/:journalId  ·  수정(보기 화면에서 바로)  ·  새로 쓰기 /journals/new/from/:tripId (여행계획의 일정을 가져와 편집 상태로 시작)
  const { journalId, tripId } = useParams();
  const creating = !journalId;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tags, setTags] = useState([]);

  // 현재 화면에서 바로 수정하는 상태
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);      // { j_title, j_intro, j_photo }
  const [draftDays, setDraftDays] = useState([]);

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
  const owner = creating || (journal && userId != null &&
    Number(journal.u_id) === Number(userId));

  useEffect(() => {
    let cancelled = false;

    const loadDetail = async () => {
      setLoading(true);
      setError('');
      setEditing(false);   // 새로 쓰기 → 저장 후 상세로 이동할 때 같은 화면이 재사용되므로 편집 상태를 풀어 줌
      setJournal(null);
      setDays([]);
      setComments([]);
      setLikeCount(0);
      setLiked(false);

      if (creating) {
        // 새로 쓰기: 여행계획의 일정으로 초안을 만들고 바로 편집 상태로 엽니다. 여행계획 없이는 쓸 수 없어요.
        if (!tripId) { setError('여행계획에서 여행기 쓰기 버튼을 눌러 주세요.'); setLoading(false); return; }
        try {
          const result = await journalApi.getPlanPreview(tripId);
          if (cancelled) return;
          // 여행계획의 사진은 임시그림 이름(key) 또는 올린 사진 주소라서, 여행기에 저장하는 사진 주소(src)로 바꿔 줍니다.
          const base = { ...result.journal, j_photo: photoSrc(result.journal.j_photo), u_id: userId, u_name: user?.user_name, p_create: new Date().toLocaleDateString('sv-SE') };
          const initDays = (result.days ?? []).map((d) => ({ ...d, items: d.items.map((it) => ({ ...it, ji_photo: photoSrc(it.ji_photo) })) }));
          setJournal(base);
          setDays(initDays);
          setDraft({ j_title: base.j_title || '', j_intro: base.j_intro || '', j_photo: base.j_photo || '' });
          setDraftDays(initDays.map((d) => ({ ...d, items: d.items.map((it) => ({ ...it })) })));
          setEditing(true);
        } catch (err) {
          if (!cancelled) setError(err.message || '여행기 정보를 불러오지 못했습니다.');
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

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
        journalApi.getHashtags(journalId)
          .then((list) => { if (!cancelled) setTags(list.map((t) => t.h_name)); })
          .catch(() => {});
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
  }, [journalId, tripId]);

  useEffect(() => {
    let cancelled = false;

    const loadMyLikes = async () => {
      if (creating || userId == null) {
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

  const startEdit = () => {
    setDraft({
      j_title: journal.j_title || '',
      j_intro: journal.j_intro || '',
      j_photo: journal.j_photo || '',
    });
    setDraftDays(days.map((d) => ({ ...d, items: d.items.map((it) => ({ ...it })) })));
    setError('');
    setEditing(true);
  };

  const setDraftItem = (i, j, patch) => {
    setDraftDays((prev) => prev.map((d, di) => (di !== i ? d : {
      ...d,
      items: d.items.map((it, ii) => (ii !== j ? it : { ...it, ...patch })),
    })));
  };

  const saveEdit = async () => {
    if (busy) return;
    const title = draft.j_title.trim();
    if (!title) {
      setError('여행기 제목을 입력해 주세요.');
      return;
    }

    const items = draftDays.flatMap((d) => d.items.map((it) => {
      const row = {
        [creating ? 'pd_id' : 'ji_id']: creating ? it.pd_id : it.ji_id,
        ji_content: it.ji_content || '',
        ji_photo: it.ji_photo || null,
      };
      // 별점은 있을 때만 보냄 (수정 API 는 null 별점을 거부함)
      if (it.ji_rating) row.ji_rating = it.ji_rating;
      return row;
    }));
    const payload = { j_title: title, j_intro: draft.j_intro.trim() || null, j_photo: draft.j_photo || null, items };

    setBusy(true);
    setError('');
    try {
      if (creating) {
        const created = await journalApi.create(tripId, payload);
        const savedId = created?.journal?.j_id;
        if (!savedId) throw new Error('저장 결과에서 여행기 ID를 확인할 수 없습니다.');
        navigate(`/journals/${savedId}`, { replace: true });
        return;
      }
      const result = await journalApi.update(journalId, payload);
      setJournal((prev) => ({ ...prev, ...result.journal }));
      setDays(result.days ?? []);
      setEditing(false);
    } catch (err) {
      setError(err.message || '여행기를 저장하지 못했습니다.');
    } finally {
      setBusy(false);
    }
  };

  const removeJournal = async () => {
    if (busy) return;
    if (!window.confirm('여행기를 삭제할까요? 되돌릴 수 없어요.')) return;
    setBusy(true);
    try {
      await journalApi.remove(journalId);
      navigate('/journals');
    } catch (err) {
      setError(err.message || '여행기를 삭제하지 못했습니다.');
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

  const fmtDate = (d) => (d || '').slice(0, 10).replace(/-/g, '.');
  const authorName = creating ? (user?.user_name || '') : (journal.u_name || `사용자 ${journal.u_id}`);

  return (
    <div className="form-page jd" style={{ maxWidth: 800 }}>
      {editing ? (
        <input
          className="jd-edit__title"
          value={draft.j_title}
          maxLength={100}
          placeholder="여행기 제목"
          onChange={(e) => setDraft({ ...draft, j_title: e.target.value })}
        />
      ) : (
        <h1 className="jd__title">{journal.j_title}</h1>
      )}
      <div className="jd__meta">
        <span>{authorName}</span>
        <span>{(journal.p_create || '').slice(0, 10)}</span>
        {!creating && (
          <button
            type="button"
            className={`jd__like${liked ? ' on' : ''}`}
            onClick={toggleLike}
            disabled={busy}
            aria-pressed={liked}
          >
            {liked ? '♥' : '♡'} {likeCount}
          </button>
        )}
      </div>

      {!creating && <Tags tags={tags} />}

      {owner && !editing && (
        <div className="jd__actions">
          <button type="button" className="btn" onClick={startEdit}>여행기 수정</button>
          <button type="button" className="btn btn--danger" onClick={removeJournal} disabled={busy}>삭제</button>
        </div>
      )}
      {owner && editing && (
        <div className="jd__actions">
          <button type="button" className="btn btn--primary" onClick={saveEdit} disabled={busy}>{creating ? '여행기 등록' : '저장'}</button>
          <button type="button" className="btn" onClick={() => { setError(''); if (creating) navigate(`/trips/${tripId}`); else setEditing(false); }} disabled={busy}>취소</button>
        </div>
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      {editing ? (
        <>
          <input
            className="jd-edit__intro"
            value={draft.j_intro}
            maxLength={100}
            placeholder="한 줄 소개"
            onChange={(e) => setDraft({ ...draft, j_intro: e.target.value })}
          />
          <div className="jd-edit__photo">
            <span>대표 사진</span>
            <PhotoPicker
              value={draft.j_photo}
              size={48}
              onChange={(src) => setDraft({ ...draft, j_photo: draft.j_photo === src ? '' : src })}
            />
          </div>
        </>
      ) : (
        <>
          {journal.j_intro && <p className="jd__intro">{journal.j_intro}</p>}
          {journal.j_photo && (
            <img src={journal.j_photo} alt={journal.j_title} className="jd__cover" />
          )}
        </>
      )}

      {days.length === 0 && <p>{creating ? '여행계획에 등록된 일정이 없어요. 여행계획에서 일정을 먼저 추가해 주세요.' : '등록된 여행 일정이 없습니다.'}</p>}

      {(editing ? draftDays : days).map((day, i) => (
        <section key={day.ji_day ?? i} className="jd-day">
          <h2 className="jd-day__head">
            <span>Day {day.ji_day ?? i + 1}</span>
            <span className="jd-day__date">{fmtDate(day.date)}</span>
          </h2>

          {day.items.map((item, j) => (editing ? (
            <div key={item.ji_id ?? item.pd_id} className="jd-item">
              <div className="jd-item__top">
                {item.ji_time && <span className="jd-item__time">{item.ji_time}</span>}
                <strong>{item.ji_title}</strong>
              </div>
              <div className="jd-edit__stars" role="group" aria-label="별점">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={item.ji_rating >= n ? 'on' : ''}
                    aria-label={`${n}점`}
                    onClick={() => setDraftItem(i, j, { ji_rating: item.ji_rating === n ? null : n })}
                  >★</button>
                ))}
              </div>
              <textarea
                className="jd-edit__text"
                value={item.ji_content || ''}
                placeholder="여행 기록을 남겨 보세요."
                onChange={(e) => setDraftItem(i, j, { ji_content: e.target.value })}
              />
              <PhotoPicker
                value={item.ji_photo || ''}
                size={48}
                onChange={(src) => setDraftItem(i, j, { ji_photo: item.ji_photo === src ? '' : src })}
              />
            </div>
          ) : (
            <div key={item.ji_id} className="jd-item">
              <div className="jd-item__top">
                {item.ji_time && <span className="jd-item__time">{item.ji_time}</span>}
                <strong>{item.ji_title}</strong>
              </div>
              {item.ji_rating > 0 && (
                <div className="jd-item__stars" aria-label={`${item.ji_rating}점`}>
                  {'★'.repeat(item.ji_rating)}{'☆'.repeat(5 - item.ji_rating)}
                </div>
              )}
              {item.ji_content && <p className="jd-item__text">{item.ji_content}</p>}
              {item.ji_photo && (
                <img src={item.ji_photo} alt={`${item.ji_title} 여행 사진`} className="jd-item__photo" />
              )}
            </div>
          )))}
        </section>
      ))}

      {!creating && <div className="jd__back"><Link to="/journals" className="btn">목록으로</Link></div>}

      {!creating && <section className="card" style={{ padding: 24 }}>
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
                <Avatar name={comment.u_name || `사용자 ${comment.u_id}`} />
                <strong>{comment.u_name || `사용자 ${comment.u_id}`}</strong>
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
      </section>}
    </div>
  );
}
