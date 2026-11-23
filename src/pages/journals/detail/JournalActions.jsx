// [여행기 상세] 작성자에게만 보이는 버튼: 보기 상태(수정·삭제) / 수정 상태(저장·취소).
export default function JournalActions({ creating, editing, busy, onStartEdit, onRemove, onSave, onCancel }) {
  if (editing) {
    return (
      <div className="jd__actions">
        <button type="button" className="btn btn--primary" onClick={onSave} disabled={busy}>{creating ? '여행기 등록' : '저장'}</button>
        <button type="button" className="btn" onClick={onCancel} disabled={busy}>취소</button>
      </div>
    );
  }
  return (
    <div className="jd__actions">
      <button type="button" className="btn" onClick={onStartEdit}>여행기 수정</button>
      <button type="button" className="btn btn--danger" onClick={onRemove} disabled={busy}>삭제</button>
    </div>
  );
}
