// [여행기] 여행기 상세 화면. 같은 화면을 세 가지로 씁니다:
//   보기 /journals/:journalId  ·  수정(보기 화면에서 바로)  ·  새로 쓰기 /journals/new/from/:tripId (여행계획의 일정을 가져와 수정 상태로 시작)
// 이 파일은 조립만 해요. 데이터·동작은 detail/use*.js, 화면 조각은 detail/Journal*.jsx 에 있습니다.
import { Link, useParams } from 'react-router-dom';
import Tags from '../../components/common/Tags.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import useBusyAction from '../../hooks/useBusyAction.js';
import useJournalDraft from './detail/useJournalDraft.js';
import useJournalDetail from './detail/useJournalDetail.js';
import useJournalLike from './detail/useJournalLike.js';
import useJournalEditor from './detail/useJournalEditor.js';
import useJournalComments from './detail/useJournalComments.js';
import JournalTitle from './detail/JournalTitle.jsx';
import JournalActions from './detail/JournalActions.jsx';
import JournalIntro from './detail/JournalIntro.jsx';
import JournalDayList from './detail/JournalDayList.jsx';
import JournalComments from './detail/JournalComments.jsx';

export default function JournalDetailPage() {
  const { journalId, tripId } = useParams();
  const creating = !journalId;
  const { user } = useAuth();
  const userId = user?.user_id;

  const action = useBusyAction();               // 버튼 요청 중(busy) · 실패 메시지(error)
  const draftState = useJournalDraft();         // 수정 중인 내용
  const detail = useJournalDetail({ journalId, tripId, creating, user, setError: action.setError, draftState });
  const { liked, toggleLike } = useJournalLike({ journalId, creating, userId, action, setLikeCount: detail.setLikeCount });
  const editor = useJournalEditor({ journalId, tripId, creating, detail, draftState, action });
  const commentState = useJournalComments({ journalId, userId, comments: detail.comments, setComments: detail.setComments, action });

  const { journal, days, loading } = detail;
  const { editing, draft, draftDays } = draftState;
  const { busy, error } = action;

  if (loading) return <p>여행기를 불러오는 중입니다.</p>;

  if (!journal) {
    return (
      <EmptyState icon="🔒" title="여행기를 불러올 수 없습니다." description={error || '여행기 정보를 확인해 주세요.'}>
        <Link to="/journals" className="btn btn--primary">여행기 목록으로</Link>
      </EmptyState>
    );
  }

  const isOwner = creating || (userId != null && Number(journal.u_id) === Number(userId));
  const authorName = creating ? (user?.user_name || '') : (journal.u_name || `사용자 ${journal.u_id}`);

  return (
    <div className="form-page jd" style={{ maxWidth: 800 }}>
      <JournalTitle
        editing={editing}
        creating={creating}
        journal={journal}
        draft={draft}
        onDraftChange={draftState.setDraft}
        authorName={authorName}
        liked={liked}
        likeCount={detail.likeCount}
        busy={busy}
        onToggleLike={toggleLike}
      />

      {!creating && <Tags tags={detail.tags} />}

      {isOwner && (
        <JournalActions
          creating={creating}
          editing={editing}
          busy={busy}
          onStartEdit={editor.startEdit}
          onRemove={editor.removeJournal}
          onSave={editor.saveEdit}
          onCancel={editor.cancelEdit}
        />
      )}

      {error && <p className="form-error" role="alert">{error}</p>}

      <JournalIntro editing={editing} journal={journal} draft={draft} onDraftChange={draftState.setDraft} />

      {days.length === 0 && (
        <p>{creating ? '여행계획에 등록된 일정이 없어요. 여행계획에서 일정을 먼저 추가해 주세요.' : '등록된 여행 일정이 없습니다.'}</p>
      )}

      <JournalDayList days={editing ? draftDays : days} editing={editing} onItemChange={draftState.setDraftItem} />

      {!creating && <div className="jd__back"><Link to="/journals" className="btn">목록으로</Link></div>}

      {!creating && <JournalComments userId={userId} busy={busy} error={error} state={commentState} />}
    </div>
  );
}
