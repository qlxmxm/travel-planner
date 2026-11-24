// [여행계획] 예산 탭 위쪽: 총 예산 · 지출 · 잔액 카드와 사용률 막대
import { won } from './budgetUtils.js';

export default function BudgetSummary({ summary }) {
  const { budget, add, used, total, remain, pct, usedCount } = summary;
  return (
    <>
      <div className="budget-summary">
        <div className="card"><span>총 예산</span><b>{won(total)}</b><small>예산 {won(budget)} + 추가 {won(add)}</small></div>
        <div className="card"><span>지출</span><b>{won(used)}</b><small>{usedCount}건</small></div>
        <div className={`card${remain < 0 ? ' over' : ''}`}><span>잔액</span><b>{won(remain)}</b><small>{remain < 0 ? '예산을 초과했어요' : `${100 - pct}% 남음`}</small></div>
      </div>
      <div className={`budget-bar${remain < 0 ? ' over' : ''}`} role="img" aria-label={`예산의 ${pct}% 사용`}><i style={{ width: `${pct}%` }} /></div>
    </>
  );
}
