// [여행계획] 멤버 탭(멤버용)의 데이터 처리: 멤버·참여 요청·초대 코드 불러오기, 승인/거절/역할 변경/내보내기, 새 초대 코드
import { useCallback, useEffect, useState } from 'react';
import { memberApi } from '../../../api/memberApi.js';

const randomPart = () => Math.random().toString(36).slice(2, 6).toUpperCase().padEnd(4, 'X');
const newInviteCode = () => `${randomPart()}-${randomPart()}`; // 예: 7K2P-Q9XD (영문·숫자만)

export function useMembers(trip, owner, reloadTrip) {
  const tripId = trip.trip_id;
  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      // 초대 코드는 방장만 조회할 수 있어서(서버 규칙) 방장일 때만 불러옵니다.
      const [m, i, r] = await Promise.all([memberApi.listMembers(tripId), owner ? memberApi.latestInvite(tripId) : null, memberApi.listJoinRequests(tripId)]);
      setMembers(m); setInvite(i); setRequests(r); setError('');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  }, [tripId, owner]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  // 서버 호출 → 목록·여행 정보를 다시 불러옵니다.
  const run = async (action) => {
    try { await action(); await load(); reloadTrip?.(); setError(''); }
    catch (err) { setError(err.message); }
  };

  const approveRequest = (jrId) => run(() => memberApi.approveJoinRequest(tripId, jrId));
  const rejectRequest = (jrId) => run(() => memberApi.removeJoinRequest(tripId, jrId));
  const setRole = (pmId, role) => run(() => memberApi.setMemberRole(tripId, pmId, role));
  const removeMember = (pmId) => run(() => memberApi.removeMember(tripId, pmId));
  const makeInvite = async () => {
    try { setInvite(await memberApi.createInvite(tripId, newInviteCode())); setError(''); }
    catch (err) { setError(err.message); }
  };

  return { members, requests, invite, loading, error, approveRequest, rejectRequest, setRole, removeMember, makeInvite };
}
