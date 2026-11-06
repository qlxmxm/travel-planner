// [여행계획] 장소 탭. TODO: 장소 추가/수정/삭제, 카테고리 필터 동작, GET /trips/{id}/places 연결
import { useState } from 'react';
import EmptyState from '../../components/common/EmptyState.jsx';
import { samplePlaces, placeCategories } from '../../data/sampleTrips.js';

export default function PlacesTab() {
  const [category, setCategory] = useState('전체');
  const places = samplePlaces.filter((p) => category === '전체' || p.category === category);
  return (
    <>
      <div className="chip-row">
        {placeCategories.map((c) => (
          <button key={c} type="button" className={`chip${c === category ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
        ))}
      </div>
      {places.length === 0 ? (
        <EmptyState icon="📍" title="저장한 장소가 없어요" />
      ) : (
        <div className="place-grid">
          {places.map((p) => (
            <article key={p.place_id} className="card place-card">
              <img src={p.photo} alt="" />
              <div className="place-card__body">
                <div className="place-card__cat">{p.category}</div>
                <div className="place-card__name">{p.name}</div>
                <div className="place-card__addr">{p.address}</div>
              </div>
            </article>
          ))}
        </div>
      )}
      <div className="placeholder-box" style={{ marginTop: 24 }}>+ 장소 추가 버튼/폼 자리</div>
    </>
  );
}
