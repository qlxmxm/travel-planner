// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색 + 카드 목록. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// 서버: GET /api/locations?category=&q=  (검색은 이름·도시·주소). 입력을 멈추고 0.3초 뒤에 검색합니다.
import { useEffect, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { placeApi } from '../../api/placeApi.js';
import useAsync from '../../hooks/useAsync.js';
import PlaceCard from './PlaceCard.jsx';
import { PLACE_CATEGORY, placeTabs, summaryOfPlace } from './placeUtils.js';

const SEARCH_DELAY_MS = 300;

function useDebounced(value, delay) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export default function PlaceListPage() {
  const [category, setCategory] = useState(PLACE_CATEGORY.ALL);
  const [keyword, setKeyword] = useState('');
  const searchWord = useDebounced(keyword, SEARCH_DELAY_MS);
  const { data, loading, error, reload } = useAsync(() => placeApi.list({ category, keyword: searchWord }), [category, searchWord]);
  const places = data ?? [];

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
          placeholder="장소 이름, 도시, 주소로 검색" aria-label="장소 검색" />
      </div>
      {error ? (
        <EmptyState icon="⚠️" title="장소를 불러오지 못했어요" description={error}>
          <button type="button" className="btn" onClick={reload}>다시 시도</button>
        </EmptyState>
      ) : loading && !data ? (
        <p className="list-count">불러오는 중…</p>
      ) : (
        <>
          <p className="list-count">{places.length}곳</p>
          {places.length === 0 ? (
            <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
          ) : (
            <div className="pl-grid">
              {places.map((place) => <PlaceCard key={place.l_id} place={place} reviewSummary={summaryOfPlace(place)} />)}
            </div>
          )}
        </>
      )}
    </>
  );
}
