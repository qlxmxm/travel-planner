// [여행계획] 새 여행 만들기 폼. 기간(몇 박 며칠)은 날짜를 고르면 자동 계산됩니다.
// 해시태그도 이 폼에서 정합니다.
// 저장: POST /api/plans/ (+ 해시태그 연결). 공개 여부·대표 사진은 서버에 저장 컬럼이 없어 뺐습니다(사진은 여행지 이름으로 자동 선택). 친구는 만든 뒤 멤버 탭의 초대 코드로 초대하세요.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { planApi, durationText } from '../../api/planApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';

export default function TripCreatePage() {
  const navigate = useNavigate();
  const { user, isLoggedIn } = useAuth();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', destination: '', start_date: '', end_date: '' });
  const [tags, setTags] = useState([]);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const duration = durationText(form.start_date, form.end_date);

  const submit = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) return setError('로그인한 뒤에 여행을 만들 수 있어요.');
    if (!form.title.trim() || !form.destination.trim()) return setError('여행 제목과 여행지를 입력해 주세요.');
    if (!form.start_date || !form.end_date) return setError('출발일과 도착일을 선택해 주세요.');
    if (!duration) return setError('도착일은 출발일 이후여야 해요.');
    setSaving(true); setError('');
    try {
      const trip = await planApi.create({ user_id: user.user_id, title: form.title.trim(), destination: form.destination.trim(), start_date: form.start_date, end_date: form.end_date, tags });
      navigate(`/trips/${trip.trip_id}`);
    } catch (err) { setError(err.message); setSaving(false); }
  };

  return (
    <div className="form-page">
      <PageHeader title="새 여행 만들기" description="여행의 기본 정보를 입력해 주세요. 일정은 만든 뒤에 추가할 수 있어요." />
      <form className="card form-page__card" onSubmit={submit}>
        <div className="form-grid">
          <label className="field field--full"><span>여행 제목</span><input value={form.title} onChange={set('title')} placeholder="예) 친구들과 도쿄 여행" /></label>
          <label className="field field--full"><span>여행지</span><input value={form.destination} onChange={set('destination')} placeholder="예) 도쿄" /></label>
          <label className="field"><span>출발일</span><input type="date" value={form.start_date} onChange={set('start_date')} /></label>
          <label className="field"><span>도착일</span><input type="date" value={form.end_date} min={form.start_date} onChange={set('end_date')} /></label>
          {duration && <p className="field field--full" style={{ color: 'var(--accent-ink)', fontWeight: 700 }}>{form.destination || '여행'}, {duration}</p>}
          <div className="field field--full"><span>해시태그 (여행 종류)</span><TagPicker value={tags} onChange={setTags} /></div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Link to="/trips" className="btn">취소</Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>{saving ? '만드는 중…' : '여행 만들기'}</button>
        </div>
      </form>
    </div>
  );
}
