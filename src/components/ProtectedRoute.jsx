// [로그인] 로그인한 사람만 들어갈 수 있는 화면 가드 (지금은 항상 통과)
// TODO(로그인): if (!isLoggedIn) return <Navigate to="/login" replace />;
import { Outlet } from 'react-router-dom';

export default function ProtectedRoute() {
  return <Outlet />;
}
