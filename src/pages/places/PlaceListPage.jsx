// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 별점 필터·정렬 + 검색 + 카드 목록 + 페이지 번호. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// 서버: GET /api/locations?category=&q=&min_rating=&sort=  (검색은 이름·도시·주소). 입력을 멈추고 0.3초 뒤에 검색합니다.
// 조건에 맞는 장소를 서버에서 전부 받아 온 뒤(100곳씩 이어 받기), 화면에서 15곳씩 나눠 페이지 번호로 보여 줍니다.
import { useCallback, useEffect, useRef, useState } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { placeApi } from '../../api/placeApi.js';
import PlaceCard from './PlaceCard.jsx';
import { PLACE_CATEGORY, placeTabs, summaryOfPlace } from './placeUtils.js';

const SEARCH_DELAY_MS = 300;
const PAGE_SIZE = 15;    // 한 페이지에 보여 줄 카드 수 (가로 3칸 × 세로 5줄)
const FETCH_SIZE = 100;  // 서버에서 한 번에 받을 최대 개수 (백엔드 최대값)
const MAX_FETCH = 20;    // 최대 20번(2000곳)까지 이어 받기

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
  const [allPlaces, setAllPlaces] = useState([]);    // 조건에 맞는 장소 전부
  const [page, setPage] = useState(1);               // 지금 보고 있는 페이지 번호
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);               // 다시 시도용
  const reqId = useRef(0);                           // 조건이 바뀌면 이전 요청 결과는 버림

  // 조건(탭·검색어·별점·정렬)이 바뀔 때만 서버에 다시 요청
  // (페이지 번호를 누를 때는 이미 받은 목록에서 잘라 보여 주기만 하니까 요청 안 함)
  const loadAll = useCallback(async () => {
    const id = ++reqId.current;
    setLoading(true);
    setError('');
    try {
      const all = [];
      for (let p = 1; p <= MAX_FETCH; p += 1) {
        const rows = await placeApi.listPage({ category, keyword: searchWord, page: p, size: FETCH_SIZE, minRating, sort });
        if (id !== reqId.current) return;
        all.push(...rows);
        if (rows.length < FETCH_SIZE) break;   // 100곳보다 적게 오면 마지막 쪽
      }
      setAllPlaces(all);
      setPage(1);
    } catch (err) {
      if (id === reqId.current) setError(err.message || '불러오지 못했어요.');
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [category, searchWord, minRating, sort]);

  useEffect(() => { loadAll(); }, [loadAll, tick]);
  const reload = () => setTick((t) => t + 1);

  // ── 페이지 계산 ──
  // 예) 100곳 → Math.ceil(100 / 15) = 7페이지
  const pageCount = Math.ceil(allPlaces.length / PAGE_SIZE);
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
  // 2페이지면 15번째~29번째만 잘라냄 (slice는 끝 번호 앞까지)
  const visiblePlaces = allPlaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const goPage = (num) => {
    setPage(num);
    window.scrollTo({ top: 0, behavior: 'smooth' });   // 페이지를 바꾸면 맨 위로
  };

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
      ) : loading ? (
        <p className="list-count">불러오는 중…</p>
      ) : (
        <>
          <p className="list-count">{allPlaces.length}곳</p>
          {visiblePlaces.length === 0 ? (
            <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
          ) : (
            <div className="pl-grid">
              {visiblePlaces.map((place) => <PlaceCard key={place.l_id} place={place} reviewSummary={summaryOfPlace(place)} />)}
            </div>
          )}

          {/* 페이지 번호: 2페이지 이상일 때만 보임 */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, margin: '32px 0' }}>
              <button type="button" className="btn btn--small" disabled={page === 1} onClick={() => goPage(page - 1)}>←</button>
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`btn btn--small${num === page ? ' btn--primary' : ''}`}  // 지금 페이지는 색칠
                  onClick={() => goPage(num)}
                >
                  {num}
                </button>
              ))}
              <button type="button" className="btn btn--small" disabled={page === pageCount} onClick={() => goPage(page + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
