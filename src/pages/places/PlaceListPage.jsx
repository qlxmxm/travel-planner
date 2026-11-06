// [장소] 장소 목록: 카테고리 탭(맛집/관광명소/숙소) + 검색 + 카드 목록. 카드를 누르면 상세(/places/:id)로 이동.
// 장소는 서비스가 제공하는 데이터라서 등록/수정/삭제 버튼이 없습니다.
// TODO: GET /places?category=&q= 연결 (검색은 이름·카테고리·도시·주소)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StarRating from '../../components/common/StarRating.jsx';
import { places, placeReviews, placeTabs, avgRating } from '../../data/samplePlaces.js';

export default function PlaceListPage() {
  const [category, setCategory] = useState('전체');
  const [q, setQ] = useState('');
  const kw = q.trim().toLowerCase();
  const list = places.filter((p) =>
    (category === '전체' || p.p_category === category) &&
    (!kw || [p.p_name, p.p_category, p.p_city, p.p_add].some((s) => s.toLowerCase().includes(kw))));

  return (
    <>
      <PageHeader title="장소" description="맛집, 관광명소, 숙소를 찾아보고 다녀온 사람들의 리뷰를 확인하세요." />
      <div className="list-toolbar">
        <div className="chip-row">
          {placeTabs.map((c) => (
            <button key={c} type="button" className={`chip${c === category ? ' active' : ''}`} onClick={() => setCategory(c)}>{c}</button>
          ))}
        </div>
        <input type="search" className="list-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="장소 이름, 카테고리, 도시, 주소로 검색" aria-label="장소 검색" />
      </div>
      <p className="list-count">{list.length}곳</p>
      {list.length === 0 ? (
        <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 카테고리를 선택해 보세요." />
      ) : (
        <div className="pl-grid">
          {list.map((p) => {
            const rs = placeReviews.filter((r) => r.p_id === p.p_id);
            const avg = avgRating(rs);
            return (
              <Link key={p.p_id} to={`/places/${p.p_id}`} className="card pl-card">
                <img src={p.photo} alt="" />
                <div className="pl-card__body">
                  <div className="pl-card__cat">{p.p_category} · {p.p_city}</div>
                  <div className="pl-card__name">{p.p_name}</div>
                  <div className="pl-card__rating">
                    <StarRating value={avg} size={15} />
                    <span>{rs.length ? `${avg.toFixed(1)} (${rs.length})` : '리뷰 없음'}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}
