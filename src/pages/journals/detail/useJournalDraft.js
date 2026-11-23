// [여행기 상세] 수정 중인 내용(초안) 보관: 제목·소개·대표 사진, 날짜별 일정 기록.
// 저장하기 전까지는 원본(journal, days)을 건드리지 않고 이 초안만 고칩니다.
import { useState } from 'react';

export default function useJournalDraft() {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);          // { j_title, j_intro, j_photo }
  const [draftDays, setDraftDays] = useState([]);

  // 원본 여행기를 복사해서 수정 상태를 시작합니다.
  const begin = (journal, days) => {
    setDraft({
      j_title: journal.j_title || '',
      j_intro: journal.j_intro || '',
      j_photo: journal.j_photo || '',
    });
    setDraftDays(days.map((d) => ({ ...d, items: d.items.map((it) => ({ ...it })) })));
    setEditing(true);
  };

  const stop = () => setEditing(false);

  // dayIndex 번째 날의 itemIndex 번째 기록의 일부만 바꿉니다.
  const setDraftItem = (dayIndex, itemIndex, patch) => {
    setDraftDays((prev) => prev.map((d, di) => (di !== dayIndex ? d : {
      ...d,
      items: d.items.map((it, ii) => (ii !== itemIndex ? it : { ...it, ...patch })),
    })));
  };

  return { editing, draft, setDraft, draftDays, begin, stop, setDraftItem };
}
