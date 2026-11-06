// [로그인] 로그인 화면. TODO: 입력값 state, useAuth().login() 호출, 성공 시 /trips 이동, 에러 표시
import { Link } from 'react-router-dom';

export default function LoginPage() {
  return (
    <div className="card form-card">
      <h1>로그인</h1>
      <form onSubmit={(e) => e.preventDefault()}>
        <label className="field"><span>아이디</span><input name="user_id" autoComplete="username" /></label>
        <label className="field"><span>비밀번호</span><input name="password" type="password" autoComplete="current-password" /></label>
        <button className="btn btn--primary btn--block" type="submit">로그인</button>
      </form>
      <p className="form-card__foot">계정이 없나요? <Link to="/register">회원가입</Link></p>
    </div>
  );
}
