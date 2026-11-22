// [공통] 서버에서 데이터를 가져오는 화면용 훅. 로딩/에러/데이터 상태를 한곳에서 관리합니다.
// 사용: const { data, loading, error, reload } = useAsync(() => api.list(), [의존값]);
import { useCallback, useEffect, useState } from 'react';

export default function useAsync(load, deps = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });

  const run = useCallback(() => {
    let cancelled = false;                       // 화면이 바뀌었거나 조건이 바뀐 뒤 늦게 온 응답은 버립니다
    setState((current) => ({ ...current, loading: true, error: '' }));
    load()
      .then((data) => { if (!cancelled) setState({ data, loading: false, error: '' }); })
      .catch((err) => { if (!cancelled) setState({ data: null, loading: false, error: err.message }); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(run, [run]);
  return { ...state, reload: run };
}
