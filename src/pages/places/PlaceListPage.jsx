// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색 + 카드 목록. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// 서버: GET /api/locations?category=&q=  (검색은 이름·도시·주소). 입력을 멈추고 0.3초 뒤에 검색합니다.
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { placeApi } from '../../api/placeApi.js';
import PlaceCard from './PlaceCard.jsx';
import { PLACE_CATEGORY, placeTabs, summaryOfPlace } from './placeUtils.js';

const SEARCH_DELAY_MS = 300;
const PAGE_SIZE = 50;   // 한 번에 50곳씩, 아래로 스크롤하면 이어서 불러옴

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
  const [minRating, setMinRating] = useState('');   // '' 전체 / '4' / '4.5' ... 이상
  const [sort, setSort] = useState('');              // '' 기본순 / 'rating' / 'reviews'
  const [places, setPlaces] = useState([]);
  const [page, setPage] = useState(1);          // 마지막으로 불러온 쪽
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);           // 다시 시도용
  const reqId = useRef(0);                       // 검색어가 바뀌면 이전 요청 결과는 버림

  const load = useCallback(async (nextPage) => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const rows = await placeApi.listPage({ category, keyword: searchWord, page: nextPage, size: PAGE_SIZE, minRating, sort });
      if (id !== reqId.current) return;
      setPlaces((prev) => (nextPage === 1 ? rows : [...prev, ...rows]));
      setPage(nextPage);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (err) {
      if (id === reqId.current) setError(err.message || '불러오지 못했어요.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [category, searchWord, minRating, sort]);

  // 카테고리·검색어가 바뀌면 처음부터 다시
  useEffect(() => { setPlaces([]); setHasMore(false); load(1); }, [load, tick]);

  // 목록 맨 아래의 보이지 않는 표시가 화면에 들어오면 다음 쪽을 불러옴
  const bottom = useRef(null);
  useEffect(() => {
    const el = bottom.current;
    if (!el || !hasMore || loading || error) return undefined;
    const io = new IntersectionObserver((entries) => { if (entries[0].isIntersecting) load(page + 1); }, { rootMargin: '300px' });
    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, loading, error, page, load]);
  const reload = () => setTick((t) => t + 1);

  return (
    <>
      <PageHeader title="장소" description="맛집, 관광명소, 숙소를 찾아보고 다녀온 사람들의 리뷰를 확인하세요." />
      <div className="list-toolbar">
        <div className="chip-row">
          {placeTabs.map((tab) => (
            <button key={tab} type="button" className={`chip${tab === category ? ' active' : ''}`} onClick={() => setCategory(tab)}>{tab}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
        <select className="list-search" style={{ width: 'auto' }} value={minRating} onChange={(e) => setMinRating(e.target.value)} aria-label="별점 필터">
          <option value="">별점 전체</option>
          <option value="4.5">★ 4.5 이상</option>
          <option value="4">★ 4.0 이상</option>
          <option value="3">★ 3.0 이상</option>
        </select>
        <select className="list-search" style={{ width: 'auto' }} value={sort} onChange={(e) => setSort(e.target.value)} aria-label="정렬">
          <option value="">기본순</option>
          <option value="rating">별점 높은 순</option>
          <option value="rating_asc">별점 낮은 순</option>
          <option value="reviews">리뷰 많은 순</option>
          <option value="reviews_asc">리뷰 적은 순</option>
        </select>
        <input type="search" className="list-search" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="장소 이름, 도시, 주소로 검색" aria-label="장소 검색" />
        </div>
      </div>
      {error ? (
        <EmptyState icon="⚠️" title="장소를 불러오지 못했어요" description={error}>
          <button type="button" className="btn" onClick={reload}>다시 시도</button>
        </EmptyState>
      ) : loading && places.length === 0 ? (
        <p className="list-count">불러오는 중…</p>
      ) : (
        <>
          <p className="list-count">{places.length}곳{hasMore ? ' 이상' : ''}</p>
          {places.length === 0 ? (
            <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
          ) : (
            <div className="pl-grid">
              {places.map((place) => <PlaceCard key={place.l_id} place={place} reviewSummary={summaryOfPlace(place)} />)}
            </div>
          )}
          {hasMore && <div ref={bottom} className="list-count" role="status" style={{ textAlign: 'center', padding: 24 }}>{loading ? '더 불러오는 중…' : ''}</div>}
        </>
      )}
    </>
  );
}
