// [여행기] 여행기 삭제 확인 팝업
import Modal from '../../../components/common/Modal.jsx';

export default function JournalDeleteModal({ journal, deleting, onCancel, onConfirm }) {
  return (
    <Modal open={!!journal} title="여행기 삭제" onClose={() => { if (!deleting) onCancel(); }} width={400}>
      <p style={{ marginBottom: 20 }}>
        “{journal?.j_title}” 여행기를 삭제할까요?
        <br />
        댓글도 함께 사라져요.
      </p>
      <div className="form-actions">
        <button type="button" className="btn" disabled={deleting} onClick={onCancel}>취소</button>
        <button type="button" className="btn btn--danger" disabled={deleting} onClick={onConfirm}>
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      </div>
    </Modal>
  );
}
