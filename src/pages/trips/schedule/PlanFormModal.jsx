// [여행계획] 일정 추가/수정 팝업 폼. plan 이 있으면 "수정", 없으면 "추가".
// 저장은 ScheduleTab 이 API 로 합니다. 사진은 임시 그림 중에서 고르거나 내 사진을 올릴 수 있고, 안 고르면 장소 이름으로 자동 선택돼요.
import { useEffect, useState } from 'react';
import Modal from '../../../components/common/Modal.jsx';
import PhotoPicker from '../../../components/common/PhotoPicker.jsx';
import { photoKey, photoSrc } from '../../../api/planApi.js';
import { placeApi } from '../../../api/placeApi.js';

export default function PlanFormModal({ open, plan, days, defaultDay, onSave, onClose }) {
  const isEdit = !!plan;
  const [form, setForm] = useState(() => ({
    day: plan?.day ?? defaultDay, time: plan?.time ?? '09:00', label: plan?.label ?? '', place: plan?.place ?? '', title: plan?.title ?? '',
    photo: photoSrc(plan?.photo_key),   // 고른 사진이 없으면 '' (장소 이름으로 자동 선택)
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const nextDay = Math.max(...days, 0) + 1;

  // 장소 이름 후보: 2글자 이상 입력하면 장소 테이블에서 찾아서 아래에 보여주고, 누르면 이름을 채웁니다. (후보에 없으면 그냥 직접 쓰면 됩니다)
  const [suggest, setSuggest] = useState([]);
  const [picked, setPicked] = useState(isEdit ? form.place : '');   // 후보에서 방금 고른 이름이면 다시 검색하지 않음
  useEffect(() => {
    const word = form.place.trim();
    if (word.length < 2 || word === picked) { setSuggest([]); return undefined; }
    let cancelled = false;
    const timer = setTimeout(() => {
      placeApi.listPage({ keyword: word, size: 6 }).then((rows) => { if (!cancelled) setSuggest(rows); }).catch(() => { if (!cancelled) setSuggest([]); });
    }, 250);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [form.place, picked]);
  // 후보에서 고르면 그 장소의 사진이 "자동 사진"으로 들어갑니다. (autoPhoto = 자동으로 넣은 사진, 사용자가 직접 고른 사진과 구분)
  //  - 직접 올리거나 고른 사진은 항상 우선: 후보를 바꾸거나 이름을 고쳐도 그대로 둡니다.
  //  - 자동 사진은 후보를 바꾸면 새 후보의 사진으로 바뀌고(없으면 비움), 후보와 다른 이름으로 고치면 지웁니다.
  const [autoPhoto, setAutoPhoto] = useState('');
  const isAuto = !!autoPhoto && form.photo === autoPhoto;
  const choose = (p) => {
    const next = String(p.l_image || '').startsWith('/') ? p.l_image : '';
    const replace = !form.photo || isAuto;      // 직접 고른 사진이 없을 때만 자동 사진을 넣음
    setPicked(p.l_name); setSuggest([]);
    setForm((f) => ({ ...f, place: p.l_name, photo: replace ? next : f.photo }));
    setAutoPhoto(replace ? next : '');
  };
  const onPlaceChange = (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, place: value, photo: isAuto && value.trim() !== picked ? '' : f.photo }));
    if (isAuto && value.trim() !== picked) setAutoPhoto('');
  };

  const submit = (e) => {
    e.preventDefault();
    if (!form.place.trim()) return setError('장소 이름을 입력해 주세요.');
    if (!form.time) return setError('시작 시간을 입력해 주세요.');
    if (JSON.stringify({ place: form.place, label: form.label, title: form.title, photo: photoKey(form.photo) }).length > 255) return setError('장소·구분·제목을 합쳐 200자 안쪽으로 줄여 주세요.');
    onSave({ ...form, photo_key: photoKey(form.photo), day: Number(form.day), place: form.place.trim(), title: form.title.trim(), label: form.label.trim() });
  };

  return (
    <Modal open={open} title={isEdit ? '일정 수정' : '일정 추가'} onClose={onClose}>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field"><span>날짜</span>
            <select value={form.day} onChange={set('day')}>
              {days.map((d) => <option key={d} value={d}>Day {d}</option>)}
              {!isEdit && <option value={nextDay}>+ 새 Day {nextDay}</option>}
            </select>
          </label>
          <label className="field"><span>시작 시간</span><input type="time" value={form.time} onChange={set('time')} /></label>
          <label className="field field--full"><span>장소 이름</span><input value={form.place} onChange={onPlaceChange} placeholder="예) 아사쿠사 규카츠" autoFocus autoComplete="off" />
            {suggest.length > 0 && (
              <ul className="place-suggest" role="listbox" aria-label="장소 후보">
                {suggest.map((p) => (
                  <li key={p.l_id}><button type="button" role="option" onClick={() => choose(p)}>{p.l_name}<small>{p.l_category} · {p.l_city}</small></button></li>
                ))}
              </ul>
            )}
            {form.place.trim().length >= 2 && suggest.length === 0 && form.place.trim() !== picked && <small>후보가 없으면 그대로 직접 쓰면 돼요. (장소 탭의 “기타”에 모여요)</small>}
          </label>
          <label className="field field--full"><span>구분 (선택)</span><input value={form.label} onChange={set('label')} placeholder="예) 식사 장소 추천, 숙소로 이동" /></label>
          <label className="field field--full"><span>제목 (일정 아래에 보이고, 대화창 제목이 돼요)</span><input value={form.title} onChange={set('title')} placeholder="예) 입에서 살살 녹는 규카츠로 유명한 곳" /></label>
          <div className="field field--full"><span>사진 (선택)</span><PhotoPicker value={form.photo} size={48} onChange={(src) => { setAutoPhoto(''); setForm((f) => ({ ...f, photo: src })); }} /></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>취소</button>
          <button type="submit" className="btn btn--primary">{isEdit ? '저장' : '추가'}</button>
        </div>
      </form>
    </Modal>
  );
}
