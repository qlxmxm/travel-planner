// [여행계획] 일정 탭의 데이터 처리: 불러오기 / 추가·수정·삭제 / 대화창에서 제목 고치기
import { useEffect, useState } from 'react';
import { scheduleApi } from '../../../api/scheduleApi.js';

// 날짜(day) → 시간(time) 순서로 정렬
const sortPlans = (list) => [...list].sort((a, b) => a.day - b.day || a.time.localeCompare(b.time));

export function useSchedule(trip) {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [day, setDay] = useState(1);   // 지금 보고 있는 날짜 탭

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError('');
    scheduleApi.list(trip)
      .then((list) => { if (cancelled) return; setPlans(list); setDay(list[0]?.day ?? 1); setLoading(false); })
      .catch((err) => { if (!cancelled) { setLoadError(err.message); setLoading(false); } });
    return () => { cancelled = true; };
  }, [trip.trip_id]);

  const days = [...new Set(plans.map((p) => p.day))].sort((a, b) => a - b);
  const dayPlans = plans.filter((p) => p.day === day);

  const updateLocal = (id, fn) => setPlans((all) => all.map((p) => (p.plan_id === id ? fn(p) : p)));

  // editing: 수정할 일정(없으면 새 일정). 성공하면 true
  const savePlan = async (editing, data) => {
    try {
      if (editing) {
        const saved = await scheduleApi.update(trip, editing.plan_id, data);
        setPlans((all) => sortPlans(all.map((p) => (p.plan_id === editing.plan_id ? { ...saved, comments: p.comments } : p))));
      } else {
        const saved = await scheduleApi.create(trip, data);
        setPlans((all) => sortPlans([...all, saved]));
      }
      setDay(data.day); setSaveError('');
      return true;
    } catch (err) { setSaveError(err.message); return false; }
  };

  // 성공하면 true
  const removePlan = async (plan) => {
    try {
      await scheduleApi.remove(trip, plan.plan_id);
      const left = plans.filter((p) => p.plan_id !== plan.plan_id);
      setPlans(left);
      if (!left.some((p) => p.day === day)) setDay(left[0]?.day ?? 1);
      setSaveError('');
      return true;
    } catch (err) { setSaveError(err.message); return false; }
  };

  // 대화창에서 제목을 고치면 서버의 일정(memo)에도 저장하고, 대화(comments)는 화면에만 둡니다.
  const changeFromChat = async (id, fn) => {
    const before = plans.find((p) => p.plan_id === id);
    const after = fn(before);
    updateLocal(id, () => after);
    if (after.title !== before.title) {
      try { await scheduleApi.update(trip, id, after); setSaveError(''); } catch (err) { setSaveError(err.message); updateLocal(id, () => before); }
    }
  };

  return { plans, days, day, setDay, dayPlans, loading, loadError, saveError, savePlan, removePlan, changeFromChat };
}
