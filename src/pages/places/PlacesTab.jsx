// [여행계획] 장소 탭: 이 여행의 여행지 주변 장소를 카테고리별로 둘러봅니다. 카드를 누르면 장소 상세(리뷰)로 이동해요.
// 서버: GET /api/locations?category=&q=여행지  (결과가 없으면 전체 장소를 보여줘요)
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import PlaceCard from './PlaceCard.jsx';
import { placeApi } from '../../api/placeApi.js';
import useAsync from '../../hooks/useAsync.js';
import { PLACE_CATEGORY, placeTabs, summaryOfPlace } from './placeUtils.js';

export default function PlacesTab() {
  const { trip } = useOutletContext();
  const [category, setCategory] = useState(PLACE_CATEGORY.ALL);
  const { data, loading, error, reload } = useAsync(async () => {
    const near = await placeApi.list({ category, keyword: trip.destination });
    return near.length ? { list: near, near: true } : { list: await placeApi.list({ category, keyword: '' }), near: false };
  }, [category, trip.destination]);
  const places = data?.list ?? [];

  return (
    <>
      <div className="chip-row">
        {placeTabs.map((c) => (
          <button key={c} type="button" className={`chip${c === category ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {loading ? <p className="list-count" role="status">불러오는 중…</p>
        : error ? <EmptyState icon="⚠️" title="장소를 불러오지 못했어요" description={error}><button type="button" className="btn btn--primary" onClick={reload}>다시 시도</button></EmptyState>
        : places.length === 0 ? <EmptyState icon="📍" title="보여줄 장소가 없어요" />
        : (
          <>
            {!data.near && <p className="list-count">“{trip.destination}” 주변 장소가 없어서 전체 장소를 보여드려요.</p>}
            <div className="pl-grid">
              {places.map((p) => <PlaceCard key={p.l_id} place={p} reviewSummary={summaryOfPlace(p)} />)}
            </div>
          </>
        )}
    </>
  );
}
