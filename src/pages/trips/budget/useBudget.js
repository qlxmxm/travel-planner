// [여행계획] 예산 탭의 데이터 처리: 불러오기 / 추가·수정·삭제 (성공하면 목록을 다시 불러와 화면과 DB를 맞춥니다)
import { useCallback, useEffect, useState } from 'react';
import { budgetApi } from '../../../api/budgetApi.js';

export function useBudget(tripId) {
  const [state, setState] = useState({ items: [], budgets: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try { setState(await budgetApi.listItems(tripId)); setLoadError(''); }
    catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }, [tripId]);

  useEffect(() => {
    setLoading(true); setError('');
    load();
  }, [load]);

  const retry = () => { setLoading(true); load(); };

  // 서버 호출 → 성공하면 목록을 다시 불러옵니다. 성공하면 true
  const run = async (action) => {
    setBusy(true);
    try { await action(); setError(''); await load(); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };

  // form: { kind, memo, amount(문자열) }
  const addItem = async (form) => {
    const amount = Number(form.amount);
    if (form.kind === 'used' && !form.memo.trim()) { setError('내용을 입력해 주세요.'); return false; }
    if (!Number.isInteger(amount) || amount <= 0) { setError('금액은 1원 이상의 정수로 입력해 주세요.'); return false; }
    return run(() => budgetApi.addItem(tripId, state.budgets, { kind: form.kind, memo: form.memo.trim(), amount }));
  };

  // draft: { memo, amount(문자열) }
  const saveItem = async (item, draft) => {
    const amount = Number(draft.amount);
    if (!Number.isInteger(amount) || amount < 0) { setError('금액은 0원 이상의 정수로 입력해 주세요.'); return false; }
    if (item.kind === 'used' && !draft.memo.trim()) { setError('내용을 입력해 주세요.'); return false; }
    return run(() => budgetApi.updateItem(tripId, item, { memo: draft.memo.trim(), amount }));
  };

  const deleteItem = (item) => run(() => budgetApi.deleteItem(tripId, item));

  return { items: state.items, loading, loadError, busy, error, retry, addItem, saveItem, deleteItem };
}
