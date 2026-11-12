// [로그인] 폼 제출 공통 처리: 중복 클릭 막기(busy) + 실패 메시지(error) 보관.
// action 안에서 Error 를 던지면 그 메시지가 error 로 화면에 나옵니다. (입력 검사 실패도 같은 방식)
import { useState } from 'react';

export default function useSubmit(action) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, handleSubmit };
}
