// [여행계획] 여행 카드. trip = { trip_id, title, duration, start_date, end_date, members, photo, is_public, hashtags, owner_name }
// onDelete 를 넘기면 카드 오른쪽 위에 삭제 버튼이 보임 (방장만 넘겨주세요)
// showOwner 가 true 면 만든 사람 이름을 보여줌 (다른 사람의 여행계획일 때)
import { Link } from 'react-router-dom';
import Tags from './Tags.jsx';

export default function TripCard({ trip, onDelete, showOwner }) {
  return (
    <div className="trip-card-wrap">
      <Link to={`/trips/${trip.trip_id}`} className="card trip-card">
        <div className="trip-card__photo">
          <img src={trip.photo} alt="" />
          <span className={`badge ${trip.is_public === 'Y' ? 'badge--on' : ''}`}>{trip.is_public === 'Y' ? '공개' : '비공개'}</span>
        </div>
        <div className="trip-card__body">
          <div className="trip-card__title">{trip.title} · {trip.duration}</div>
          <div className="trip-card__meta">{trip.start_date} ~ {trip.end_date} · {trip.members}명{showOwner && ` · ${trip.owner_name}`}</div>
          <Tags tags={trip.hashtags} />
        </div>
      </Link>
      {onDelete && <button type="button" className="card-del" onClick={() => onDelete(trip)} aria-label={`${trip.title} 삭제`}>삭제</button>}
    </div>
  );
}
