// [공통] 날짜·시간 문자열 도우미. 서버는 '2026-11-22T09:30:00' 같은 문자열로 날짜와 시간을 줍니다.
export const DAY_MS = 24 * 60 * 60 * 1000;

export const pad2 = (n) => String(n).padStart(2, '0');

export const dateOnly = (iso) => (iso ? String(iso).slice(0, 10) : '');            // '2026-11-22T09:30:00' → '2026-11-22'
export const timeOnly = (iso) => String(iso).slice(11, 16);                         // '2026-11-22T09:30:00' → '09:30'
export const dotDate = (iso) => dateOnly(iso).replace(/-/g, '.');                   // '2026-11-22T09:30:00' → '2026.11.22'

// '2026-11-22' → 그날 0시의 시각(밀리초). 날짜끼리 빼서 "며칠 차이"를 구할 때 씁니다.
export const dateToMs = (dateString) => new Date(`${dateString}T00:00:00`).getTime();

// Date → '2026-11-22' / '2026-11-22T09:30:00' (브라우저의 현재 시간대 기준. 서버로 보낼 때 씁니다.)
export const toDateString = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
export const toLocalIso = (date) => `${toDateString(date)}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
