// [여행계획] 예산 탭 공통: 구분 이름, 금액 표시, 합계 계산
export const KINDS = { budget: '예산', add: '추가 예산', used: '지출' };
export const won = (n) => `${n.toLocaleString('ko-KR')}원`;

// 내역(items)에서 총 예산·지출·잔액·사용 비율을 계산
export function summarize(items) {
  const sumOf = (kind) => items.filter((i) => i.kind === kind).reduce((s, i) => s + i.amount, 0);
  const budget = sumOf('budget');
  const add = sumOf('add');
  const used = sumOf('used');
  const total = budget + add;
  const remain = total - used;
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  return { budget, add, used, total, remain, pct, usedCount: items.filter((i) => i.kind === 'used').length };
}
