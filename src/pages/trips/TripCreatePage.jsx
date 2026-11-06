// [여행계획] 새 여행 만들기 폼. 기간(몇 박 며칠)은 날짜를 고르면 자동 계산됩니다.
// 공개 여부(Y/N)와 해시태그도 이 폼에서 정합니다. 기본값은 비공개(N)입니다.
// TODO: POST /trips 연결 후 생성된 여행 상세로 이동, 친구 초대(초대 코드)는 아서 파트와 연결
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';
import { photos } from '../../data/photos.js';

const DAY = 24 * 60 * 60 * 1000;
function durationText(start, end) {
  if (!start || !end) return '';
  const nights = Math.round((new Date(end) - new Date(start)) / DAY);
  if (nights < 0) return '';
  return nights === 0 ? '당일치기' : `${nights}박 ${nights + 1}일`;
}

export default function TripCreatePage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ title: '', destination: '', start_date: '', end_date: '', photo: photos.tokyo, invite: '', is_public: 'N' });
  const [tags, setTags] = useState([]);
  const [friends, setFriends] = useState([]);
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const duration = durationText(form.start_date, form.end_date);

  const addFriend = () => {
    const name = form.invite.trim();
    if (name && !friends.includes(name)) setFriends((l) => [...l, name]);
    setForm((f) => ({ ...f, invite: '' }));
  };
  const submit = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.destination.trim()) return setError('여행 제목과 여행지를 입력해 주세요.');
    if (!form.start_date || !form.end_date) return setError('출발일과 도착일을 선택해 주세요.');
    if (!duration) return setError('도착일은 출발일 이후여야 해요.');
    navigate('/trips'); // TODO: API 호출 성공 후 이동
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
          <div className="field field--full"><span>공개 여부</span>
            <div className="chip-row" style={{ marginBottom: 0 }}>
              <button type="button" className={`chip${form.is_public === 'N' ? ' active' : ''}`} aria-pressed={form.is_public === 'N'} onClick={() => setForm((f) => ({ ...f, is_public: 'N' }))}>비공개 (멤버만)</button>
              <button type="button" className={`chip${form.is_public === 'Y' ? ' active' : ''}`} aria-pressed={form.is_public === 'Y'} onClick={() => setForm((f) => ({ ...f, is_public: 'Y' }))}>공개 (다른 사람도 볼 수 있어요)</button>
            </div>
            <small>공개해도 일정 수정과 예산은 멤버만 볼 수 있어요.</small>
          </div>
          <div className="field field--full"><span>해시태그 (여행 종류)</span><TagPicker value={tags} onChange={setTags} /></div>
          <div className="field field--full"><span>대표 사진</span><PhotoPicker value={form.photo} onChange={(src) => setForm((f) => ({ ...f, photo: src }))} /></div>
          <div className="field field--full"><span>함께 갈 친구</span>
            <div className="chat__edit" style={{ marginTop: 0 }}>
              <input value={form.invite} onChange={set('invite')} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFriend(); } }} placeholder="친구 이름(아이디)을 입력하고 Enter" />
              <button type="button" className="btn" onClick={addFriend}>추가</button>
            </div>
            {friends.length > 0 && (
              <div className="chip-row" style={{ marginTop: 10, marginBottom: 0 }}>
                {friends.map((f) => <button key={f} type="button" className="chip active" onClick={() => setFriends((l) => l.filter((x) => x !== f))} title="눌러서 삭제">{f} ✕</button>)}
              </div>
            )}
            <small>나중에 초대 코드로도 초대할 수 있어요.</small>
          </div>
        </div>
        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Link to="/trips" className="btn">취소</Link>
          <button type="submit" className="btn btn--primary">여행 만들기</button>
        </div>
      </form>
    </div>
  );
}
