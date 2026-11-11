// [장소] 리뷰 한 개. 내 리뷰(isMine)일 때만 수정/삭제 버튼이 보입니다.
import { useState } from 'react';
import Avatar from '../../components/common/Avatar.jsx';
import StarRating from '../../components/common/StarRating.jsx';
import { isValidReview } from './placeUtils.js';

export default function ReviewItem({ review, isMine, onUpdate, onDelete }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({ rating: 0, content: '' });

  function startEditing() {
    setDraft({ rating: review.lr_rating, content: review.lr_content });
    setIsEditing(true);
  }

  function saveEditing() {
    if (!isValidReview(draft.rating, draft.content)) return;
    onUpdate(review.lr_id, draft);
    setIsEditing(false);
  }

  return (
    <li>
      <Avatar name={review.u_name} />
      <div className="pd-reviews__body">
        <div><b>{review.u_name}</b><span>{review.lr_create}</span></div>
        {isEditing ? (
          <div className="pd-reviews__edit">
            <StarRating value={draft.rating} onChange={(rating) => setDraft((current) => ({ ...current, rating }))} size={22} />
            <textarea value={draft.content} onChange={(e) => setDraft((current) => ({ ...current, content: e.target.value }))} aria-label="리뷰 수정" />
            <div>
              <button type="button" className="btn btn--primary btn--small" onClick={saveEditing}>저장</button>
              <button type="button" className="btn btn--small" onClick={() => setIsEditing(false)}>취소</button>
            </div>
          </div>
        ) : (
          <>
            <StarRating value={review.lr_rating} size={15} />
            <p>{review.lr_content}</p>
          </>
        )}
        {isMine && !isEditing && (
          <div>
            <button type="button" className="btn btn--text" onClick={startEditing}>수정</button>
            <button type="button" className="btn btn--text" onClick={() => onDelete(review.lr_id)}>삭제</button>
          </div>
        )}
      </div>
    </li>
  );
}
