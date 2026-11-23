// [여행기 상세] 맨 위: 제목(수정 중에는 입력칸) + 작성자 · 작성일 · 좋아요 버튼.
import { dateOnly } from '../../../utils/date.js';

export default function JournalTitle({ editing, creating, journal, draft, onDraftChange, authorName, liked, likeCount, busy, onToggleLike }) {
  return (
    <>
      {editing ? (
        <input
          className="jd-edit__title"
          value={draft.j_title}
          maxLength={100}
          placeholder="여행기 제목"
          onChange={(e) => onDraftChange({ ...draft, j_title: e.target.value })}
        />
      ) : (
        <h1 className="jd__title">{journal.j_title}</h1>
      )}
      <div className="jd__meta">
        <span>{authorName}</span>
        <span>{dateOnly(journal.p_create)}</span>
        {!creating && (
          <button
            type="button"
            className={`jd__like${liked ? ' on' : ''}`}
            onClick={onToggleLike}
            disabled={busy}
            aria-pressed={liked}
          >
            {liked ? '♥' : '♡'} {likeCount}
          </button>
        )}
      </div>
    </>
  );
}
