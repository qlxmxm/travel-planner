// [여행계획] 일정 삭제 확인 팝업
import Modal from '../../../components/common/Modal.jsx';

export default function DeletePlanModal({ plan, onCancel, onConfirm }) {
  return (
    <Modal open={!!plan} title="일정 삭제" onClose={onCancel} width={400}>
      <p style={{ marginBottom: 20 }}>“{plan?.place}” 일정을 삭제할까요?<br />대화 내용도 함께 사라져요.</p>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onCancel}>취소</button>
        <button type="button" className="btn btn--danger" onClick={onConfirm}>삭제</button>
      </div>
    </Modal>
  );
}
