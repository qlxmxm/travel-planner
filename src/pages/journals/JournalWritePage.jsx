
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { journalApi } from '../../api/journalApi.js';

export default function JournalWritePage() {
  const { tripId, journalId } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(journalId);

  const [journal, setJournal] = useState(null);
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadJournal = async () => {
      setLoading(true);
      setError('');
      setJournal(null);
      setDays([]);

      if (!editing && !tripId) {
        setError('여행계획에서 여행기 작성 버튼을 눌러 주세요.');
        setLoading(false);
        return;
      }

      try {
        const result = editing
          ? await journalApi.getForEdit(journalId)
          : await journalApi.getPlanPreview(tripId);

        if (cancelled) return;

        setJournal(result.journal);
        setDays(result.days ?? []);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '여행기 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadJournal();

    return () => {
      cancelled = true;
    };
  }, [tripId, journalId, editing]);

  const setJournalField = (field, value) => {
    setJournal((prev) => ({ ...prev, [field]: value }));
  };

  const setItem = (dayIndex, itemIndex, patch) => {
    setDays((prev) => prev.map((day, i) => (
      i === dayIndex
        ? {
            ...day,
            items: day.items.map((item, j) => (
              j === itemIndex ? { ...item, ...patch } : item
            )),
          }
        : day
    )));
  };

  const submit = async (e) => {
    e.preventDefault();

    if (saving) return;

    setError('');

    if (!journal) {
      setError('여행기 정보를 불러오지 못했습니다.');
      return;
    }

    const title = journal.j_title?.trim();

    if (!title) {
      setError('여행기 제목을 입력해 주세요.');
      return;
    }

    if (title.length > 100) {
      setError('여행기 제목은 100자 이하로 입력해 주세요.');
      return;
    }

    if ((journal.j_intro || '').length > 100) {
      setError('한 줄 소개는 100자 이하로 입력해 주세요.');
      return;
    }

    const items = days.flatMap((day) => day.items.map((item) => ({
      [editing ? 'ji_id' : 'pd_id']: editing ? item.ji_id : item.pd_id,
      ji_content: item.ji_content || '',
      ji_photo: item.ji_photo || null,
      ji_rating: item.ji_rating ?? null,
    })));

    if (items.some((item) => !Number.isInteger(
      editing ? item.ji_id : item.pd_id
    ))) {
      setError('일정 식별자가 올바르지 않습니다. 다시 불러와 주세요.');
      return;
    }

    const payload = {
      j_title: title,
      j_intro: journal.j_intro || null,
      j_photo: journal.j_photo || null,
      items,
    };

    setSaving(true);

    try {
      const result = editing
        ? await journalApi.update(journalId, payload)
        : await journalApi.create(tripId, payload);

      const savedId = result?.journal?.j_id;

      if (!savedId) {
        throw new Error('저장 결과에서 여행기 ID를 확인할 수 없습니다.');
      }

      navigate(`/journals/${savedId}`, { replace: true });
    } catch (err) {
      setError(err.message || '여행기를 저장하지 못했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p>여행기 정보를 불러오는 중입니다.</p>;
  }

  if (!journal) {
    return (
      <EmptyState
        icon="🔒"
        title="여행기 정보를 불러올 수 없습니다."
        description={error || '여행계획 또는 여행기를 확인해 주세요.'}
      >
        <Link to="/journals" className="btn btn--primary">
          여행기 목록으로
        </Link>
      </EmptyState>
    );
  }

  return (
    <div className="form-page" style={{ maxWidth: 760 }}>
      <PageHeader
        title={editing ? '여행기 수정' : '여행기 작성'}
        description="여행계획에서 가져온 일정에 기록을 남겨 보세요."
      />

      <form onSubmit={submit}>
        <div
          className="card form-page__card"
          style={{ marginBottom: 24 }}
        >
          <div className="form-grid">
            <label className="field field--full">
              <span>여행기 제목</span>
              <input
                value={journal.j_title || ''}
                maxLength={100}
                required
                onChange={(e) => setJournalField(
                  'j_title', e.target.value
                )}
              />
            </label>

            <label className="field field--full">
              <span>한 줄 소개</span>
              <input
                value={journal.j_intro || ''}
                maxLength={100}
                onChange={(e) => setJournalField(
                  'j_intro', e.target.value
                )}
              />
            </label>

            <div className="field field--full">
              <span>대표 사진</span>
              <PhotoPicker
                value={journal.j_photo || ''}
                onChange={(src) => setJournalField(
                  'j_photo', src
                )}
              />
            </div>
          </div>
        </div>

        {days.map((day, i) => (
          <section
            key={day.ji_day ?? i}
            className="editor-day"
          >
            <div className="editor-day__head">
              <span className="day-pill">
                Day {day.ji_day ?? i + 1}
              </span>
              <span>{day.date || ''}</span>
            </div>

            {day.items.map((item, j) => (
              <div
                key={item.ji_id ?? item.pd_id ?? `${i}-${j}`}
                className="editor-item"
              >
                <div className="editor-item__top">
                  <span>장소 {j + 1}</span>
                </div>

                <div className="form-grid">
                  <label className="field">
                    <span>시작 시간</span>
                    <input
                      type="time"
                      value={item.ji_time || ''}
                      readOnly
                    />
                  </label>

                  <label className="field">
                    <span>장소 이름</span>
                    <input
                      value={item.ji_title || ''}
                      readOnly
                    />
                  </label>

                  <div className="field field--full">
                    <span>별점</span>
                    <div className="star-input">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          className={
                            n <= (item.ji_rating ?? 0) ? 'on' : ''
                          }
                          aria-label={`${n}점`}
                          aria-pressed={item.ji_rating === n}
                          onClick={() => setItem(i, j, {
                            ji_rating: item.ji_rating === n
                              ? null
                              : n,
                          })}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="field field--full">
                    <span>여행 기록</span>
                    <textarea
                      value={item.ji_content || ''}
                      onChange={(e) => setItem(i, j, {
                        ji_content: e.target.value,
                      })}
                    />
                  </label>

                  <div className="field field--full">
                    <span>사진</span>
                    <PhotoPicker
                      value={item.ji_photo || ''}
                      size={48}
                      onChange={(src) => setItem(i, j, {
                        ji_photo: item.ji_photo === src
                          ? ''
                          : src,
                      })}
                    />
                  </div>
                </div>
              </div>
            ))}
          </section>
        ))}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          <Link
            to={
              editing
                ? `/journals/${journalId}`
                : tripId
                  ? `/trips/${tripId}`
                  : '/journals'
            }
            className="btn"
          >
            취소
          </Link>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving}
          >
            {saving
              ? '저장 중...'
              : editing
                ? '수정 완료'
                : '여행기 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
