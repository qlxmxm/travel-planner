// [여행계획] 일정 탭: 시간 타임라인. 일정을 누르면 오른쪽에 대화창이 부드럽게 열리고, 다시 누르면 닫힙니다.
//  - "+ 일정 추가" 버튼, 각 일정의 "수정"/"삭제" 버튼이 있습니다. 서버(plan_details)에 저장됩니다.
//  - 대화창은 서버 테이블이 없어서 이 화면 안에서만 유지됩니다(새로고침하면 사라짐). 제목 수정은 일정에 저장됩니다.
// TODO: 일정 대화 저장(테이블 필요), 순서 변경(드래그)
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PlanChat from './PlanChat.jsx';
import PlanFormModal from './PlanFormModal.jsx';
import Modal from '../../components/common/Modal.jsx';
import { planApi } from '../../api/planApi.js';

const MARKERS = ['var(--m1)', 'var(--m2)', 'var(--m3)', 'var(--m4)', 'var(--m5)'];
const sortPlans = (list) => [...list].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

export default function ScheduleTab() {
  const { trip, canEdit = true, isMember = true } = useOutletContext(); // canEdit: 방장·편집자 / isMember: 멤버(대화 가능) / 둘 다 false: 공개된 다른 사람의 여행 (읽기 전용)
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const days = [...new Set(plans.map((p) => p.day))].sort((a, b) => a - b);
  const [day, setDay] = useState(1);
  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError('');
    planApi.listSchedules(trip)
      .then((list) => { if (cancelled) return; setPlans(list); setDay(list[0]?.day ?? 1); setLoading(false); })
      .catch((err) => { if (!cancelled) { setLoadError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [trip.trip_id]);
  const [openId, setOpenId] = useState(null);     // 열려 있는 일정
  const [shownId, setShownId] = useState(null);   // 닫히는 동안에도 내용 유지
  const [form, setForm] = useState(null);         // null | { plan?: 수정할 일정 }
  const [removing, setRemoving] = useState(null); // 삭제 확인 중인 일정

  const update = (id, fn) => setPlans((all) => all.map((p) => (p.plan_id === id ? fn(p) : p)));
  const toggle = (id) => { if (!isMember) return; if (openId === id) setOpenId(null); else { setShownId(id); setOpenId(id); } };
  const shown = plans.find((p) => p.plan_id === shownId);
  const dayPlans = plans.filter((p) => p.day === day);

  const save = async (data) => {
    try {
      if (form.plan) {
        const saved = await planApi.updateSchedule(trip, form.plan.plan_id, data);
        setPlans((all) => sortPlans(all.map((p) => (p.plan_id === form.plan.plan_id ? { ...saved, comments: p.comments } : p))));
      } else {
        const saved = await planApi.createSchedule(trip, data);
        setPlans((all) => sortPlans([...all, saved]));
      }
      setDay(data.day); setForm(null); setSaveError('');
    } catch (err) { setSaveError(err.message); }
  };
  const remove = async () => {
    try {
      await planApi.deleteSchedule(trip, removing.plan_id);
      const left = plans.filter((p) => p.plan_id !== removing.plan_id);
      setPlans(left);
      if (openId === removing.plan_id) setOpenId(null);
      if (!left.some((p) => p.day === day)) setDay(left[0]?.day ?? 1);
      setRemoving(null); setSaveError('');
    } catch (err) { setSaveError(err.message); setRemoving(null); }
  };
  // 대화창에서 제목을 고치면 서버의 일정(memo)에도 저장하고, 대화(comments)는 화면에만 둡니다.
  const changeFromChat = async (id, fn) => {
    const before = plans.find((p) => p.plan_id === id);
    const after = fn(before);
    update(id, () => after);
    if (after.title !== before.title) {
      try { await planApi.updateSchedule(trip, id, after); setSaveError(''); } catch (err) { setSaveError(err.message); update(id, () => before); }
    }
  };

  return (
    <div className={`schedule-layout${openId ? ' open' : ''}`}>
      <div className="schedule-main">
        <div className="schedule-top">
          <div>
            {days.map((d) => (
              <button key={d} type="button" className={`day-pill${d === day ? '' : ' day-pill--off'}`} onClick={() => { setDay(d); setOpenId(null); }}>Day {d}</button>
            ))}
          </div>
          {canEdit
            ? <button type="button" className="btn btn--primary btn--small" onClick={() => setForm({})}>+ 일정 추가</button>
            : <span className="readonly-note">{isMember ? '일정은 방장과 편집자만 고칠 수 있어요' : '공개된 여행계획이라 읽기만 할 수 있어요'}</span>}
        </div>

        {saveError && <p className="form-error" role="alert">{saveError}</p>}
        {loading && <p className="list-count" role="status">불러오는 중…</p>}
        {loadError && <div className="placeholder-box" role="alert">일정을 불러오지 못했어요: {loadError}</div>}
        {!loading && !loadError && dayPlans.length === 0 && <div className="placeholder-box">이 날은 아직 일정이 없어요. 위의 “+ 일정 추가”를 눌러보세요.</div>}
        <ul className="timeline">
          {dayPlans.map((p, i) => (
            <li key={p.plan_id} className="plan-wrap">
              <button type="button" className={`plan${p.plan_id === openId ? ' selected' : ''}`} aria-expanded={p.plan_id === openId} onClick={() => toggle(p.plan_id)}>
                <span className="plan__head">
                  <span className="plan__time" style={{ background: MARKERS[i % MARKERS.length] }}>{p.time}</span>
                  {p.label && <span className="plan__label">{p.label}</span>}
                </span>
                <span className="plan__body">
                  <img src={p.photo} alt="" />
                  <span className="plan__place">{p.place}</span>
                </span>
                <span className="plan__title">
                  <span>{p.title}</span>
                  {isMember && <span className="plan__count">💬 {p.comments.length}</span>}
                </span>
              </button>
              {canEdit && (
                <div className="plan__tools">
                  <button type="button" className="btn btn--text" onClick={() => setForm({ plan: p })}>수정</button>
                  <button type="button" className="btn btn--text" onClick={() => setRemoving(p)}>삭제</button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="schedule-side" aria-hidden={!openId}>
        {shown && <PlanChat plan={shown} onChange={(fn) => changeFromChat(shown.plan_id, fn)} onClose={() => setOpenId(null)} />}
      </div>

      {form && <PlanFormModal open plan={form.plan} days={days.length ? days : [1]} defaultDay={day} onSave={save} onClose={() => setForm(null)} />}
      <Modal open={!!removing} title="일정 삭제" onClose={() => setRemoving(null)} width={400}>
        <p style={{ marginBottom: 20 }}>“{removing?.place}” 일정을 삭제할까요?<br />대화 내용도 함께 사라져요.</p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setRemoving(null)}>취소</button>
          <button type="button" className="btn btn--danger" onClick={remove}>삭제</button>
        </div>
      </Modal>
    </div>
  );
}
