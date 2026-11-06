// [공통] 스크롤에 반응하는 화면을 만들기 위한 훅 모음. 값이 바뀌면 React가 화면을 다시 그립니다.
import { useEffect, useRef, useState } from 'react';

export const HEADER_H = 64; // tokens.css 의 --header-h 와 같은 값
export const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));

// compute() 의 결과를 스크롤/리사이즈 때마다 다시 계산해서 state 로 돌려줌 (rAF 로 가볍게)
function useScrollValue(compute) {
  const fn = useRef(compute);
  fn.current = compute;
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const update = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(() => setValue(fn.current())); };
    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
  }, []);
  return value;
}

// 페이지를 얼마나 내렸는지 (px)
export const useScrollY = () => useScrollValue(() => window.scrollY);

// 높이가 큰 구역 안에서 sticky 화면이 고정되어 있는 동안의 진행률 0~1
export function useStickyProgress(ref) {
  return useScrollValue(() => {
    const el = ref.current;
    if (!el) return 0;
    const r = el.getBoundingClientRect();
    const range = r.height - (window.innerHeight - HEADER_H);
    return range > 0 ? clamp((HEADER_H - r.top) / range) : 0;
  });
}

// 요소가 화면 아래에서 올라와 자리 잡는 동안의 진행률 0~1
export function useEnterProgress(ref) {
  return useScrollValue(() => {
    const el = ref.current;
    if (!el) return 0;
    return clamp(1 - el.getBoundingClientRect().top / window.innerHeight);
  });
}
