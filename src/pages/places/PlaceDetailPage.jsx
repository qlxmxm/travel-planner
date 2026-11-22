// [장소] 장소 상세: 정보 + 평균 별점 + 리뷰(작성/수정/삭제). 내가 쓴 리뷰에만 수정·삭제 버튼이 보입니다.
// 한 사람이 한 장소에 리뷰를 여러 개 쓸 수 있습니다 (팀 결정). 리뷰 쓰기는 로그인한 사람만 가능합니다.
// 화면 조립만 하고, 리뷰 상태는 useReviews, 각 영역은 PlaceInfo / ReviewForm / ReviewItem 이 맡습니다.
// 서버: GET /api/locations/{l_id}, 리뷰 API (GET/POST /api/locations/{l_id}/reviews, PUT/DELETE /api/reviews/{lr_id})
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { placeApi } from '../../api/placeApi.js';
import useAsync from '../../hooks/useAsync.js';
import PlaceInfo from './PlaceInfo.jsx';
import ReviewForm from './ReviewForm.jsx';
import ReviewItem from './ReviewItem.jsx';
import useReviews from './useReviews.js';
import { summarizeReviews } from './placeUtils.js';

export default function PlaceDetailPage() {
  const placeId = Number(useParams().placeId);
  const { user, isLoggedIn } = useAuth();
  const { data: place, loading, error } = useAsync(() => placeApi.get(placeId), [placeId]);
  const { reviews, actionError, addReview, updateReview, deleteReview } = useReviews(placeId);

  if (loading && !place) return <p className="list-count">불러오는 중…</p>;
  if (!place) {
    return (
      <EmptyState icon="📍" title="장소를 찾을 수 없어요" description={error}>
        <Link to="/places" className="btn">장소 목록으로</Link>
      </EmptyState>
    );
  }

  return (
    <article className="pd">
      <Link to="/places" className="pd__back">← 장소 목록</Link>
      <PlaceInfo place={place} reviewSummary={summarizeReviews(reviews)} />

      <section className="pd-reviews">
        <h2>리뷰 {reviews.length}</h2>
        {isLoggedIn ? (
          <ReviewForm onSubmit={addReview} />
        ) : (
          <p className="pd-reviews__note"><Link to="/login">로그인</Link>하면 리뷰를 남길 수 있어요.</p>
        )}
        {actionError && <p className="pd-reviews__note" role="alert">{actionError}</p>}
        {reviews.length === 0 ? (
          <EmptyState icon="💬" title="아직 리뷰가 없어요" description="첫 리뷰를 남겨보세요." />
        ) : (
          <ul className="pd-reviews__list">
            {reviews.map((review) => (
              <ReviewItem key={review.lr_id} review={review} isMine={isLoggedIn && review.u_id === user.user_id}
                onUpdate={updateReview} onDelete={deleteReview} />
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
