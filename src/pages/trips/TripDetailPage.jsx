
import { useEffect, useState } from 'react';
import { Link, Outlet, useParams } from 'react-router-dom';
import TabNav from '../../components/common/TabNav.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { request } from '../../api/client.js';

export default function TripDetailPage() {
  const { tripId } = useParams();
  const { user } = useAuth();

  const [plan, setPlan] = useState(null);
  const [planMembers, setPlanMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      setError('');
      setPlan(null);
      setPlanMembers([]);

      try {
        const [planData, membersData] = await Promise.all([
          request(`/plans/${tripId}`),
          request(`/plans/${tripId}/members`),
        ]);

        if (cancelled) return;

        setPlan(planData);
        setPlanMembers(membersData);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '여행 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPlan();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  if (loading) {
    return <p>여행 정보를 불러오는 중입니다.</p>;
  }

  if (error || !plan) {
    return (
      <EmptyState
        title="여행 정보를 불러올 수 없어요"
        description={error || '여행계획을 찾을 수 없습니다.'}
      >
        <Link to="/trips" className="btn btn--primary">
          여행계획 목록으로
        </Link>
      </EmptyState>
    );
  }

  const userId = Number(user?.user_id);
  const owner = Number(plan.u_id) === userId;

  const member = owner || planMembers.some(
    (m) => Number(m.u_id) === userId
  );

  // TODO: 공개 여행 조회 권한은 백엔드 공개 여부 기능과 연결
  if (!member) {
    return (
      <EmptyState
        icon="🔒"
        title="접근할 수 없는 여행이에요"
        description="여행 멤버만 상세 정보를 볼 수 있습니다."
      >
        <Link to="/trips" className="btn btn--primary">
          여행계획 목록으로
        </Link>
      </EmptyState>
    );
  }

  const startDate = plan.p_start.slice(0, 10);
  const endDate = plan.p_end.slice(0, 10);
  const ended = plan.p_status === true;

  // TODO: 여행 세부 일정 API 연결 후 plans 교체
  const trip = {
    p_id: plan.p_id,
    trip_id: plan.p_id,
    owner_id: plan.u_id,
    title: plan.p_title,
    destination: plan.loc,
    start_date: startDate,
    end_date: endDate,
    members: new Set([
      Number(plan.u_id),
      ...planMembers.map((m) => Number(m.u_id)),
    ]).size,
    member_ids: [
      ...new Set([
        Number(plan.u_id),
        ...planMembers.map((m) => Number(m.u_id)),
      ]),
    ],
    plans: [],
  };

  return (
    <>
      <header className="trip-head">
        <h1>{trip.title}</h1>
        <p>
          {trip.destination} · {trip.start_date} ~ {trip.end_date}
        </p>
        <p>함께하는 친구 {trip.members}명</p>

        {ended ? (
          <div className="trip-head__journal">
            <Link
              to={`/journals/new/from/${trip.p_id}`}
              className="btn btn--primary"
            >
              여행기에 추가
            </Link>
            <small>
              완료된 여행의 일정을 가져와 여행기를 작성해 보세요.
            </small>
          </div>
        ) : (
          <p className="trip-head__hint">
            여행이 완료되면 여행기를 작성할 수 있습니다.
          </p>
        )}
      </header>

      <TabNav tripId={tripId} isMember={member} />

      <Outlet
        context={{
          trip,
          plan,
          planMembers,
          canEdit: member,
          owner,
        }}
      />
    </>
  );
}
