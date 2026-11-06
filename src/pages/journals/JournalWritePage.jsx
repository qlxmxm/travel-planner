// [여행기] 여행기 쓰기/수정 (주소에 :journalId 가 있으면 수정, 작성자만 가능). Day를 추가하고, Day 안에 장소(시간·별점·글·사진)를 여러 개 추가하는 편집기.
// 해시태그(여행 종류)를 고를 수 있고, 끝난 내 여행계획을 불러오면 일정이 Day/장소로 채워집니다.
//  - /journals/new/from/:tripId 로 들어오면(여행계획의 [여행기에 추가] 버튼) 그 여행의 내용이 미리 채워져 있어요.
// TODO: POST /journals 연결 후 상세로 이동, 사진 업로드, 임시저장
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';
import { sampleTrips, isMember, isEnded } from '../../data/sampleTrips.js';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { sampleJournals } from '../../data/sampleJournals.js';
import { photos } from '../../data/photos.js';

const newItem = () => ({ key: Math.random(), time: '09:00', name: '', rating: 0, text: '', photo: '' });
const newDay = () => ({ key: Math.random(), date: '', intro: '', items: [newItem()] });

const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
// 여행계획(trip)을 편집기 모양으로 바꿈: 일차(day) 별로 묶고, 일정 제목은 내용으로 가져옴
const tripToDays = (trip) => {
  const nums = [...new Set(trip.plans.map((p) => p.day))].sort((a, b) => a - b);
  return nums.map((n) => ({ key: Math.random(), date: addDays(trip.start_date, n - 1), intro: '', items: trip.plans.filter((p) => p.day === n).sort((a, b) => a.time.localeCompare(b.time)).map((p) => ({ key: Math.random(), time: p.time, name: p.place, rating: 0, text: p.title, photo: p.photo || '' })) }));
};

// 저장된 여행기를 편집기 모양(글은 한 덩어리 문자열)으로 바꿈
const toEditorDays = (j) => j.days.map((d) => ({ key: Math.random(), date: d.date.replaceAll('.', '-'), intro: d.intro || '', items: d.items.map((it) => ({ key: Math.random(), time: it.time, name: it.name, rating: it.rating || 0, text: (it.text || []).join('\n'), photo: it.photo || '' })) }));

export default function JournalWritePage() {
  const navigate = useNavigate();
  const { journalId, tripId } = useParams();
  const { user } = useAuth();
  const editing = journalId ? sampleJournals.find((x) => String(x.journal_id) === journalId) : null;
  const myEnded = sampleTrips.filter((t) => isMember(t, user) && isEnded(t)); // 끝난 내 여행계획만 불러올 수 있어요
  const from = tripId ? myEnded.find((t) => String(t.trip_id) === tripId) : null;
  const [head, setHead] = useState({ title: editing?.title ?? (from ? `${from.destination}, ${from.duration} 여행기` : ''), summary: editing?.summary ?? '', trip_id: from ? String(from.trip_id) : '', cover: editing?.cover ?? from?.photo ?? photos.tokyo });
  const [days, setDays] = useState(() => (editing ? toEditorDays(editing) : from ? tripToDays(from) : [newDay()]));
  const [tags, setTags] = useState(editing?.hashtags ?? from?.hashtags ?? []);
  const loadTrip = (id) => {
    const t = myEnded.find((x) => String(x.trip_id) === id);
    setHead((h) => ({ ...h, trip_id: id, ...(t ? { title: h.title || `${t.destination}, ${t.duration} 여행기`, cover: t.photo } : {}) }));
    if (t) { setDays(tripToDays(t)); setTags((l) => [...new Set([...l, ...t.hashtags])]); }
  };
  const [error, setError] = useState('');

  const setDay = (i, patch) => setDays((ds) => ds.map((d, k) => (k === i ? { ...d, ...patch } : d)));
  const setItem = (i, j, patch) => setDays((ds) => ds.map((d, k) => (k === i ? { ...d, items: d.items.map((it, m) => (m === j ? { ...it, ...patch } : it)) } : d)));
  const addItem = (i) => setDays((ds) => ds.map((d, k) => (k === i ? { ...d, items: [...d.items, newItem()] } : d)));
  const removeItem = (i, j) => setDays((ds) => ds.map((d, k) => (k === i ? { ...d, items: d.items.filter((_, m) => m !== j) } : d)));

  const submit = (e) => {
    e.preventDefault();
    if (!head.title.trim()) return setError('여행기 제목을 입력해 주세요.');
    if (days.some((d) => d.items.some((it) => !it.name.trim()))) return setError('장소 이름이 비어 있는 항목이 있어요.');
    navigate(editing ? `/journals/${editing.journal_id}` : '/journals'); // TODO: API 호출 성공 후 이동
  };

  // 수정 화면: 없는 여행기이거나 작성자가 아니면 막음 (서버에서도 꼭 한 번 더 검사해야 해요)
  if (journalId && (!editing || editing.author_id !== user.user_id)) {
    return (
      <EmptyState icon="🔒" title="작성자만 수정할 수 있어요" description="내가 쓴 여행기만 수정할 수 있습니다.">
        <Link to="/journals" className="btn btn--primary">여행기 목록으로</Link>
      </EmptyState>
    );
  }

  return (
    <div className="form-page" style={{ maxWidth: 760 }}>
      <PageHeader title={editing ? '여행기 수정' : '여행기 쓰기'} description={editing ? '내용을 고친 뒤 저장해 주세요.' : '다녀온 여행을 Day별, 시간별로 기록해 보세요.'} />
      <form onSubmit={submit}>
        <div className="card form-page__card" style={{ marginBottom: 24 }}>
          <div className="form-grid">
            <label className="field field--full"><span>제목</span><input value={head.title} onChange={(e) => setHead({ ...head, title: e.target.value })} placeholder="예) 도쿄 4박 5일, 걷고 먹고 또 걷고" /></label>
            <label className="field field--full"><span>한 줄 소개</span><input value={head.summary} onChange={(e) => setHead({ ...head, summary: e.target.value })} /></label>
            {!editing && (
              <label className="field field--full"><span>여행계획에서 불러오기 (선택)</span>
                <select value={head.trip_id} onChange={(e) => loadTrip(e.target.value)}>
                  <option value="">선택 안 함</option>
                  {myEnded.map((t) => <option key={t.trip_id} value={t.trip_id}>{t.title} · {t.duration}</option>)}
                </select>
                <small>끝난 여행만 불러올 수 있어요. 일정이 Day와 장소로 채워지고, 해시태그도 함께 가져와요.</small>
              </label>
            )}
            <div className="field field--full"><span>해시태그 (여행 종류)</span><TagPicker value={tags} onChange={setTags} /></div>
            <div className="field field--full"><span>대표 사진</span><PhotoPicker value={head.cover} onChange={(src) => setHead({ ...head, cover: src })} /></div>
          </div>
        </div>

        {days.map((d, i) => (
          <section key={d.key} className="editor-day">
            <div className="editor-day__head">
              <span className="day-pill">Day {i + 1}</span>
              <input type="date" value={d.date} onChange={(e) => setDay(i, { date: e.target.value })} aria-label={`Day ${i + 1} 날짜`} style={{ height: 40, padding: '0 12px', border: '1px solid var(--line)', borderRadius: 12 }} />
              {days.length > 1 && <button type="button" className="btn btn--text" style={{ marginLeft: 'auto' }} onClick={() => setDays((ds) => ds.filter((_, k) => k !== i))}>이 Day 삭제</button>}
            </div>
            <label className="field"><span>그날의 한 줄</span><input value={d.intro} onChange={(e) => setDay(i, { intro: e.target.value })} /></label>

            {d.items.map((it, j) => (
              <div key={it.key} className="editor-item">
                <div className="editor-item__top"><span>장소 {j + 1}</span>
                  {d.items.length > 1 && <button type="button" className="btn btn--text" onClick={() => removeItem(i, j)}>삭제</button>}</div>
                <div className="form-grid">
                  <label className="field"><span>시작 시간</span><input type="time" value={it.time} onChange={(e) => setItem(i, j, { time: e.target.value })} /></label>
                  <label className="field"><span>장소 이름</span><input value={it.name} onChange={(e) => setItem(i, j, { name: e.target.value })} /></label>
                  <div className="field field--full"><span>별점</span>
                    <div className="star-input">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" className={n <= it.rating ? 'on' : ''} aria-label={`${n}점`} onClick={() => setItem(i, j, { rating: it.rating === n ? 0 : n })}>★</button>
                      ))}
                    </div></div>
                  <label className="field field--full"><span>내용</span><textarea value={it.text} onChange={(e) => setItem(i, j, { text: e.target.value })} /></label>
                  <div className="field field--full"><span>사진 (선택)</span><PhotoPicker value={it.photo} onChange={(src) => setItem(i, j, { photo: it.photo === src ? '' : src })} size={48} /></div>
                </div>
              </div>
            ))}
            <button type="button" className="btn btn--small" onClick={() => addItem(i)}>+ 장소 추가</button>
          </section>
        ))}
        <button type="button" className="btn" style={{ width: '100%', marginBottom: 20 }} onClick={() => setDays((ds) => [...ds, newDay()])}>+ Day 추가</button>

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Link to={editing ? `/journals/${editing.journal_id}` : '/journals'} className="btn">취소</Link>
          <button type="submit" className="btn btn--primary">{editing ? '저장' : '등록하기'}</button>
        </div>
      </form>
    </div>
  );
}
