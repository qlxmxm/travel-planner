// [여행기 상세] 일정 기록 한 개 (수정): 별점 · 내용 · 사진을 고칩니다. onChange 에는 바뀐 부분만 넘겨요.
import PhotoPicker from '../../../components/common/PhotoPicker.jsx';

export default function JournalItemEdit({ item, onChange }) {
  return (
    <div className="jd-item">
      <div className="jd-item__top">
        {item.ji_time && <span className="jd-item__time">{item.ji_time}</span>}
        <strong>{item.ji_title}</strong>
      </div>
      <div className="jd-edit__stars" role="group" aria-label="별점">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={item.ji_rating >= n ? 'on' : ''}
            aria-label={`${n}점`}
            onClick={() => onChange({ ji_rating: item.ji_rating === n ? null : n })}
          >★</button>
        ))}
      </div>
      <textarea
        className="jd-edit__text"
        value={item.ji_content || ''}
        placeholder="여행 기록을 남겨 보세요."
        onChange={(e) => onChange({ ji_content: e.target.value })}
      />
      <PhotoPicker
        value={item.ji_photo || ''}
        size={48}
        onChange={(src) => onChange({ ji_photo: item.ji_photo === src ? '' : src })}
      />
    </div>
  );
}
