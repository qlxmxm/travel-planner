// [공통] 없는 주소로 들어왔을 때
import { Link } from 'react-router-dom';
import EmptyState from '../components/common/EmptyState.jsx';

export default function NotFoundPage() {
  return (
    <EmptyState icon="🧭" title="페이지를 찾을 수 없어요" description="주소를 다시 확인해 주세요.">
      <Link to="/" className="btn btn--primary">홈으로</Link>
    </EmptyState>
  );
}
