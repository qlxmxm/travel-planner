// [여행계획] 예산 가계부 탭: 총 예산(예산 + 추가 예산) · 지출 합계 · 잔액을 보여주고, 내역을 추가/수정/삭제합니다. 멤버만 볼 수 있어요.
//  - kind: 'budget' 예산(budgets.b_budget) / 'add' 추가 예산(budgets.b_add) / 'used' 지출(expenses)
//  - 서버: /api/plans/{id}/budgets, /budgets/{b_id}/expenses  (금액은 정수, 삭제 = 0원/행 삭제)
// TODO: 지출 카테고리(식비/교통 등)·통계 그래프
import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import { planApi } from '../../api/planApi.js';

const KINDS = { budget: '예산', add: '추가 예산', used: '지출' };
const won = (n) => `${n.toLocaleString('ko-KR')}원`;

export default function BudgetTab() {
  const { trip, canEdit } = useOutletContext();
  const [state, setState] = useState({ items: [], budgets: [] });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ kind: 'used', memo: '', amount: '' });
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ memo: '', amount: '' });

  const load = useCallback(async () => {
    try { setState(await planApi.listBudgetItems(trip.trip_id)); setLoadError(''); }
    catch (err) { setLoadError(err.message); }
    finally { setLoading(false); }
  }, [trip.trip_id]);

  useEffect(() => {
    setLoading(true); setForm({ kind: 'used', memo: '', amount: '' }); setError(''); setEditId(null);
    load();
  }, [load]);

  if (!canEdit) return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="예산 가계부는 이 여행의 멤버에게만 보여요." />;

  const { items, budgets } = state;
  const sum = (k) => items.filter((i) => i.kind === k).reduce((s, i) => s + i.amount, 0);
  const total = sum('budget') + sum('add');
  const used = sum('used');
  const remain = total - used;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

  // 서버 호출 → 성공하면 목록을 다시 불러와서 화면과 DB를 맞춥니다.
  const run = async (action) => {
    setBusy(true);
    try { await action(); setError(''); await load(); return true; }
    catch (err) { setError(err.message); return false; }
    finally { setBusy(false); }
  };

  const add = async (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (form.kind === 'used' && !form.memo.trim()) return setError('내용을 입력해 주세요.');
    if (!Number.isInteger(amount) || amount <= 0) return setError('금액은 1원 이상의 정수로 입력해 주세요.');
    const ok = await run(() => planApi.addBudgetItem(trip.trip_id, budgets, { kind: form.kind, memo: form.memo.trim(), amount }));
    if (ok) setForm((f) => ({ ...f, memo: '', amount: '' }));
  };
  const save = async (item) => {
    const amount = Number(draft.amount);
    if (!Number.isInteger(amount) || amount < 0) return setError('금액은 0원 이상의 정수로 입력해 주세요.');
    if (item.kind === 'used' && !draft.memo.trim()) return setError('내용을 입력해 주세요.');
    if (await run(() => planApi.updateBudgetItem(trip.trip_id, item, { memo: draft.memo.trim(), amount }))) setEditId(null);
  };

  return (
    <div className="budget">
      <div className="budget-summary">
        <div className="card"><span>총 예산</span><b>{won(total)}</b><small>예산 {won(sum('budget'))} + 추가 {won(sum('add'))}</small></div>
        <div className="card"><span>지출</span><b>{won(used)}</b><small>{items.filter((i) => i.kind === 'used').length}건</small></div>
        <div className={`card${remain < 0 ? ' over' : ''}`}><span>잔액</span><b>{won(remain)}</b><small>{remain < 0 ? '예산을 초과했어요' : `${100 - pct}% 남음`}</small></div>
      </div>
      <div className={`budget-bar${remain < 0 ? ' over' : ''}`} role="img" aria-label={`예산의 ${pct}% 사용`}><i style={{ width: `${pct}%` }} /></div>

      <form className="budget-form" onSubmit={add}>
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} aria-label="구분">
          {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder={form.kind === 'used' ? '내용 (예: 숙소, 교통비)' : '메모(지출에만 저장돼요)'} aria-label="내용" disabled={form.kind !== 'used'} />
        <input type="number" min="0" step="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액(원)" aria-label="금액" />
        <button type="submit" className="btn btn--primary" disabled={busy}>추가</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}

      {loading ? (
        <p className="list-count" role="status">불러오는 중…</p>
      ) : loadError ? (
        <EmptyState icon="⚠️" title="예산을 불러오지 못했어요" description={loadError}><button type="button" className="btn btn--primary" onClick={() => { setLoading(true); load(); }}>다시 시도</button></EmptyState>
      ) : items.length === 0 ? (
        <EmptyState icon="💰" title="아직 내역이 없어요" description="예산을 먼저 정하고 쓴 돈을 기록해 보세요." />
      ) : (
        <ul className="card budget-list">
          {items.map((i) => (
            <li key={i.id}>
              <span className={`kind kind--${i.kind}`}>{KINDS[i.kind]}</span>
              {editId === i.id ? (
                <div className="budget-edit">
                  <input value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} aria-label="내용 수정" disabled={i.kind !== 'used'} />
                  <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} aria-label="금액 수정" />
                  <button type="button" className="btn btn--primary btn--small" disabled={busy} onClick={() => save(i)}>저장</button>
                  <button type="button" className="btn btn--small" onClick={() => setEditId(null)}>취소</button>
                </div>
              ) : (
                <>
                  <span className="budget-list__memo">{i.memo}<small>{i.date}</small></span>
                  <b className={i.kind === 'used' ? 'minus' : 'plus'}>{i.kind === 'used' ? '-' : '+'}{won(i.amount)}</b>
                  <span className="budget-list__tools">
                    <button type="button" className="btn btn--text" onClick={() => { setEditId(i.id); setDraft({ memo: i.memo, amount: String(i.amount) }); }}>수정</button>
                    <button type="button" className="btn btn--text" disabled={busy} onClick={() => run(() => planApi.deleteBudgetItem(trip.trip_id, i))}>삭제</button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
