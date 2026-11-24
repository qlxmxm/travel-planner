// [여행기] "여행기 쓰기" 팝업: 여행기를 새로 쓸 수 있는 내 여행 목록
// 조건: 내가 방장/멤버이고, 기간이 끝났거나 완료 처리됐고, 내가 아직 여행기를 쓰지 않은 여행
import { useState } from 'react';
import { journalApi } from '../../../api/journalApi.js';
import { planApi } from '../../../api/planApi.js';
import { isEnded } from '../../trips/tripUtils.js';

const isMine = (trip, userId) => trip.owner_id === userId || trip.member_ids.includes(userId);

// 내가 이미 여행기를 쓴 여행 번호들
function writtenTripIds(journals, userId) {
  return new Set(
    journals
      .filter((journal) => Number(journal.u_id) === Number(userId) && journal.p_id != null)
      .map((journal) => Number(journal.p_id)),
  );
}

export function useWritableTrips(userId) {
  const [open, setOpen] = useState(false);
  const [trips, setTrips] = useState([]);
  const [state, setState] = useState({ loading: false, error: '' });

  const openPicker = async () => {
    setOpen(true);
    setState({ loading: true, error: '' });
    try {
      const [myTrips, journals] = await Promise.all([planApi.listMine(userId), journalApi.getList()]);
      const written = writtenTripIds(journals, userId);
      setTrips(
        myTrips
          .filter((trip) => isMine(trip, userId))
          .filter((trip) => trip.completed || isEnded(trip))
          .filter((trip) => !written.has(Number(trip.trip_id))),
      );
      setState({ loading: false, error: '' });
    } catch (err) {
      setState({ loading: false, error: err.message });
    }
  };

  return { open, trips, loading: state.loading, error: state.error, openPicker, closePicker: () => setOpen(false) };
}
