// [공통] 사진 고르기 (지금은 임시 사진 목록에서 선택. 나중에 파일 업로드로 교체: TODO)
import { photos } from '../../data/photos.js';

export default function PhotoPicker({ value, onChange, size = 64 }) {
  return (
    <div className="photo-picker" role="radiogroup" aria-label="사진 선택">
      {Object.entries(photos).map(([key, src]) => (
        <button key={key} type="button" role="radio" aria-checked={value === src} className={`photo-picker__item${value === src ? ' on' : ''}`} style={{ width: size, height: size }} onClick={() => onChange(src)}>
          <img src={src} alt="" />
        </button>
      ))}
    </div>
  );
}
