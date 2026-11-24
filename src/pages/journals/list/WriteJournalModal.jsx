// [여행기] "여행기 쓰기" 팝업: 여행기로 만들 (끝난) 여행 고르기
import Modal from '../../../components/common/Modal.jsx';

export default function WriteJournalModal({ open, loading, error, trips, onPick, onClose }) {
  return (
    <Modal open={open} title="여행기 쓰기" onClose={onClose} width={440}>
      {loading ? (
        <p className="list-count" role="status">불러오는 중…</p>
      ) : error ? (
        <p className="form-error" role="alert">{error}</p>
      ) : trips.length === 0 ? (
        <p style={{ marginBottom: 8 }}>새로 여행기를 쓸 수 있는 여행이 없어요.<br />여행 기간이 끝났고 아직 여행기를 쓰지 않은 여행이 있으면 여기에 나타나요.</p>
      ) : (
        <>
          <p style={{ marginBottom: 14 }}>여행기로 만들 여행을 골라 주세요.</p>
          <ul className="write-pick">
            {trips.map((trip) => (
              <li key={trip.trip_id}>
                <button type="button" className="btn" onClick={() => onPick(trip)}>
                  <b>{trip.title}</b>
                  <span>{trip.start_date} ~ {trip.end_date}</span>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="form-actions" style={{ marginTop: 16 }}>
        <button type="button" className="btn" onClick={onClose}>닫기</button>
      </div>
    </Modal>
  );
}
