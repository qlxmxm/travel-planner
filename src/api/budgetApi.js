// [여행계획] 예산 · 지출의 서버 호출.
// 화면 항목: { id, kind: 'budget'|'add'|'used', memo, amount, date, ref }
//  budget → budgets.b_budget, add → budgets.b_add, used → expenses(e_content, e_amount)
import { request } from './client.js';
import { planPath } from './planPaths.js';
import { dateOnly, toLocalIso } from '../utils/date.js';

export const budgetApi = {
  async listItems(planId) {
    const budgets = await request(`${planPath(planId)}/budgets`);
    const items = [];
    for (const b of budgets) {
      const date = dateOnly(b.b_date);
      if (b.b_budget > 0) items.push({ id: `b${b.b_id}`, kind: 'budget', memo: '예산', amount: b.b_budget, date, ref: { b_id: b.b_id } });
      if ((b.b_add ?? 0) > 0) items.push({ id: `a${b.b_id}`, kind: 'add', memo: '추가 예산', amount: b.b_add, date, ref: { b_id: b.b_id } });
      const exps = await request(`${planPath(planId)}/budgets/${b.b_id}/expenses`);
      for (const e of exps) items.push({ id: `e${e.e_id}`, kind: 'used', memo: e.e_content, amount: e.e_amount, date: dateOnly(e.e_time), ref: { b_id: b.b_id, e_id: e.e_id } });
    }
    return { items, budgets };
  },
  async addItem(planId, budgets, { kind, memo, amount }) {
    if (kind === 'budget') return request(`${planPath(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: amount } });
    if (kind === 'add') return request(`${planPath(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: 0, b_add: amount } });
    // 지출은 예산 행에 붙는다. 예산 행이 하나도 없으면 0원짜리 예산 행을 먼저 만든다.
    const parent = budgets[0] ?? (await request(`${planPath(planId)}/budgets`, { method: 'POST', body: { p_id: planId, b_budget: 0 } }));
    return request(`${planPath(planId)}/budgets/${parent.b_id}/expenses`, { method: 'POST', body: { b_id: parent.b_id, e_content: memo, e_amount: amount, e_time: toLocalIso(new Date()) } });
  },
  updateItem(planId, item, { memo, amount }) {
    if (item.kind === 'budget') return request(`${planPath(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: { b_budget: amount } });
    if (item.kind === 'add') return request(`${planPath(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: { b_add: amount } });
    return request(`${planPath(planId)}/budgets/${item.ref.b_id}/expenses/${item.ref.e_id}`, { method: 'PUT', body: { e_content: memo, e_amount: amount } });
  },
  // 삭제 = 0원으로 만들기. 예산/추가예산은 한 행에 같이 들어 있어서 해당 칸만 0으로 비운다.
  async deleteItem(planId, item) {
    if (item.kind === 'used') return request(`${planPath(planId)}/budgets/${item.ref.b_id}/expenses/${item.ref.e_id}`, { method: 'DELETE' });
    return request(`${planPath(planId)}/budgets/${item.ref.b_id}`, { method: 'PUT', body: item.kind === 'budget' ? { b_budget: 0 } : { b_add: 0 } });
  },
};
