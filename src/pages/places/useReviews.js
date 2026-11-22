// [장소] 한 장소의 리뷰 목록과 추가/수정/삭제. 서버(리뷰 API)와 주고받습니다.
// 한 사람이 한 장소에 리뷰를 여러 개 쓸 수 있습니다 (팀 결정). 수정/삭제는 작성자 본인만 가능합니다(서버도 확인).
import { useState } from 'react';
import { placeApi } from '../../api/placeApi.js';
import useAsync from '../../hooks/useAsync.js';

export default function useReviews(placeId) {
  const { data, loading, error, reload } = useAsync(() => placeApi.listReviews(placeId), [placeId]);
  const [actionError, setActionError] = useState('');
  const reviews = data ?? [];

  // 쓰기/수정/삭제가 끝나면 서버에서 목록을 다시 받아 화면을 맞춥니다. 실패하면 메시지를 보여줍니다.
  async function runAction(action) {
    setActionError('');
    try {
      await action();
      reload();
    } catch (err) {
      setActionError(err.message);
    }
  }

  const addReview = (input) => runAction(() => placeApi.createReview(placeId, input));
  const updateReview = (reviewId, input) => runAction(() => placeApi.updateReview(reviewId, input));
  const deleteReview = (reviewId) => runAction(() => placeApi.deleteReview(reviewId));

  return { reviews, loading, error, actionError, addReview, updateReview, deleteReview };
}
