// [로그인] 비밀번호 세기 막대 (4자 미만 약함 / 8자 이상+영문·숫자 섞이면 강함)
const MIN_LENGTH = 4;
const GOOD_LENGTH = 8;
const LABELS = ['너무 짧아요', '사용할 수 있어요', '좋아요', '아주 좋아요'];

// 0(너무 짧음) ~ 3(아주 좋음)
export function getPasswordScore(password) {
  const hasLetterAndDigit = /[a-zA-Z]/.test(password) && /\d/.test(password);
  if (password.length >= GOOD_LENGTH && hasLetterAndDigit) return 3;
  if (password.length >= GOOD_LENGTH) return 2;
  if (password.length >= MIN_LENGTH) return 1;
  return 0;
}

export default function PasswordStrength({ value }) {
  if (!value) return null;
  const score = getPasswordScore(value);
  return (
    <div className={`strength strength--${score}`} aria-live="polite">
      <div className="strength__bar"><i /><i /><i /></div>
      <small>{LABELS[score]}</small>
    </div>
  );
}
