// [공통] 사진 고르기: 임시 그림 중에서 고르거나, 내 사진을 올릴 수 있습니다.
// value = 사진 주소(임시 그림의 주소 또는 올린 사진의 /uploads/... 주소), onChange(주소) — 빼기를 누르면 ''.
import { useRef, useState } from 'react';
import { photos } from '../../data/photos.js';
import { uploadPhoto } from '../../api/uploadApi.js';
import { useAuth } from '../../context/AuthContext.jsx';

export default function PhotoPicker({ value, onChange, size = 64 }) {
  const { isLoggedIn } = useAuth();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';              // 같은 파일을 다시 골라도 동작하도록
    if (!file) return;
    setBusy(true); setError('');
    try { onChange(await uploadPhoto(file)); } catch (err) { setError(err.message); } finally { setBusy(false); }
  };

  return (
    <div className="photo-field">
      {value && (
        <div className="photo-picker__current">
          <img src={value} alt="선택한 사진" />
          <button type="button" className="btn btn--text" onClick={() => onChange('')}>사진 빼기</button>
        </div>
      )}
      <div className="photo-picker" role="radiogroup" aria-label="사진 선택">
        <button type="button" className="photo-picker__upload" style={{ width: size, height: size }} disabled={busy || !isLoggedIn} title={isLoggedIn ? '내 사진 올리기' : '로그인하면 사진을 올릴 수 있어요'} onClick={() => fileRef.current?.click()}>
          {busy ? '올리는 중…' : '＋ 내 사진'}
        </button>
        {Object.entries(photos).map(([key, src]) => (
          <button key={key} type="button" role="radio" aria-checked={value === src} className={`photo-picker__item${value === src ? ' on' : ''}`} style={{ width: size, height: size }} onClick={() => onChange(src)}>
            <img src={src} alt="" />
          </button>
        ))}
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pick} />
      {error && <p className="form-error" role="alert" style={{ marginTop: 8 }}>{error}</p>}
    </div>
  );
}
