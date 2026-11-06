// [로그인] 회원가입 화면. TODO: 입력 검증, useAuth().register() 호출
import { Link } from 'react-router-dom';

export default function RegisterPage() {
  return (
    <div className="card form-card">
      <h1>회원가입</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <label className="field"><span>아이디</span><input name="user_id" autoComplete="username" /></label>
        <label className="field"><span>이름(닉네임)</span><input name="user_name" /></label>
        <label className="field"><span>비밀번호</span><input name="password" type="password" autoComplete="new-password" /></label>
        <button className="btn btn--primary btn--block" type="submit">가입하기</button>
      </form>
      <p className="form-card__foot">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </div>
  );
}
