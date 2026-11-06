// [장소] 장소 상세: 정보 + 평균 별점 + 리뷰(작성/수정/삭제). 리뷰는 "내 리뷰(홍길동)"에만 수정·삭제 버튼이 보입니다.
// 한 사람이 한 장소에 리뷰를 한 번만 쓸 수 있습니다 (DB: p_id + u_id UNIQUE → 서버에서는 409).
// 리뷰는 화면 안에서만 동작합니다. TODO: GET /places/{p_id}, 리뷰 API 연결, 권한 체크(본인 리뷰만)
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { places, placeReviews, avgRating } from '../../data/samplePlaces.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import StarRating from '../../components/common/StarRating.jsx';

export default function PlaceDetailPage() {
  const { placeId } = useParams();
  const { user } = useAuth();
  const p = places.find((x) => String(x.p_id) === placeId);
  const [reviews, setReviews] = useState(() => placeReviews.filter((r) => String(r.p_id) === placeId));
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ rating: 0, text: '' });

  if (!p) {
    return <EmptyState icon="📍" title="장소를 찾을 수 없어요"><Link to="/places" className="btn">장소 목록으로</Link></EmptyState>;
  }

  const avg = avgRating(reviews);
  const mine = reviews.find((r) => r.u_id === user.user_id);
  const hours = p.p_start === '00:00' && p.p_end === '24:00' ? '24시간' : p.p_category === '숙소' ? `체크인 ${p.p_start} · 체크아웃 ${p.p_end}` : `${p.p_start} ~ ${p.p_end}`;

  const add = (e) => {
    e.preventDefault();
    if (!rating || !text.trim()) return;
    setReviews((rs) => [{ pr_id: Date.now(), p_id: p.p_id, u_id: user.user_id, u_name: user.user_name, pr_rating: rating, pr_content: text.trim(), pr_created: '방금' }, ...rs]);
    setRating(0); setText('');
  };
  const save = () => {
    if (!draft.rating || !draft.text.trim()) return;
    setReviews((rs) => rs.map((r) => (r.pr_id === editId ? { ...r, pr_rating: draft.rating, pr_content: draft.text.trim() } : r)));
    setEditId(null);
  };

  return (
    <article className="pd">
      <Link to="/places" className="pd__back">← 장소 목록</Link>
      <div className="pd__top">
        <img src={p.photo} alt="" />
        <div className="pd__info">
          <div className="pd__cat">{p.p_category} · {p.p_city}</div>
          <h1>{p.p_name}</h1>
          <div className="pd__avg">
            <StarRating value={avg} size={22} />
            <b>{reviews.length ? avg.toFixed(1) : '-'}</b>
            <span>리뷰 {reviews.length}개</span>
          </div>
          <dl>
            <dt>주소</dt><dd>{p.p_add}</dd>
            <dt>전화</dt><dd>{p.p_telno}</dd>
            <dt>{p.p_category === '숙소' ? '체크인·아웃' : '영업시간'}</dt><dd>{hours}</dd>
          </dl>
        </div>
      </div>
      <p className="pd__intro">{p.p_intro}</p>
      <div className="placeholder-box pd__map">지도 자리 (추후 구글지도 API 연동)</div>

      <section className="pd-reviews">
        <h2>리뷰 {reviews.length}</h2>
        {mine ? (
          <p className="pd-reviews__note">이미 이 장소에 리뷰를 남겼어요. 아래 내 리뷰에서 수정할 수 있어요.</p>
        ) : (
          <form className="pd-reviews__form" onSubmit={add}>
            <div className="pd-reviews__rate"><span>별점</span><StarRating value={rating} onChange={setRating} size={26} /></div>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="다녀온 경험을 남겨보세요" aria-label="리뷰 내용" />
            <button type="submit" className="btn btn--primary" disabled={!rating || !text.trim()}>리뷰 등록</button>
          </form>
        )}
        {reviews.length === 0 ? (
          <EmptyState icon="💬" title="아직 리뷰가 없어요" description="첫 리뷰를 남겨보세요." />
        ) : (
          <ul className="pd-reviews__list">
            {reviews.map((r) => (
              <li key={r.pr_id}>
                <Avatar name={r.u_name} />
                <div className="pd-reviews__body">
                  <div><b>{r.u_name}</b><span>{r.pr_created}</span></div>
                  {editId === r.pr_id ? (
                    <div className="pd-reviews__edit">
                      <StarRating value={draft.rating} onChange={(v) => setDraft((d) => ({ ...d, rating: v }))} size={22} />
                      <textarea value={draft.text} onChange={(e) => setDraft((d) => ({ ...d, text: e.target.value }))} aria-label="리뷰 수정" />
                      <div>
                        <button type="button" className="btn btn--primary btn--small" onClick={save}>저장</button>
                        <button type="button" className="btn btn--small" onClick={() => setEditId(null)}>취소</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <StarRating value={r.pr_rating} size={15} />
                      <p>{r.pr_content}</p>
                    </>
                  )}
                  {r.u_id === user.user_id && editId !== r.pr_id && (
                    <div>
                      <button type="button" className="btn btn--text" onClick={() => { setEditId(r.pr_id); setDraft({ rating: r.pr_rating, text: r.pr_content }); }}>수정</button>
                      <button type="button" className="btn btn--text" onClick={() => setReviews((rs) => rs.filter((x) => x.pr_id !== r.pr_id))}>삭제</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </article>
  );
}
