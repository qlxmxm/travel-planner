// [공통] 팝업창. open 이 true 일 때만 보임. Esc 키/바깥 클릭으로 닫힘.
import { useEffect } from 'react';

export default function Modal({ open, title, onClose, children, width = 520 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} style={{ maxWidth: width }}>
        <div className="modal__head"><h2>{title}</h2><button type="button" className="chat__close" onClick={onClose} aria-label="닫기">✕</button></div>
        {children}
      </div>
    </div>
  );
}
