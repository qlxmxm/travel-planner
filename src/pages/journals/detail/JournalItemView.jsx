// [여행기 상세] 일정 기록 한 개 (보기): 시간 · 장소 이름 · 별점 · 내용 · 사진.
export default function JournalItemView({ item }) {
  return (
    <div className="jd-item">
      <div className="jd-item__top">
        {item.ji_time && <span className="jd-item__time">{item.ji_time}</span>}
        <strong>{item.ji_title}</strong>
      </div>
      {item.ji_rating > 0 && (
        <div className="jd-item__stars" aria-label={`${item.ji_rating}점`}>
          {'★'.repeat(item.ji_rating)}{'☆'.repeat(5 - item.ji_rating)}
        </div>
      )}
      {item.ji_content && <p className="jd-item__text">{item.ji_content}</p>}
      {item.ji_photo && (
        <img src={item.ji_photo} alt={`${item.ji_title} 여행 사진`} className="jd-item__photo" />
      )}
    </div>
  );
}
