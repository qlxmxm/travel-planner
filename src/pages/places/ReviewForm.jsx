// [장소] 리뷰 작성 폼 (별점 + 내용). 등록하면 onSubmit({ rating, content }) 를 부르고 입력칸을 비웁니다.
import { useState } from 'react';
import StarRating from '../../components/common/StarRating.jsx';
import { isValidReview } from './placeUtils.js';

export default function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    if (!isValidReview(rating, content)) return;
    onSubmit({ rating, content });
    setRating(0);
    setContent('');
  }

  return (
    <form className="pd-reviews__form" onSubmit={handleSubmit}>
      <div className="pd-reviews__rate"><span>별점</span><StarRating value={rating} onChange={setRating} size={26} /></div>
      <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="다녀온 경험을 남겨보세요" aria-label="리뷰 내용" />
      <button type="submit" className="btn btn--primary" disabled={!isValidReview(rating, content)}>리뷰 등록</button>
    </form>
  );
}
