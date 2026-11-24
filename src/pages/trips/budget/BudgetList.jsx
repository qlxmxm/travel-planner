// [여행계획] 예산 탭: 내역 목록 (편집 권한이 있으면 수정·삭제 가능)
import { useState } from 'react';
import { KINDS, won } from './budgetUtils.js';

export default function BudgetList({ items, canEdit, busy, onSave, onDelete }) {
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({ memo: '', amount: '' });

  const startEdit = (item) => { setEditId(item.id); setDraft({ memo: item.memo, amount: String(item.amount) }); };
  const save = async (item) => { if (await onSave(item, draft)) setEditId(null); };

  return (
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
              {canEdit && <span className="budget-list__tools">
                <button type="button" className="btn btn--text" onClick={() => startEdit(i)}>수정</button>
                <button type="button" className="btn btn--text" disabled={busy} onClick={() => onDelete(i)}>삭제</button>
              </span>}
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
