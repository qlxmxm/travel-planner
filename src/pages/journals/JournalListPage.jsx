// [여행기] 여행기 목록 화면 (조립만 담당: 데이터는 list/ 의 훅, 화면 조각은 list/ 의 컴포넌트)
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useJournalList } from './list/useJournalList.js';
import { useWritableTrips } from './list/useWritableTrips.js';
import JournalFilterBar from './list/JournalFilterBar.jsx';
import JournalCard from './list/JournalCard.jsx';
import JournalDeleteModal from './list/JournalDeleteModal.jsx';
import WriteJournalModal from './list/WriteJournalModal.jsx';

export default function JournalListPage() {
  const { user, isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const journals = useJournalList();
  const writable = useWritableTrips(user?.user_id);

  const handleWriteClick = () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    writable.openPicker();
  };
  const writeFromTrip = (trip) => navigate(`/journals/new/from/${trip.trip_id}`);
  const isMyJournal = (journal) => user != null && Number(journal.u_id) === Number(user.user_id);

  const hasSearch = !!journals.query;

  return (
    <>
      <PageHeader
        title="여행기"
        description="다녀온 사람들의 사진과 이야기를 만나보세요."
        actions={<button type="button" className="btn btn--primary" onClick={handleWriteClick}>여행기 쓰기</button>}
      />

      <JournalFilterBar
        allTags={journals.allTags}
        tag={journals.tag}
        onTagChange={journals.setTag}
        query={journals.query}
        onQueryChange={journals.setQuery}
      />

      {journals.error && <p className="form-error" role="alert">{journals.error}</p>}

      {journals.loading ? (
        <p>여행기 목록을 불러오는 중입니다.</p>
      ) : (
        <>
          {!journals.error && journals.shown.length === 0 && (
            <EmptyState
              icon="🔍"
              title={hasSearch ? '검색 결과가 없어요' : '등록된 여행기가 없어요'}
              description={hasSearch ? '다른 검색어를 입력해 보세요.' : '완료된 여행계획에서 첫 여행기를 작성해 보세요.'}
            />
          )}
          <div className="journal-grid">
            {journals.shown.map((journal) => (
              <JournalCard
                key={journal.j_id}
                journal={journal}
                activeTag={journals.tag}
                isOwner={isMyJournal(journal)}
                onDelete={journals.setRemoving}
              />
            ))}
          </div>
        </>
      )}

      <JournalDeleteModal
        journal={journals.removing}
        deleting={journals.deleting}
        onCancel={() => journals.setRemoving(null)}
        onConfirm={journals.removeJournal}
      />

      <WriteJournalModal
        open={writable.open}
        loading={writable.loading}
        error={writable.error}
        trips={writable.trips}
        onPick={writeFromTrip}
        onClose={writable.closePicker}
      />
    </>
  );
}
