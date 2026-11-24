// [여행계획] 예산 가계부 탭: 총 예산(예산 + 추가 예산) · 지출 합계 · 잔액을 보여주고, 내역을 추가/수정/삭제합니다. 멤버만 볼 수 있어요.
//  - kind: 'budget' 예산(budgets.b_budget) / 'add' 추가 예산(budgets.b_add) / 'used' 지출(expenses)
//  - 서버: /api/plans/{id}/budgets, /budgets/{b_id}/expenses  (금액은 정수, 삭제 = 0원/행 삭제)
//  - 데이터 처리는 useBudget.js, 계산은 budgetUtils.js, 화면 조각은 BudgetSummary/BudgetForm/BudgetList 입니다.
// TODO: 지출 카테고리(식비/교통 등)·통계 그래프
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../../components/common/EmptyState.jsx';
import BudgetSummary from './BudgetSummary.jsx';
import BudgetForm from './BudgetForm.jsx';
import BudgetList from './BudgetList.jsx';
import { summarize } from './budgetUtils.js';
import { useBudget } from './useBudget.js';

export default function BudgetTab() {
  const { trip, canEdit, isMember } = useOutletContext(); // canEdit: 방장·편집자만 입력/수정, 참여자는 보기만
  const budget = useBudget(trip.trip_id);

  if (!isMember) return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="예산 가계부는 이 여행의 멤버에게만 보여요." />;

  return (
    <div className="budget">
      <BudgetSummary summary={summarize(budget.items)} />

      {canEdit
        ? <BudgetForm key={trip.trip_id} busy={budget.busy} onAdd={budget.addItem} />
        : <p className="readonly-note">예산·지출은 방장과 편집자만 입력할 수 있어요.</p>}
      {budget.error && <p className="form-error" role="alert">{budget.error}</p>}

      {budget.loading ? (
        <p className="list-count" role="status">불러오는 중…</p>
      ) : budget.loadError ? (
        <EmptyState icon="⚠️" title="예산을 불러오지 못했어요" description={budget.loadError}><button type="button" className="btn btn--primary" onClick={budget.retry}>다시 시도</button></EmptyState>
      ) : budget.items.length === 0 ? (
        <EmptyState icon="💰" title="아직 내역이 없어요" description="예산을 먼저 정하고 쓴 돈을 기록해 보세요." />
      ) : (
        <BudgetList key={trip.trip_id} items={budget.items} canEdit={canEdit} busy={budget.busy} onSave={budget.saveItem} onDelete={budget.deleteItem} />
      )}
    </div>
  );
}
