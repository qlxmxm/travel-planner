// [장소] 상세 화면 위쪽: 사진 + 이름 + 평균 별점 + 주소/전화/영업시간 + 소개 + 구글지도
import MapView from '../../components/common/MapView.jsx';
import StarRating from '../../components/common/StarRating.jsx';
import { formatHours, getHoursLabel, imageOfPlace } from './placeUtils.js';

export default function PlaceInfo({ place, reviewSummary }) {
  const { average, count } = reviewSummary;
  return (
    <>
      <div className="pd__top">
        <img src={imageOfPlace(place)} alt="" />
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
            <dt>전화</dt><dd>{place.l_telno || '정보 없음'}</dd>
            <dt>{getHoursLabel(place)}</dt><dd>{formatHours(place)}</dd>
          </dl>
        </div>
      </div>
      <p className="pd__intro">{place.l_intro}</p>
      <MapView lat={place.l_lat} lng={place.l_lng} name={place.l_name} address={place.l_add} className="pd__map" />
    </>
  );
}
