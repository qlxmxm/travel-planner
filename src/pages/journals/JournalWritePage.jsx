
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import PageHeader from '../../components/common/PageHeader.jsx';
import PhotoPicker from '../../components/common/PhotoPicker.jsx';
import TagPicker from '../../components/common/TagPicker.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';

import { sampleTrips, isMember, isEnded } from '../../data/sampleTrips.js';
import { sampleJournals } from '../../data/sampleJournals.js';
import { useAuth } from '../../context/AuthContext.jsx';

// ========================================
// 기본 데이터
// ========================================

const newItem = () => ({
  key: Math.random(),
  ji_time: '',
  ji_title: '',
  ji_rating: 1,
  ji_content: '',
  ji_photo: ''
});

const newDay = (day = 1, date = '') => ({
  key: Math.random(),
  ji_day: day,
  ji_date: date,
  ji_intro: '',
  items: [newItem()]
});

const addDays = (date, n) => {
  if (!date) return '';

  const d = new Date(date);
  d.setDate(d.getDate() + n);

  return d.toISOString().slice(0, 10);
};

const getPlanId = (plan) =>
  String(plan.p_id ?? plan.trip_id);

// ========================================
// 여행계획 -> 여행기 변환
// ========================================

const tripToDays = (plan) => {
  const plans = plan.plans || [];

  const nums = [
    ...new Set(plans.map((p) => p.pi_day))
  ].sort((a, b) => a - b);

  return nums.map((n) => ({
    key: Math.random(),
    ji_day: n,
    ji_date: addDays(
      plan.p_start_date ?? plan.start_date,
      n - 1
    ),
    ji_intro: '',

    items: plans
      .filter((p) => p.pi_day === n)
      .sort((a, b) =>
        String(a.pi_time || '').localeCompare(
          String(b.pi_time || '')
        )
      )
      .map((p) => ({
        key: Math.random(),
        ji_time: p.pi_time
          ? String(p.pi_time).slice(0, 5)
          : '',
        ji_title: p.pi_place || '',
        ji_rating: 1,
        ji_content: p.pi_title || '',
        ji_photo: p.pi_photo || ''
      }))
  }));
};

// ========================================
// 기존 여행기 -> 편집기 변환
// ========================================

const toEditorDays = (journal) => {
  if (!journal.days) return [newDay()];

  return journal.days.map((d, index) => ({
    key: Math.random(),
    ji_day: d.ji_day ?? index + 1,
    ji_date: d.ji_date || '',
    ji_intro: d.ji_intro || '',

    items: (d.items || []).map((it) => ({
      key: Math.random(),
      ji_time: it.ji_time
        ? String(it.ji_time).slice(11, 16)
        : '',
      ji_title: it.ji_title || '',
      ji_rating: it.ji_rating ?? 1,
      ji_content: it.ji_content || '',
      ji_photo: it.ji_photo || ''
    }))
  }));
};

// ========================================
// 메인 컴포넌트
// ========================================

export default function JournalWritePage() {
  const navigate = useNavigate();
  const { journalId, tripId } = useParams();
  const { user } = useAuth();

  const editing = journalId
    ? sampleJournals.find(
        (j) => String(j.j_id) === journalId
      )
    : null;

  const myEnded = sampleTrips.filter(
    (t) => isMember(t, user) && isEnded(t)
  );

  const from = tripId
    ? myEnded.find((t) => getPlanId(t) === tripId)
    : null;

  const [head, setHead] = useState({
    j_title:
      editing?.j_title ??
      (from
        ? `${from.destination}, ${from.duration} 여행기`
        : ''),

    j_intro: editing?.j_intro ?? '',

    p_id: editing?.p_id
      ? String(editing.p_id)
      : from
        ? getPlanId(from)
        : '',

    j_photo: editing?.j_photo ?? from?.photo ?? '',

    loc: editing?.loc ?? from?.destination ?? ''
  });

  const [days, setDays] = useState(() => {
    if (editing) return toEditorDays(editing);
    if (from) return tripToDays(from);

    return [newDay()];
  });

  const [tags, setTags] = useState(
    editing?.hashtags ?? from?.hashtags ?? []
  );

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  
  // ========================================
  // 여행계획 불러오기
  // ========================================

  const loadTrip = (id) => {
    const t = myEnded.find(
      (plan) => getPlanId(plan) === id
    );

    if (!t) {
      setHead((h) => ({
        ...h,
        p_id: '',
        j_photo: '',
        loc: ''
      }));

      setDays([newDay()]);
      setTags([]);
      return;
    }

    setHead((h) => ({
      ...h,
      p_id: getPlanId(t),
      j_title: `${t.destination}, ${t.duration} 여행기`,
      j_photo: t.photo || '',
      loc: t.destination || ''
    }));

    setDays(tripToDays(t));
    setTags(t.hashtags || []);
  };

  // ========================================
  // Day 수정
  // ========================================

  const setDay = (i, patch) => {
    setDays((ds) =>
      ds.map((d, k) =>
        k === i ? { ...d, ...patch } : d
      )
    );
  };

  // ========================================
  // 장소 수정
  // ========================================

  const setItem = (i, j, patch) => {
    setDays((ds) =>
      ds.map((d, k) =>
        k === i
          ? {
              ...d,
              items: d.items.map((it, m) =>
                m === j
                  ? { ...it, ...patch }
                  : it
              )
            }
          : d
      )
    );
  };

  // 장소 추가
  const addItem = (i) => {
    setDays((ds) =>
      ds.map((d, k) =>
        k === i
          ? {
              ...d,
              items: [...d.items, newItem()]
            }
          : d
      )
    );
  };

  // 장소 삭제
  const removeItem = (i, j) => {
    setDays((ds) =>
      ds.map((d, k) =>
        k === i
          ? {
              ...d,
              items: d.items.filter(
                (_, m) => m !== j
              )
            }
          : d
      )
    );
  };

  // Day 추가
  const addDay = () => {
    setDays((ds) => [
      ...ds,
      newDay(ds.length + 1)
    ]);
  };

  // Day 삭제
  const removeDay = (i) => {
    setDays((ds) =>
      ds
        .filter((_, k) => k !== i)
        .map((d, index) => ({
          ...d,
          ji_day: index + 1
        }))
    );
  };

  // ========================================
  // 저장
  // ========================================

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    if (!head.j_title.trim()) {
      return setError('여행기 제목을 입력해 주세요.');
    }

    if (!head.p_id) {
      return setError('여행계획을 선택해 주세요.');
    }

    if (
      days.some((d) =>
        d.items.length === 0 ||
        d.items.some(
          (it) => !it.ji_title.trim()
        )
      )
    ) {
      return setError('장소 이름을 입력해 주세요.');
    }

    setLoading(true);

    try {
      // 1. 여행기 생성
      const journalResponse = await fetch('/journals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_id: String(head.p_id),
          u_id: user.u_id,
          j_title: head.j_title,
          j_intro: head.j_intro || null,
          j_photo: head.j_photo || null,
          loc: head.loc || null
        })
      });

      if (!journalResponse.ok) {
        const data = await journalResponse.json();

        throw new Error(
          data.detail || '여행기 생성에 실패했습니다.'
        );
      }

      const journal = await journalResponse.json();
      const j_id = journal.j_id;

      // 2. 장소별 일정 생성
      for (let i = 0; i < days.length; i++) {
        const day = days[i];

        for (let j = 0; j < day.items.length; j++) {
          const item = day.items[j];

          const ji_time = item.ji_time
            ? `${day.ji_date || '2000-01-01'}T${item.ji_time}:00`
            : null;

          const itemResponse = await fetch(
            '/journals/items',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                j_id,
                ji_day: i + 1,
                ji_order: j + 1,
                ji_time,
                ji_title: item.ji_title,
                ji_content: item.ji_content || null,
                ji_photo: item.ji_photo || null,
                ji_rating: item.ji_rating
              })
            }
          );

          if (!itemResponse.ok) {
            const data = await itemResponse.json();

            throw new Error(
              data.detail ||
              '장소 일정 저장에 실패했습니다.'
            );
          }
        }
      }

      navigate(`/journals/${j_id}`);

    } catch (err) {
      setError(
        err.message || '저장 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  
  // ========================================
  // 작성자 권한 확인
  // ========================================

  if (
    journalId &&
    (
      !editing ||
      editing.u_id !== user?.u_id
    )
  ) {
    return (
      <EmptyState
        icon="🔒"
        title="작성자만 수정할 수 있어요"
        description="내가 쓴 여행기만 수정할 수 있습니다."
      >
        <Link
          to="/journals"
          className="btn btn--primary"
        >
          여행기 목록으로
        </Link>
      </EmptyState>
    );
  }

  // ========================================
  // 화면
  // ========================================

  return (
    <div
      className="form-page"
      style={{ maxWidth: 760 }}
    >
      <PageHeader
        title={editing ? '여행기 수정' : '여행기 쓰기'}
        description={
          editing
            ? '내용을 고친 뒤 저장해 주세요.'
            : '다녀온 여행을 Day별, 시간별로 기록해 보세요.'
        }
      />

      <form onSubmit={submit}>

        <div
          className="card form-page__card"
          style={{ marginBottom: 24 }}
        >
          <div className="form-grid">

            <label className="field field--full">
              <span>제목</span>
              <input
                value={head.j_title}
                onChange={(e) =>
                  setHead({
                    ...head,
                    j_title: e.target.value
                  })
                }
                placeholder="예) 도쿄 4박 5일 여행기"
              />
            </label>

            <label className="field field--full">
              <span>한 줄 소개</span>
              <input
                value={head.j_intro}
                onChange={(e) =>
                  setHead({
                    ...head,
                    j_intro: e.target.value
                  })
                }
              />
            </label>

            {!editing && (
              <label className="field field--full">
                <span>여행계획에서 불러오기</span>

                <select
                  value={head.p_id}
                  onChange={(e) =>
                    loadTrip(e.target.value)
                  }
                >
                  <option value="">
                    선택 안 함
                  </option>

                  {myEnded.map((t) => (
                    <option
                      key={getPlanId(t)}
                      value={getPlanId(t)}
                    >
                      {t.title} · {t.duration}
                    </option>
                  ))}
                </select>

                <small>
                  종료된 여행계획을 선택하면 일정이 자동으로 입력됩니다.
                </small>
              </label>
            )}

            <div className="field field--full">
              <span>해시태그 (여행 종류)</span>

              <TagPicker
                value={tags}
                onChange={setTags}
              />
            </div>

            <div className="field field--full">
              <span>대표 사진</span>

              <PhotoPicker
                value={head.j_photo}
                onChange={(src) =>
                  setHead({
                    ...head,
                    j_photo: src
                  })
                }
              />
            </div>

          </div>
        </div>

        {days.map((d, i) => (
          <section
            key={d.key}
            className="editor-day"
          >

            <div className="editor-day__head">

              <span className="day-pill">
                Day {i + 1}
              </span>

              <input
                type="date"
                value={d.ji_date}
                onChange={(e) =>
                  setDay(i, {
                    ji_date: e.target.value
                  })
                }
                aria-label={`Day ${i + 1} 날짜`}
                style={{
                  height: 40,
                  padding: '0 12px',
                  border: '1px solid var(--line)',
                  borderRadius: 12
                }}
              />

              {days.length > 1 && (
                <button
                  type="button"
                  className="btn btn--text"
                  style={{ marginLeft: 'auto' }}
                  onClick={() => removeDay(i)}
                >
                  이 Day 삭제
                </button>
              )}

            </div>

            <label className="field">
              <span>그날의 한 줄</span>

              <input
                value={d.ji_intro}
                onChange={(e) =>
                  setDay(i, {
                    ji_intro: e.target.value
                  })
                }
              />
            </label>

            {d.items.map((it, j) => (
              <div
                key={it.key}
                className="editor-item"
              >

                <div className="editor-item__top">
                  <span>장소 {j + 1}</span>

                  {d.items.length > 1 && (
                    <button
                      type="button"
                      className="btn btn--text"
                      onClick={() =>
                        removeItem(i, j)
                      }
                    >
                      삭제
                    </button>
                  )}
                </div>

                <div className="form-grid">

                  <label className="field">
                    <span>시작 시간</span>

                    <input
                      type="time"
                      value={it.ji_time}
                      onChange={(e) =>
                        setItem(i, j, {
                          ji_time: e.target.value
                        })
                      }
                    />
                  </label>

                  <label className="field">
                    <span>장소 이름</span>

                    <input
                      value={it.ji_title}
                      onChange={(e) =>
                        setItem(i, j, {
                          ji_title: e.target.value
                        })
                      }
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
                            n <= it.ji_rating ? 'on' : ''
                          }
                          aria-label={`${n}점`}
                          onClick={() =>
                            setItem(i, j, {
                              ji_rating: n
                            })
                          }
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="field field--full">
                    <span>내용</span>

                    <textarea
                      value={it.ji_content}
                      onChange={(e) =>
                        setItem(i, j, {
                          ji_content: e.target.value
                        })
                      }
                    />
                  </label>

                  <div className="field field--full">
                    <span>사진 (선택)</span>

                    <PhotoPicker
                      value={it.ji_photo}
                      onChange={(src) =>
                        setItem(i, j, {
                          ji_photo:
                            it.ji_photo === src
                              ? ''
                              : src
                        })
                      }
                      size={48}
                    />
                  </div>

                </div>
              </div>
            ))}

            <button
              type="button"
              className="btn btn--small"
              onClick={() => addItem(i)}
            >
              + 장소 추가
            </button>

          </section>
        ))}

        <button
          type="button"
          className="btn"
          style={{
            width: '100%',
            marginBottom: 20
          }}
          onClick={addDay}
        >
          + Day 추가
        </button>

        {error && (
          <p
            className="form-error"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="form-actions">

          <Link
            to={
              editing
                ? `/journals/${editing.j_id}`
                : '/journals'
            }
            className="btn"
          >
            취소
          </Link>

          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
          >
            {loading
              ? '저장 중...'
              : editing
                ? '저장'
                : '등록하기'}
          </button>

        </div>

      </form>
    </div>
  );
}

