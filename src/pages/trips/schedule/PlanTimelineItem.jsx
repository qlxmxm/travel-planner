// [여행계획] 일정 탭의 타임라인 일정 1칸 (누르면 대화창 열기 / 편집 권한이 있으면 수정·삭제 버튼)
const MARKERS = ['var(--m1)', 'var(--m2)', 'var(--m3)', 'var(--m4)', 'var(--m5)'];

export default function PlanTimelineItem({ plan, index, selected, isMember, canEdit, onToggle, onEdit, onDelete }) {
  return (
    <li className="plan-wrap">
      <button type="button" className={`plan${selected ? ' selected' : ''}`} aria-expanded={selected} onClick={() => onToggle(plan.plan_id)}>
        <span className="plan__head">
          <span className="plan__time" style={{ background: MARKERS[index % MARKERS.length] }}>{plan.time}</span>
          {plan.label && <span className="plan__label">{plan.label}</span>}
        </span>
        <span className="plan__body">
          <img src={plan.photo} alt="" />
          <span className="plan__place">{plan.place}</span>
        </span>
        <span className="plan__title">
          <span>{plan.title}</span>
          {isMember && <span className="plan__count">💬 {plan.comments.length}</span>}
        </span>
      </button>
      {canEdit && (
        <div className="plan__tools">
          <button type="button" className="btn btn--text" onClick={() => onEdit(plan)}>수정</button>
          <button type="button" className="btn btn--text" onClick={() => onDelete(plan)}>삭제</button>
        </div>
      )}
    </li>
  );
}
