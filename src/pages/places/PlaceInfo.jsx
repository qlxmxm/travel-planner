// [장소] 상세 화면 위쪽: 사진 + 이름 + 평균 별점 + 주소/전화/영업시간 + 소개 + 지도 자리
import StarRating from '../../components/common/StarRating.jsx';
import { formatHours, getHoursLabel } from './placeUtils.js';
import { photos } from '../../data/photos.js';
// l_image: 서버는 이름표("gyukatsu")만 줌 → photos[이름표]로 진짜 사진을 꺼냄 (없으면 그대로 사용)

export default function PlaceInfo({ place, reviewSummary }) {
  const { average, count } = reviewSummary;
  return (
    <>
      <div className="pd__top">
        <img src={photos[place.l_image] ?? place.l_image} alt="" />
        <div className="pd__info">
          <div className="pd__cat">{place.l_category} · {place.l_city}</div>
          <h1>{place.l_name}</h1>
          <div className="pd__avg">
            <StarRating value={average} size={22} />
            <b>{count ? average.toFixed(1) : '-'}</b>
            <span>리뷰 {count}개</span>
          </div>
          <dl>
            <dt>주소</dt><dd>{place.l_add}</dd>
            <dt>전화</dt><dd>{place.l_telno}</dd>
            <dt>{getHoursLabel(place)}</dt><dd>{formatHours(place)}</dd>
          </dl>
        </div>
      </div>
      <p className="pd__intro">{place.l_intro}</p>
      <div className="placeholder-box pd__map">지도 자리 (추후 구글지도 API 연동)</div>
    </>
  );
}
