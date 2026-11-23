// [장소] 한 장소의 리뷰 목록과 추가/수정/삭제. 서버 리뷰 API(명세서 40~43번)와 연결되어 있습니다.
// 화면(PlaceDetailPage)은 이 훅이 돌려주는 값과 함수만 쓰면 되고, 서버와 통신하는 건 여기서 맡습니다.
import { useState, useEffect } from 'react';
// useReviews 안의 함수 이름(updateReview, deleteReview)과 겹치지 않게 as 로 이름을 바꿔서 가져옴
import {
  getReviews,
  createReview,
  updateReview as updateReviewApi,
  deleteReview as deleteReviewApi,
} from '../../api/locationAPI.js';

export default function useReviews(placeId, user) {
  const [reviews, setReviews] = useState([]);   // 서버에서 받은 리뷰 목록 (처음엔 0개)
  const [error, setError] = useState('');       // 실패했을 때 화면에 보여 줄 메시지
  const myReview = reviews.find((review) => review.u_id === user.user_id);

  // 40 리뷰 목록: 장소가 바뀔 때마다 서버에서 다시 받아 옴
  useEffect(() => {
    getReviews(placeId)
      .then((data) => setReviews(data))
      .catch(() => setReviews([]));
  }, [placeId]);

  // 41 리뷰 작성: 서버에 저장 → 서버가 돌려준 리뷰(lr_id, 작성일 포함)를 목록 맨 앞에 추가
  async function addReview({ rating, content }) {
    setError('');
    try {
      const newReview = await createReview(placeId, rating, content.trim());
      setReviews((current) => [newReview, ...current]);
    } catch (e) {
      setError(e.message);   // 예) "로그인이 필요합니다", "이미 이 장소에 리뷰를 작성했습니다"
    }
  }

  // 42 리뷰 수정: 서버에서 고친 리뷰로 목록의 그 리뷰만 바꿔 끼움
  async function updateReview(reviewId, { rating, content }) {
    setError('');
    try {
      const updated = await updateReviewApi(reviewId, rating, content.trim());
      setReviews((current) => current.map((review) => (review.lr_id === reviewId ? updated : review)));
    } catch (e) {
      setError(e.message);
    }
  }

  // 43 리뷰 삭제: 서버에서 지운 다음 목록에서도 뺌
  async function deleteReview(reviewId) {
    setError('');
    try {
      await deleteReviewApi(reviewId);
      setReviews((current) => current.filter((review) => review.lr_id !== reviewId));
    } catch (e) {
      setError(e.message);
    }
  }

  return { reviews, myReview, error, addReview, updateReview, deleteReview };
}
