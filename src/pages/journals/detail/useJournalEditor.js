// [여행기 상세] 여행기 수정 · 새로 쓰기 저장 · 삭제.
import { useNavigate } from 'react-router-dom';
import { journalApi } from '../../../api/journalApi.js';

// 서버로 보낼 내용: 제목·소개·대표 사진 + 날짜별 기록.
// 새로 쓰기는 여행계획 일정(pd_id), 수정은 기존 기록(ji_id)을 기준으로 보냅니다.
function buildJournalPayload(draft, draftDays, creating) {
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
  return {
    j_title: draft.j_title.trim(),
    j_intro: draft.j_intro.trim() || null,
    j_photo: draft.j_photo || null,
    items,
  };
}

export default function useJournalEditor({ journalId, tripId, creating, detail, draftState, action }) {
  const navigate = useNavigate();
  const { journal, days, setJournal, setDays } = detail;

  const startEdit = () => {
    action.setError('');
    draftState.begin(journal, days);
  };

  const cancelEdit = () => {
    action.setError('');
    if (creating) navigate(`/trips/${tripId}`);
    else draftState.stop();
  };

  const saveEdit = () => {
    if (action.busy) return;
    if (!draftState.draft.j_title.trim()) {
      action.setError('여행기 제목을 입력해 주세요.');
      return;
    }
    const payload = buildJournalPayload(draftState.draft, draftState.draftDays, creating);

    action.run(async () => {
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
      draftState.stop();
    }, '여행기를 저장하지 못했습니다.');
  };

  const removeJournal = () => {
    if (action.busy) return;
    if (!window.confirm('여행기를 삭제할까요? 되돌릴 수 없어요.')) return;
    action.run(async () => {
      await journalApi.remove(journalId);
      navigate('/journals');
    }, '여행기를 삭제하지 못했습니다.');
  };

  return { startEdit, cancelEdit, saveEdit, removeJournal };
}
