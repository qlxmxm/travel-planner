// [여행기] 목록의 여행기 카드 1개 (내가 쓴 글이면 삭제 버튼 표시)
import { Link } from 'react-router-dom';
import Avatar from '../../../components/common/Avatar.jsx';
import Tags from '../../../components/common/Tags.jsx';

export default function JournalCard({ journal, activeTag, isOwner, onDelete }) {
  const author = journal.u_name || `사용자 ${journal.u_id}`;
  const likeCount = journal.like_count ?? 0;

  return (
    <div className="trip-card-wrap">
      <Link to={`/journals/${journal.j_id}`} className="journal-card">
        {journal.j_photo && <img src={journal.j_photo} alt={journal.j_title} />}
        <h3>{journal.j_title}</h3>
        <p>{journal.j_intro || journal.loc || ''}</p>
        <Tags tags={journal.hashtags ?? []} active={activeTag} />
        <div className="journal-card__by">
          <Avatar name={author} />
          <span>{author}</span>
          <span aria-label={`좋아요 ${likeCount}개`}>♡ {likeCount}</span>
        </div>
      </Link>

      {isOwner && (
        <button type="button" className="card-del" onClick={() => onDelete(journal)} aria-label={`${journal.j_title} 삭제`}>
          삭제
        </button>
      )}
    </div>
  );
}
