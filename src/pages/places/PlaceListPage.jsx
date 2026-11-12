// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색 + 카드 목록. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// TODO: GET /places?category=&q= 연결 (검색은 이름·카테고리·도시·주소)
import { useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { places, placeReviews, placeTabs, PLACE_CATEGORY } from '../../data/samplePlaces.js';
import PlaceCard from './PlaceCard.jsx';
import { filterPlaces, summarizeReviews } from './placeUtils.js';

const getReviewsOfPlace = (place) => placeReviews.filter((review) => review.l_id === place.l_id);

export default function PlaceListPage() {
  const [category, setCategory] = useState(PLACE_CATEGORY.ALL);
  const [keyword, setKeyword] = useState('');
  const visiblePlaces = filterPlaces(places, category, keyword);

  return (
    <>
      <PageHeader title="장소" description="맛집, 관광명소, 숙소를 찾아보고 다녀온 사람들의 리뷰를 확인하세요." />
      <div className="list-toolbar">
        <div className="chip-row">
          {placeTabs.map((tab) => (
            <button key={tab} type="button" className={`chip${tab === category ? ' active' : ''}`} onClick={() => setCategory(tab)}>{tab}</button>
          ))}
        </div>
        <input type="search" className="list-search" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="장소 이름, 카테고리, 도시, 주소로 검색" aria-label="장소 검색" />
      </div>
      <p className="list-count">{visiblePlaces.length}곳</p>
      {visiblePlaces.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
      ) : (
        <div className="pl-grid">
          {visiblePlaces.map((place) => (
            <PlaceCard key={place.l_id} place={place} reviewSummary={summarizeReviews(getReviewsOfPlace(place))} />
          ))}
        </div>
      )}
    </>
  );
}
