// [여행계획] 일정 추가/수정 팝업 폼. plan 이 있으면 "수정", 없으면 "추가".
// TODO: 저장 API 연결 (POST/PUT /trips/{id}/schedules), 사진 업로드
import { useState } from 'react';
import Modal from '../../components/common/Modal.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import { photos } from '../../data/photos.js';

export default function PlanFormModal({ open, plan, days, defaultDay, onSave, onClose }) {
  const isEdit = !!plan;
  const [form, setForm] = useState(() => ({
    day: plan?.day ?? defaultDay, time: plan?.time ?? '09:00', label: plan?.label ?? '', place: plan?.place ?? '', title: plan?.title ?? '', photo: plan?.photo ?? photos.tokyo,
  }));
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const nextDay = Math.max(...days, 0) + 1;

  const submit = (e) => {
    e.preventDefault();
    if (!form.place.trim()) return setError('장소 이름을 입력해 주세요.');
    if (!form.time) return setError('시작 시간을 입력해 주세요.');
    onSave({ ...form, day: Number(form.day), place: form.place.trim(), title: form.title.trim(), label: form.label.trim() });
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
          <label className="field field--full"><span>장소 이름</span><input value={form.place} onChange={set('place')} placeholder="예) 아사쿠사 규카츠" autoFocus /></label>
          <label className="field field--full"><span>구분 (선택)</span><input value={form.label} onChange={set('label')} placeholder="예) 식사 장소 추천, 숙소로 이동" /></label>
          <label className="field field--full"><span>제목 (일정 아래에 보이고, 대화창 제목이 돼요)</span><input value={form.title} onChange={set('title')} placeholder="예) 입에서 살살 녹는 규카츠로 유명한 곳" /></label>
          <div className="field field--full"><span>사진</span><PhotoPicker value={form.photo} onChange={(src) => setForm((f) => ({ ...f, photo: src }))} size={56} /></div>
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
