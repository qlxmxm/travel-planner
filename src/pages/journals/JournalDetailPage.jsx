
import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';

import TabNav from '../../components/common/TabNav.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const getPlan = async () => {
      setLoading(true);
      setError(false);
      setPlan(null);

      try {
        // TODO [Axios GET]
        // tripId를 p_id로 사용하여 여행계획 상세 조회
        //
        // FastAPI에서 처리:
        // 1. 인증된 사용자 u_id 확인
        // 2. Plans.u_id와 사용자 u_id 비교
        // 3. 작성자가 아니라면 PlanMembers에서 멤버 여부 확인
        // 4. 작성자 또는 멤버인 경우에만 여행계획 반환
        // 5. 권한이 없으면 403, 계획이 없으면 404 반환
        //
        // Axios 연결 후:
        // const response = await axios.get(...);
        // if (cancelled) return;
        // setPlan(response.data.plan);

      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (!user?.user_id) {
      setPlan(null);
      setError(true);
      setLoading(false);
    } else {
      getPlan();
    }

    return () => {
      cancelled = true;
    };
  }, [tripId, user?.user_id]);

  // 작성자 전용 기능 구분
  const owner =
    plan !== null &&
    Number(plan.u_id) === Number(user?.user_id);

  // 여행 완료 여부
  const completed = plan?.p_status === true;

  if (loading) {
    return <p>여행계획을 불러오는 중입니다.</p>;
  }

  // 모든 접근 오류를 하나의 화면으로 처리
  if (error || !plan) {
    return (
      <EmptyState
        icon="🔒"
        title="여행계획에 접근할 수 없습니다."
        description="해당 여행계획의 작성자 또는 초대된 멤버만 조회할 수 있습니다."
      >
        <Link to="/trips" className="btn btn--primary">
          여행계획 목록으로
        </Link>
      </EmptyState>
    );
  }

  return (
    <>
      <header className="trip-head">
        <h1>
          {plan.loc}
          <br />
          <em>{plan.p_title}</em>
        </h1>

        <p>
          {plan.p_start?.slice(0, 10)}
          {' ~ '}
          {plan.p_end?.slice(0, 10)}
        </p>

        {completed ? (
          <div className="trip-head__journal">
            <Link
              to={`/journals/new/from/${plan.p_id}`}
              className="btn btn--primary"
            >
              여행기 작성
            </Link>

            <small>
              완료된 여행계획을 바탕으로 여행기를 작성해 보세요.
            </small>
          </div>
        ) : (
          <p className="trip-head__hint">
            여행이 완료되면 여행기를 작성할 수 있어요.
          </p>
        )}
      </header>

      <TabNav
        tripId={tripId}
        isMember={true}
      />

      <Outlet
        context={{
          trip: plan,
          canEdit: true,
          owner,
        }}
      />
    </>
  );
}
