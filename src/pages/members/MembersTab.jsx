
import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Avatar from '../../components/common/Avatar.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { request } from '../../api/client.js';

export default function MembersTab() {
  const { trip, planMembers, canEdit, owner } = useOutletContext();
  const planId = trip.p_id;
  const members = [
  {
    u_id: trip.owner_id,
    role: 'owner',
  },
  ...planMembers.filter(
    (m) => Number(m.u_id) !== Number(trip.owner_id)
  ),
];

  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!owner) return;

    let cancelled = false;

    async function loadInvites() {
      setLoading(true);
      setError('');

      try {
        const data = await request(`/plans/${planId}/invites`);

        if (!cancelled) {
          setInvites(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || '초대 코드를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInvites();

    return () => {
      cancelled = true;
    };
  }, [planId, owner]);

  const createInvite = async () => {
    if (creating) return;

    setCreating(true);
    setError('');

    try {
      const invite = await request(`/plans/${planId}/invites`, {
        method: 'POST',
      });

      setInvites((prev) => [invite, ...prev]);
    } catch (err) {
      setError(err.message || '초대 코드 발급에 실패했습니다.');
    } finally {
      setCreating(false);
    }
  };

  const copyInvite = async (invite) => {
    try {
      await navigator.clipboard.writeText(invite.i_code);
      setCopiedId(invite.i_id);
    } catch {
      setError('초대 코드 복사에 실패했습니다.');
    }
  };

  const getInviteStatus = (invite) => {
    if (invite.i_used) return '사용 완료';

    // 백엔드에서 UTC 기준으로 저장한다는 전제
    const expiresAt = new Date(`${invite.i_expire.replace(' ', 'T').replace(/Z$/, '')}Z`);

    if (expiresAt <= new Date()) return '기간 만료';
    return '사용 가능';
  };

  if (!canEdit) {
    return (
      <EmptyState
        icon="🔒"
        title="멤버만 볼 수 있어요"
        description="멤버 정보는 여행 멤버에게만 보여요."
      />
    );
  }

  return (
    <>
      <section className="card invite-box">
        <div>
          <h3>초대 코드</h3>
          <p>코드 하나당 한 명만 참여할 수 있어요.</p>
        </div>

        {owner && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={createInvite}
            disabled={creating}
          >
            {creating ? '발급 중...' : '새 코드 만들기'}
          </button>
        )}
      </section>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      {owner && (
        <section className="card" style={{ padding: 20, marginTop: 16 }}>
          <h3>발급된 초대 코드</h3>

          {loading ? (
            <p>초대 코드를 불러오는 중입니다.</p>
          ) : invites.length === 0 ? (
            <p>아직 발급된 초대 코드가 없습니다.</p>
          ) : (
            <ul>
              {invites.map((invite) => {
                const status = getInviteStatus(invite);
                const available = status === '사용 가능';

                return (
                  <li
                    key={invite.i_id}
                    style={{
                      padding: '14px 0',
                      borderBottom: '1px solid var(--line)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: 12,
                    }}
                  >
                    <div>
                      <strong>{invite.i_code}</strong>
                      <p>{status}</p>
                      <small>
                        만료일: {invite.i_expire.slice(0, 16)} (UTC)
                      </small>
                    </div>

                    <button
                      type="button"
                      className="btn"
                      disabled={!available}
                      onClick={() => copyInvite(invite)}
                    >
                      {copiedId === invite.i_id ? '복사됨' : '복사'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {!owner && (
        <p>초대 코드는 여행 방장만 발급할 수 있습니다.</p>
      )}

      
  <ul className="card" style={{ marginTop: 16 }}>
    {members.map((m) => {
      const isOwner = Number(m.u_id) === Number(trip.owner_id);
      const displayName = `사용자 ${m.u_id}`;

      return (
        <li
          key={m.u_id}
          style={{
            padding: '16px 22px',
            borderBottom: '1px solid var(--line)',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Avatar name={displayName} />
          <b>{displayName}</b>

          <span style={{ marginLeft: 'auto', color: 'var(--ink-sub)' }}>
            {isOwner ? '방장' : '참여자'}
          </span>

          {owner && !isOwner && (
            <button
              type="button"
              className="btn btn--text"
              disabled
              title="멤버 내보내기 API 연결 예정"
            >
              내보내기
            </button>
          )}
        </li>
      );
    })}
  </ul>

    </>
  );
}
