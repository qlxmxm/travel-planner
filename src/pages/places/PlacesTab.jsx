// [여행계획] 장소 탭: 이 여행의 "일정에 넣은 장소"만 카테고리별로 보여줍니다. 카드를 누르면 장소 상세(리뷰)로 이동해요.
//  - 일정의 장소 이름과 이름이 똑같은 장소(location 테이블)는 맛집/관광명소/숙소로 나뉘어 나옵니다. 일정이 비어 있으면 "아직 장소가 없어요" 화면이 나와요.
//  - 장소 테이블에 없는 이름(사용자가 직접 쓴 장소)은 "기타"에 모아서 보여줘요. (DB 에는 아무것도 만들지 않고 화면에서만 묶습니다)
//  - 일정은 서버(plan_details)에서 불러오고, 장소는 GET /api/locations?q=이름 으로 찾아서 이름이 정확히 같은 것만 씁니다.
import { useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import PlaceCard from './PlaceCard.jsx';
import { placeApi } from '../../api/placeApi.js';
import { scheduleApi } from '../../api/scheduleApi.js';
import useAsync from '../../hooks/useAsync.js';
import { PLACE_CATEGORY, placeTabs, summaryOfPlace } from './placeUtils.js';

const OTHER = '기타';
const tabs = [...placeTabs, OTHER];

export default function PlacesTab() {
  const { trip } = useOutletContext();
  const [category, setCategory] = useState(PLACE_CATEGORY.ALL);
  // 일정에 있는 장소 이름 → 같은 이름의 장소를 DB 에서 찾고, 못 찾은 이름은 "기타"로 (여행이 바뀔 때만 다시 불러옴)
  const { data, loading, error, reload } = useAsync(async () => {
    const schedules = await scheduleApi.list(trip);
    const byName = new Map();
    schedules.forEach((x) => { const name = (x.place || '').trim(); if (name && !byName.has(name)) byName.set(name, x); });
    const checked = await Promise.all([...byName].map(async ([name, sch]) => ({ name, sch, place: (await placeApi.listPage({ keyword: name, size: 100 })).find((p) => p.l_name === name) })));
    return {
      places: checked.filter((c) => c.place).map((c) => c.place),
      others: checked.filter((c) => !c.place).map((c) => ({ name: c.name, label: c.sch.label, photo: c.sch.photo })),
    };
  }, [trip.trip_id]);
  const places = (data?.places ?? []).filter((p) => category === PLACE_CATEGORY.ALL || p.l_category === category);
  const others = category === PLACE_CATEGORY.ALL || category === OTHER ? (data?.others ?? []) : [];
  const total = (data?.places.length ?? 0) + (data?.others.length ?? 0);

  return (
    <>
      <div className="chip-row">
        {tabs.map((c) => (
          <button key={c} type="button" className={`chip${c === category ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {loading ? <p className="list-count" role="status">불러오는 중…</p>
        : error ? <EmptyState icon="⚠️" title="장소를 불러오지 못했어요" description={error}><button type="button" className="btn btn--primary" onClick={reload}>다시 시도</button></EmptyState>
        : (category === OTHER ? [] : places).length + others.length === 0 ? (
          <EmptyState icon="📍"
            title={total === 0 ? '일정에 넣은 장소가 아직 없어요' : `일정에 ${category} 장소가 없어요`}
            description={total === 0 ? '일정 탭에서 장소를 추가하면 여기에 모아서 보여드려요.' : '다른 카테고리를 선택해 보세요.'} />
        ) : (
          <div className="pl-grid">
            {(category === OTHER ? [] : places).map((p) => <PlaceCard key={p.l_id} place={p} reviewSummary={summaryOfPlace(p)} />)}
            {others.map((o) => (
              <div key={o.name} className="card pl-card">
                <img src={o.photo} alt="" />
                <div className="pl-card__body">
                  <div className="pl-card__cat">{OTHER} · {o.label || '직접 입력한 장소'}</div>
                  <div className="pl-card__name">{o.name}</div>
                  <div className="pl-card__rating"><span>장소 정보가 없어 리뷰는 쓸 수 없어요</span></div>
                </div>
              </div>
            ))}
          </div>
        )}
    </>
  );
}
