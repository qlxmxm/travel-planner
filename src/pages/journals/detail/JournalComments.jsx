// [여행기 상세] 댓글 영역: 개수 · 작성 폼 · 댓글 목록(내 댓글은 수정/삭제).
import Avatar from '../../../components/common/Avatar.jsx';
import { dateOnly } from '../../../utils/date.js';

const authorOf = (comment) => comment.u_name || `사용자 ${comment.u_id}`;

function CommentItem({ comment, isMine, isEditing, busy, state }) {
  return (
    <div style={{ borderTop: '1px solid var(--border, #ddd)', paddingTop: 20, marginTop: 20 }}>
      <div className="journal-card__by">
        <Avatar name={authorOf(comment)} />
        <strong>{authorOf(comment)}</strong>
        <span>{dateOnly(comment.jc_create)}</span>
      </div>

      {isEditing ? (
        <div style={{ marginTop: 12 }}>
          <textarea
            className="field"
            style={{ width: '100%' }}
            value={state.editingContent}
            onChange={(e) => state.setEditingContent(e.target.value)}
          />
          <div className="form-actions">
            <button type="button" className="btn" disabled={busy} onClick={state.cancelEditComment}>취소</button>
            <button type="button" className="btn btn--primary" disabled={busy} onClick={() => state.updateComment(comment.jc_id)}>저장</button>
          </div>
        </div>
      ) : (
        <>
          <p style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>{comment.jc_content}</p>
          {isMine && (
            <div className="form-actions">
              <button type="button" className="btn" disabled={busy} onClick={() => state.startEditComment(comment)}>수정</button>
              <button type="button" className="btn btn--danger" disabled={busy} onClick={() => state.removeComment(comment.jc_id)}>삭제</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function JournalComments({ userId, busy, error, state }) {
  const { comments } = state;
  return (
    <section className="card" style={{ padding: 24 }}>
      <h2 style={{ marginBottom: 20 }}>댓글 {comments.length}</h2>

      {error && <p className="form-error" role="alert">{error}</p>}

      <form onSubmit={state.addComment}>
        <label className="field field--full">
          <span>댓글 작성</span>
          <textarea
            value={state.content}
            onChange={(e) => state.setContent(e.target.value)}
            placeholder={userId == null ? '로그인 후 댓글을 작성할 수 있습니다.' : '여행기에 대한 댓글을 남겨 보세요.'}
            disabled={userId == null || busy}
          />
        </label>
        <div className="form-actions">
          <button type="submit" className="btn btn--primary" disabled={userId == null || busy}>댓글 등록</button>
        </div>
      </form>

      {comments.length === 0 && <p style={{ marginTop: 24 }}>아직 댓글이 없습니다.</p>}

      {comments.map((comment) => (
        <CommentItem
          key={comment.jc_id}
          comment={comment}
          isMine={userId != null && Number(comment.u_id) === Number(userId)}
          isEditing={state.editingCommentId === comment.jc_id}
          busy={busy}
          state={state}
        />
      ))}
    </section>
  );
}
