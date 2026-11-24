// [여행계획] 일정 탭: 시간 타임라인. 일정을 누르면 오른쪽에 대화창이 부드럽게 열리고, 다시 누르면 닫힙니다.
//  - "+ 일정 추가" 버튼, 각 일정의 "수정"/"삭제" 버튼이 있습니다. 서버(plan_details)에 저장됩니다.
//  - 대화창은 서버 테이블이 없어서 이 화면 안에서만 유지됩니다(새로고침하면 사라짐). 제목 수정은 일정에 저장됩니다.
//  - 데이터 처리는 useSchedule.js, 일정 1칸은 PlanTimelineItem.jsx 에 있습니다.
// TODO: 일정 대화 저장(테이블 필요), 순서 변경(드래그)
import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import PlanChat from './PlanChat.jsx';
import PlanFormModal from './PlanFormModal.jsx';
import PlanTimelineItem from './PlanTimelineItem.jsx';
import DeletePlanModal from './DeletePlanModal.jsx';
import { useSchedule } from './useSchedule.js';

export default function ScheduleTab() {
  const { trip, canEdit = true, isMember = true } = useOutletContext(); // canEdit: 방장·편집자 / isMember: 멤버(대화 가능) / 둘 다 false: 공개된 다른 사람의 여행 (읽기 전용)
  const schedule = useSchedule(trip);
  const { plans, days, day, setDay, dayPlans } = schedule;

  const [openId, setOpenId] = useState(null);     // 열려 있는 일정
  const [shownId, setShownId] = useState(null);   // 닫히는 동안에도 내용 유지
  const [form, setForm] = useState(null);         // null | { plan?: 수정할 일정 }
  const [removing, setRemoving] = useState(null); // 삭제 확인 중인 일정

  const shown = plans.find((p) => p.plan_id === shownId);

  const toggle = (id) => {
    if (!isMember) return;
    if (openId === id) setOpenId(null);
    else { setShownId(id); setOpenId(id); }
  };
  const selectDay = (d) => { setDay(d); setOpenId(null); };

  const handleSave = async (data) => {
    if (await schedule.savePlan(form.plan, data)) setForm(null);
  };
  const handleRemove = async () => {
    const target = removing;
    if (await schedule.removePlan(target) && openId === target.plan_id) setOpenId(null);
    setRemoving(null);
  };

  return (
    <div className={`schedule-layout${openId ? ' open' : ''}`}>
      <div className="schedule-main">
        <div className="schedule-top">
          <div>
            {days.map((d) => (
              <button key={d} type="button" className={`day-pill${d === day ? '' : ' day-pill--off'}`} onClick={() => selectDay(d)}>Day {d}</button>
            ))}
          </div>
          {canEdit
            ? <button type="button" className="btn btn--primary btn--small" onClick={() => setForm({})}>+ 일정 추가</button>
            : <span className="readonly-note">{isMember ? '일정은 방장과 편집자만 고칠 수 있어요' : '공개된 여행계획이라 읽기만 할 수 있어요'}</span>}
        </div>

        {schedule.saveError && <p className="form-error" role="alert">{schedule.saveError}</p>}
        {schedule.loading && <p className="list-count" role="status">불러오는 중…</p>}
        {schedule.loadError && <div className="placeholder-box" role="alert">일정을 불러오지 못했어요: {schedule.loadError}</div>}
        {!schedule.loading && !schedule.loadError && dayPlans.length === 0 && <div className="placeholder-box">이 날은 아직 일정이 없어요. 위의 “+ 일정 추가”를 눌러보세요.</div>}
        <ul className="timeline">
          {dayPlans.map((p, i) => (
            <PlanTimelineItem
              key={p.plan_id}
              plan={p}
              index={i}
              selected={p.plan_id === openId}
              isMember={isMember}
              canEdit={canEdit}
              onToggle={toggle}
              onEdit={(plan) => setForm({ plan })}
              onDelete={setRemoving}
            />
          ))}
        </ul>
      </div>

      <div className="schedule-side" aria-hidden={!openId}>
        {shown && <PlanChat plan={shown} onChange={(fn) => schedule.changeFromChat(shown.plan_id, fn)} onClose={() => setOpenId(null)} />}
      </div>

      {form && <PlanFormModal open plan={form.plan} days={days.length ? days : [1]} defaultDay={day} onSave={handleSave} onClose={() => setForm(null)} />}
      <DeletePlanModal plan={removing} onCancel={() => setRemoving(null)} onConfirm={handleRemove} />
    </div>
  );
}
