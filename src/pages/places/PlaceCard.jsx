// [장소] 장소 목록의 카드 한 장
import { Link } from 'react-router-dom';
import StarRating from '../../components/common/StarRating.jsx';
import { photos } from '../../data/photos.js';
// l_image: 서버는 이름표("gyukatsu")만 줌 → photos[이름표]로 진짜 사진을 꺼냄 (없으면 그대로 사용)

export default function PlaceCard({ place, reviewSummary }) {
  const { average, count } = reviewSummary;
  return (
    <Link to={`/places/${place.l_id}`} className="card pl-card">
      <img src={photos[place.l_image] ?? place.l_image} alt="" />
      <div className="pl-card__body">
        <div className="pl-card__cat">{place.l_category} · {place.l_city}</div>
        <div className="pl-card__name">{place.l_name}</div>
        <div className="pl-card__rating">
          <StarRating value={average} size={15} />
          <span>{count ? `${average.toFixed(1)} (${count})` : '리뷰 없음'}</span>
        </div>
      </div>
    </Link>
  );
}
