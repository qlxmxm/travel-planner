// [여행기 상세] 좋아요: 내가 눌렀는지 확인하고, 누르기/취소하기를 처리합니다.
import { useEffect, useState } from 'react';
import { journalApi } from '../../../api/journalApi.js';

export default function useJournalLike({ journalId, creating, userId, action, setLikeCount }) {
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLiked(false);
    if (creating || userId == null) return undefined;

    journalApi.getMyLikes()
      .then((likes) => {
        if (!cancelled) setLiked(likes.some((like) => Number(like.j_id) === Number(journalId)));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [journalId, userId]);

  const toggleLike = () => {
    if (action.busy) return;
    if (userId == null) {
      action.setError('좋아요를 누르려면 로그인해 주세요.');
      return;
    }
    action.run(async () => {
      if (liked) await journalApi.removeLike(journalId);
      else await journalApi.addLike(journalId);
      setLiked((prev) => !prev);
      const result = await journalApi.getLikeCount(journalId);
      setLikeCount(result.like_count ?? 0);
    }, '좋아요를 변경하지 못했습니다.');
  };

  return { liked, toggleLike };
}
