
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

export default function JournalWritePage() {
  const { tripId, journalId } = useParams();
  const editing = Boolean(journalId);
  const [journal, setJournal] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadJournal = async () => {
      setLoading(true);
      setError('');
      setJournal(null);
      setDays([]);

      try {
        if (editing) {
          // TODO [Axios GET] journalId로 기존 Journal 및 JournalItem 조회
          // FastAPI에서 작성자 권한 검증
        } else {
          // TODO [Axios GET] tripId로 완료된 여행계획의 여행기 미리보기 조회
          // FastAPI에서 접근 권한 및 p_status 검증
          // 응답: { journal, days }
        }

        // TODO: Axios 연결 후 백엔드 응답으로 화면 자동 채우기
        // const response = await axios.get(...);
        // if (!cancelled) {
        //   setJournal(response.data.journal);
        //   setDays(response.data.days);
        // }
      } catch {
        if (!cancelled) setError('여행기 정보를 불러오지 못했습니다.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJournal();
    return () => { cancelled = true; };
  }, [tripId, journalId, editing]);

  const setItem = (dayIndex, itemIndex, patch) => {
    setDays((prev) => prev.map((day, i) => i === dayIndex
      ? { ...day, items: day.items.map((item, j) => j === itemIndex ? { ...item, ...patch } : item) }
      : day));
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!journal) return setError('여행기 정보를 불러오지 못했습니다.');

    const items = days.flatMap((day) => day.items.map((item) => ({
      ji_day: item.ji_day, ji_order: item.ji_order,
      ji_content: item.ji_content || '', ji_rating: item.ji_rating ?? 0,
      ji_photo: item.ji_photo || '',
    })));

    const payload = {
      p_id: journal.p_id, j_title: journal.j_title,
      j_intro: journal.j_intro, j_photo: journal.j_photo, items,
    };

    try {
      if (editing) {
        // TODO [Axios PATCH] journalId로 여행기 수정
        // FastAPI에서 작성자 검증 후 Journal 및 JournalItem 수정
      } else {
        // TODO [Axios POST] tripId로 여행계획을 Journal 및 JournalItem에 복사
        // FastAPI가 원본 날짜, 시간, 장소, 일정 제목을 복사
        // payload의 여행기 내용, 별점, 사진 반영
      }
      // TODO: API 성공 후 여행기 상세 페이지로 이동
      void payload;
    } catch {
      setError('여행기를 저장하지 못했습니다.');
    }
  };

  if (loading) return <p>여행기 정보를 불러오는 중입니다.</p>;

  if (!journal) {
    return (
      <EmptyState icon="🔒" title="여행기 정보를 불러올 수 없습니다." description={error || '여행계획 또는 여행기를 확인해 주세요.'}>
        <Link to="/journals" className="btn btn--primary">여행기 목록으로</Link>
      </EmptyState>
    );
  }

  return (
    <div className="form-page" style={{ maxWidth: 760 }}>
      <PageHeader title={editing ? '여행기 수정' : '여행기 작성'} description="여행계획에서 가져온 일정에 기록을 남겨 보세요." />

      <form onSubmit={submit}>
        <div className="card form-page__card" style={{ marginBottom: 24 }}>
          <div className="form-grid">
            <label className="field field--full">
              <span>여행기 제목</span>
              <input value={journal.j_title || ''} onChange={(e) => setJournal({ ...journal, j_title: e.target.value })} />
            </label>
            <label className="field field--full">
              <span>한 줄 소개</span>
              <input value={journal.j_intro || ''} onChange={(e) => setJournal({ ...journal, j_intro: e.target.value })} />
            </label>
            <div className="field field--full">
              <span>대표 사진</span>
              <PhotoPicker value={journal.j_photo || ''} onChange={(src) => setJournal({ ...journal, j_photo: src })} />
            </div>
          </div>
        </div>

        {days.map((day, i) => (
          <section key={day.ji_day ?? i} className="editor-day">
            <div className="editor-day__head">
              <span className="day-pill">Day {day.ji_day ?? i + 1}</span>
              <span>{day.date}</span>
            </div>

            {day.items.map((item, j) => (
              <div key={`${item.ji_day}-${item.ji_order}`} className="editor-item">
                <div className="editor-item__top"><span>장소 {j + 1}</span></div>
                <div className="form-grid">
                  <label className="field">
                    <span>시작 시간</span>
                    <input type="time" value={item.ji_time || ''} readOnly />
                  </label>
                  <label className="field">
                    <span>장소 이름</span>
                    <input value={item.ji_title || ''} readOnly />
                  </label>
                  <div className="field field--full">
                    <span>별점</span>
                    <div className="star-input">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} type="button" className={n <= (item.ji_rating ?? 0) ? 'on' : ''}
                          aria-label={`${n}점`} onClick={() => setItem(i, j, { ji_rating: item.ji_rating === n ? 0 : n })}>★</button>
                      ))}
                    </div>
                  </div>
                  <label className="field field--full">
                    <span>여행 기록</span>
                    <textarea value={item.ji_content || ''} onChange={(e) => setItem(i, j, { ji_content: e.target.value })} />
                  </label>
                  <div className="field field--full">
                    <span>사진</span>
                    <PhotoPicker value={item.ji_photo || ''} size={48}
                      onChange={(src) => setItem(i, j, { ji_photo: item.ji_photo === src ? '' : src })} />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Link to={editing ? `/journals/${journalId}` : `/trips/${tripId}`} className="btn">취소</Link>
          <button type="submit" className="btn btn--primary">{editing ? '수정 완료' : '여행기 등록'}</button>
        </div>
      </form>
    </div>
  );
}
