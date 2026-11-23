// [여행기 상세] 화면에 보여줄 데이터를 서버에서 불러옵니다.
//  - 보기/수정: 여행기 + 날짜별 기록 + 댓글 + 좋아요 수 + 해시태그
//  - 새로 쓰기: 여행계획의 일정으로 초안을 만들고 바로 수정 상태로 엽니다.
import { useEffect, useState } from 'react';
import { journalApi } from '../../../api/journalApi.js';
import { photoSrc } from '../../../api/planApi.js';

export default function useJournalDetail({ journalId, tripId, creating, user, setError, draftState }) {
  const [journal, setJournal] = useState(null);
  const [days, setDays] = useState([]);
  const [comments, setComments] = useState([]);
  const [likeCount, setLikeCount] = useState(0);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadForCreate = async () => {
      // 새로 쓰기: 여행계획 없이는 쓸 수 없어요.
      if (!tripId) { setError('여행계획에서 여행기 쓰기 버튼을 눌러 주세요.'); setLoading(false); return; }
      try {
        const result = await journalApi.getPlanPreview(tripId);
        if (cancelled) return;
        // 여행계획의 사진은 임시그림 이름(key) 또는 올린 사진 주소라서, 여행기에 저장하는 사진 주소(src)로 바꿔 줍니다.
        const base = {
          ...result.journal,
          j_photo: photoSrc(result.journal.j_photo),
          u_id: user?.user_id,
          u_name: user?.user_name,
          p_create: new Date().toLocaleDateString('sv-SE'),
        };
        const initDays = (result.days ?? []).map((d) => ({
          ...d,
          items: d.items.map((it) => ({ ...it, ji_photo: photoSrc(it.ji_photo) })),
        }));
        setJournal(base);
        setDays(initDays);
        draftState.begin(base, initDays);
      } catch (err) {
        if (!cancelled) setError(err.message || '여행기 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const loadForView = async () => {
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
        if (!cancelled) setError(err.message || '여행기를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    // 같은 화면을 다시 쓰므로(새로 쓰기 → 저장 후 상세) 이전 내용과 수정 상태를 먼저 비웁니다.
    setLoading(true);
    setError('');
    draftState.stop();
    setJournal(null);
    setDays([]);
    setComments([]);
    setLikeCount(0);

    if (creating) loadForCreate(); else loadForView();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [journalId, tripId]);

  return { journal, setJournal, days, setDays, comments, setComments, likeCount, setLikeCount, tags, loading };
}
