// [공통] 버튼 한 번 누르면 하는 서버 요청의 공통 처리: 중복 클릭 막기(busy) + 실패 메시지(error) 보관.
// 사용: const { busy, error, setError, run } = useBusyAction();
//       run(async () => { await api.save(); }, '저장하지 못했습니다.');   // 실패하면 error 에 메시지가 담겨요
import { useState } from 'react';

export default function useBusyAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function run(task, failMessage) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await task();
    } catch (err) {
      setError(err.message || failMessage);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, setError, run };
}
