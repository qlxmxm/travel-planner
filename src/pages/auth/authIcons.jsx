// [로그인] 로그인·회원가입 화면에서 쓰는 아이콘 모음
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{children}</svg>
);

export const icons = {
  mail: <Icon><rect x="3" y="5" width="18" height="14" rx="3" /><path d="m4 7 8 6 8-6" /></Icon>,
  lock: <Icon><rect x="4" y="10" width="16" height="10" rx="3" /><path d="M8 10V8a4 4 0 0 1 8 0v2" /></Icon>,
  user: <Icon><circle cx="12" cy="8" r="4" /><path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" /></Icon>,
  eye: <Icon><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" /><circle cx="12" cy="12" r="3" /></Icon>,
  eyeOff: <Icon><path d="M3 3l18 18" /><path d="M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.2 7.7A16 16 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 4-.9" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></Icon>,
  plan: <Icon><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18" /></Icon>,
  wallet: <Icon><path d="M4 7a3 3 0 0 1 3-3h11v4" /><rect x="3" y="7" width="18" height="13" rx="3" /><circle cx="16.5" cy="13.5" r="1.2" /></Icon>,
  book: <Icon><path d="M5 4h10a4 4 0 0 1 4 4v12H9a4 4 0 0 1-4-4V4Z" /><path d="M9 8h6M9 12h6" /></Icon>,
  plane: <Icon><path d="M10.5 13.5 3 11l1.5-1.5 9 .5 4-4a2 2 0 0 1 3 3l-4 4 .5 9L16 20.5l-2.5-7.5-3 3-1-2.5Z" /></Icon>,
};
