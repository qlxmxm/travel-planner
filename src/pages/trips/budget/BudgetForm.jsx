// [여행계획] 예산 탭: 내역 추가 입력줄 (구분 · 내용 · 금액)
import { useState } from 'react';
import { KINDS } from './budgetUtils.js';

const EMPTY_FORM = { kind: 'used', memo: '', amount: '' };

export default function BudgetForm({ busy, onAdd }) {
  const [form, setForm] = useState(EMPTY_FORM);

  const submit = async (e) => {
    e.preventDefault();
    if (await onAdd(form)) setForm((f) => ({ ...f, memo: '', amount: '' }));
  };

  return (
    <form className="budget-form" onSubmit={submit}>
      <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} aria-label="구분">
        {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </select>
      <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder={form.kind === 'used' ? '내용 (예: 숙소, 교통비)' : '메모(지출에만 저장돼요)'} aria-label="내용" disabled={form.kind !== 'used'} />
      <input type="number" min="0" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액(원)" aria-label="금액" />
      <button type="submit" className="btn btn--primary" disabled={busy}>추가</button>
    </form>
  );
}
