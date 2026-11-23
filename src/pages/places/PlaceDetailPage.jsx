// [장소] 장소 상세: 정보 + 평균 별점 + 리뷰(작성/수정/삭제). 리뷰는 "내 리뷰"에만 수정·삭제 버튼이 보입니다.
// 한 사람이 한 장소에 리뷰를 한 번만 쓸 수 있습니다 (DB: l_id + u_id UNIQUE → 서버에서는 409).
// 화면 조립만 하고, 리뷰 상태는 useReviews, 각 영역은 PlaceInfo / ReviewForm / ReviewItem 이 맡습니다.
// 완료: 장소 정보 GET /locations/{l_id} (getLocation), 리뷰 목록·작성·수정·삭제 (useReviews)
// 로그인 안 했으면 리뷰 작성 폼 대신 로그인 안내가 보입니다. 본인 리뷰가 아니면 서버가 403으로 막습니다.
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import PlaceInfo from './PlaceInfo.jsx';
import ReviewForm from './ReviewForm.jsx';
import ReviewItem from './ReviewItem.jsx';
import useReviews from './useReviews.js';
import { summarizeReviews } from './placeUtils.js';
import { useState, useEffect } from 'react';
import { getLocation } from '../../api/locationAPI.js';



export default function PlaceDetailPage() {
  
  const placeId = Number(useParams().placeId);
  const { user, isLoggedIn } = useAuth();
  const { reviews, myReview, error, addReview, updateReview, deleteReview } = useReviews(placeId, user);
  const[place, setPlace]=useState(null);
  const[loading, setLoading] = useState(true)

  useEffect(()=>{
    getLocation(placeId).then((data) => {setPlace(data); setLoading(false)})
                        .catch(() => {setLoading(false)})
  },[placeId]);

  if (loading) {
  return <p>불러오는 중...</p>;
  }

  if (!place) {
    return <EmptyState icon="📍" title="장소를 찾을 수 없어요"><Link to="/places" className="btn">장소 목록으로</Link></EmptyState>;
  }
  return (
    <article className="pd">
      <Link to="/places" className="pd__back">← 장소 목록</Link>
      <PlaceInfo place={place} reviewSummary={summarizeReviews(reviews)} />

      <section className="pd-reviews">
        <h2>리뷰 {reviews.length}</h2>
        {/* 내 리뷰가 있으면 안내 / 로그인 안 했으면 로그인 안내 / 둘 다 아니면 작성 폼 */}
        {myReview ? (
          <p className="pd-reviews__note">이미 이 장소에 리뷰를 남겼어요. 아래 내 리뷰에서 수정할 수 있어요.</p>
        ) : !isLoggedIn ? (
          <p className="pd-reviews__note"><Link to="/login">로그인</Link>하면 리뷰를 남길 수 있어요.</p>
        ) : (
          <ReviewForm onSubmit={addReview} />
        )}
        {/* 서버 요청이 실패하면 이유를 보여 줌 */}
        {error && <p className="form-error">{error}</p>}
        {reviews.length === 0 ? (
          <EmptyState icon="💬" title="아직 리뷰가 없어요" description="첫 리뷰를 남겨보세요." />
        ) : (
          <ul className="pd-reviews__list">
            {reviews.map((review) => (
              <ReviewItem key={review.lr_id} review={review} isMine={review.u_id === user.user_id}
                onUpdate={updateReview} onDelete={deleteReview} />
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
