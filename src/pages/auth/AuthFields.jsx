// [로그인] 로그인·회원가입 폼 입력칸: 아이콘 입력칸, 비밀번호 보기/숨기기 입력칸
import { useState } from 'react';
import { icons } from './authIcons.jsx';

// 앞에 아이콘이 붙은 입력칸
export function IconField({ icon, label, hint, children }) {
  return (
    <label className="afield">
      <span className="afield__label">{label}</span>
      <span className="afield__box">
        <span className="afield__icon">{icon}</span>
        {children}
      </span>
      {hint && <small className="afield__hint">{hint}</small>}
    </label>
  );
}

// 눈 모양 버튼으로 비밀번호 보기/숨기기
export function PasswordInput(props) {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <>
      <input {...props} type={isVisible ? 'text' : 'password'} />
      <button type="button" className="afield__eye" onClick={() => setIsVisible((visible) => !visible)}
        aria-label={isVisible ? '비밀번호 숨기기' : '비밀번호 보기'} tabIndex={-1}>
        {isVisible ? icons.eyeOff : icons.eye}
      </button>
    </>
  );
}
