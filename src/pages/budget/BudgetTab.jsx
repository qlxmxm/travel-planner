// [여행계획] 예산 가계부 탭: 총 예산(예산 + 추가 예산) · 지출 합계 · 잔액을 보여주고, 내역을 추가/수정/삭제합니다. 멤버만 볼 수 있어요.
//  - kind: 'budget' 예산 / 'add' 추가 예산 / 'used' 지출   (DB 예산 테이블의 b_budget / b_add / b_used)
//  - 지금은 화면 안에서만 동작합니다.
// TODO: GET/POST /plans/{id}/budgets, PUT/DELETE /budgets/{id} 연결, 지출 카테고리(식비/교통 등)·통계 그래프
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import EmptyState from '../../components/common/EmptyState.jsx';
import { sampleBudgets } from '../../data/sampleTrips.js';

const KINDS = { b_budget: '예산', b_add: '추가 예산', e_amount: '지출' };
const won = (n) => `${n.toLocaleString('ko-KR')}원`;

export default function BudgetTab() {
  const { trip, canEdit } = useOutletContext();
  const [items, setItems] = useState(() => sampleBudgets[trip.trip_id] ?? []);
  const [form, setForm] = useState({ kind: 'used', memo: '', amount: '' });
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ memo: '', amount: '' });

  useEffect(()=>{
    // 1. 해당 여행(trip_id)에 맞는 예산 내역 데이터 가져오기
    const loadedItems = sampleBudgets[trip?.trip_id] ?? [];
    
    // 2. 상태(State)에 반영하여 화면을 리렌더링
    setItems(loadedItems);
    
    // 3. 폼 입력값 초기화 및 에러 메시지 삭제
    setForm({ kind: 'b_used', memo: '', amount: '' });
    setError('');
    setEditId(null);
  }, [trip?.trip_id]); // <- 여행 ID가 바뀌거나 페이지가 처음 로드될 때 실행됩니다.

  },[form])

  if (!canEdit) return <EmptyState icon="🔒" title="멤버만 볼 수 있어요" description="예산 가계부는 이 여행의 멤버에게만 보여요." />;



  const sum = (k) => items.filter((i) => i.kind === k).reduce((s, i) => s + i.amount, 0);
  const total = sum('budget') + sum('add');
  const used = sum('used');
  const remain = total - used;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;



  const add = (e) => {
    e.preventDefault();
    const amount = Number(form.amount);
    if (!form.memo.trim()) return setError('내용을 입력해 주세요.');
    if (!amount || amount <= 0) return setError('금액은 1원 이상으로 입력해 주세요.');
    setItems((l) => [...l, { b_id: Date.now(), kind: form.kind, memo: form.memo.trim(), amount, date: new Date().toISOString().slice(0, 10) }]);
    setForm((f) => ({ ...f, memo: '', amount: '' })); setError('');
  };


  const save = () => {
    const amount = Number(draft.amount);
    if (draft.memo.trim() && amount > 0) setItems((l) => l.map((i) => (i.b_id === editId ? { ...i, memo: draft.memo.trim(), amount } : i)));
    setEditId(null);
  };




  return (
    <div className="budget">
      <div className="budget-summary">
        <div className="card"><span>총 예산</span><b>{won(total)}</b><small>예산 {won(sum('b_budget'))} + 추가 {won(sum('b_add'))}</small></div>
        <div className="card"><span>지출</span><b>{won(used)}</b><small>{items.filter((i) => i.kind === 'b_used').length}건</small></div>
        <div className={`card${remain < 0 ? ' over' : ''}`}><span>잔액</span><b>{won(remain)}</b><small>{remain < 0 ? '예산을 초과했어요' : `${100 - pct}% 남음`}</small></div>
      </div>
      <div className={`budget-bar${remain < 0 ? ' over' : ''}`} role="img" aria-label={`예산의 ${pct}% 사용`}><i style={{ width: `${pct}%` }} /></div>




      <form className="budget-form" onSubmit={add}>
        <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value })} aria-label="구분">
          {Object.entries(KINDS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <input value={form.memo} onChange={(e) => setForm({ ...form, memo: e.target.value })} placeholder="내용 (예: 숙소, 교통비)" aria-label="내용" />
        <input type="number" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="금액(원)" aria-label="금액" />
        <button type="submit" className="btn btn--primary">추가</button>
      </form>
      {error && <p className="form-error" role="alert">{error}</p>}

      {items.length === 0 ? (
        <EmptyState icon="💰" title="아직 내역이 없어요" description="예산을 먼저 정하고 쓴 돈을 기록해 보세요." />
      ) : (
        <ul className="card budget-list">
          {items.map((i) => (
            <li key={i.b_id}>
              <span className={`kind kind--${i.kind}`}>{KINDS[i.kind]}</span>
              {editId === i.b_id ? (
                <div className="budget-edit">
                  <input value={draft.memo} onChange={(e) => setDraft({ ...draft, memo: e.target.value })} aria-label="내용 수정" />
                  <input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: e.target.value })} aria-label="금액 수정" />
                  <button type="button" className="btn btn--primary btn--small" onClick={save}>저장</button>
                  <button type="button" className="btn btn--small" onClick={() => setEditId(null)}>취소</button>
                </div>
              ) : (
                <>
                  <span className="budget-list__memo">{i.memo}<small>{i.date}</small></span>
                  <b className={i.kind === 'used' ? 'minus' : 'plus'}>{i.kind === 'used' ? '-' : '+'}{won(i.amount)}</b>
                  <span className="budget-list__tools">
                    <button type="button" className="btn btn--text" onClick={() => { setEditId(i.b_id); setDraft({ memo: i.memo, amount: String(i.amount) }); }}>수정</button>
                    <button type="button" className="btn btn--text" onClick={() => setItems((l) => l.filter((x) => x.b_id !== i.b_id))}>삭제</button>
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
