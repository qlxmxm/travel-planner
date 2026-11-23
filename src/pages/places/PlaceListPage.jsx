// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색 + 카드 목록 + 페이지 번호. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// 완료: GET /locations?category=&q=&size= 연결 (getLocations)
// 장소가 48개(seed.py)라서 서버에서 한 번에 최대 100개를 받고, 화면에서 15개씩 나눠 보여 줍니다.
import { useState, useEffect } from 'react';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { placeTabs, PLACE_CATEGORY } from '../../data/samplePlaces.js';
import PlaceCard from './PlaceCard.jsx';
import { getLocations } from '../../api/locationAPI.js';

const PAGE_SIZE = 15;   // 한 페이지에 보여 줄 카드 수 (가로 3칸 × 세로 5줄)
const FETCH_SIZE = 100; // 서버에서 한 번에 받을 최대 개수 (백엔드 최대값)

export default function PlaceListPage() {
  const [category, setCategory] = useState(PLACE_CATEGORY.ALL);
  const [keyword, setKeyword] = useState('');

  // 서버에서 받은 "조건에 맞는 장소 전부"를 담을 상자 (처음엔 0개)
  const [allPlaces, setAllPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1); // 지금 보고 있는 페이지 번호

  // 탭(category)이나 검색어(keyword)가 바뀔 때만 서버에 다시 요청
  // (페이지 번호를 누를 때는 이미 받은 목록에서 잘라 보여 주기만 하니까 요청 안 함)
  useEffect(() => {
    // "전체" 탭이면 category를 안 보냄 → 서버가 전체 목록을 줌
    const categoryToSend = category === PLACE_CATEGORY.ALL ? undefined : category;

    setLoading(true);
    // getLocations(category, q, city, page, size) → city는 안 써서 undefined, 1페이지에 100개
    getLocations(categoryToSend, keyword.trim(), undefined, 1, FETCH_SIZE)
      .then((data) => { setAllPlaces(data); setPage(1); setLoading(false); })
      .catch(() => { setAllPlaces([]); setLoading(false); });
  }, [category, keyword]);

  // ── 페이지 계산 ──
  // 예) 48개 → Math.ceil(48 / 15) = 4페이지
  const pageCount = Math.ceil(allPlaces.length / PAGE_SIZE);
  // [1, 2, 3] 같은 번호 배열 만들기
  const pageNumbers = Array.from({ length: pageCount }, (_, i) => i + 1);
  // 2페이지면 15번째~29번째만 잘라냄 (slice는 끝 번호 앞까지)
  const visiblePlaces = allPlaces.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

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

      {loading ? (
        <p>불러오는 중...</p>
      ) : (
        <>
          <p className="list-count">{allPlaces.length}곳</p>
          {visiblePlaces.length === 0 ? (
            <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
          ) : (
            <div className="pl-grid">
              {visiblePlaces.map((place) => (
                <PlaceCard
                  key={place.l_id}
                  place={place}
                  // 평균 별점과 리뷰 수는 서버가 계산해서 줌
                  reviewSummary={{ average: place.avg_rating, count: place.review_count }}
                />
              ))}
            </div>
          )}

          {/* 페이지 번호: 2페이지 이상일 때만 보임 */}
          {pageCount > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, margin: '32px 0' }}>
              <button type="button" className="btn btn--small" disabled={page === 1} onClick={() => setPage(page - 1)}>←</button>
              {pageNumbers.map((num) => (
                <button
                  key={num}
                  type="button"
                  className={`btn btn--small${num === page ? ' btn--primary' : ''}`}  // 지금 페이지는 색칠
                  onClick={() => setPage(num)}
                >
                  {num}
                </button>
              ))}
              <button type="button" className="btn btn--small" disabled={page === pageCount} onClick={() => setPage(page + 1)}>→</button>
            </div>
          )}
        </>
      )}
    </>
  );
}
