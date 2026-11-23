// [여행기 상세] 한 줄 소개 + 대표 사진 (수정 중에는 입력칸과 사진 고르기).
import PhotoPicker from '../../../components/common/PhotoPicker.jsx';

export default function JournalIntro({ editing, journal, draft, onDraftChange }) {
  if (editing) {
    return (
      <>
        <input
          className="jd-edit__intro"
          value={draft.j_intro}
          maxLength={100}
          placeholder="한 줄 소개"
          onChange={(e) => onDraftChange({ ...draft, j_intro: e.target.value })}
        />
        <div className="jd-edit__photo">
          <span>대표 사진</span>
          <PhotoPicker
            value={draft.j_photo}
            size={48}
            onChange={(src) => onDraftChange({ ...draft, j_photo: draft.j_photo === src ? '' : src })}
          />
        </div>
      </>
    );
  }
  return (
    <>
      {journal.j_intro && <p className="jd__intro">{journal.j_intro}</p>}
      {journal.j_photo && <img src={journal.j_photo} alt={journal.j_title} className="jd__cover" />}
    </>
  );
}
