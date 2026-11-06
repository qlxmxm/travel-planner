// [여행계획] 일정 하나에 대한 대화창 (카카오톡처럼 말풍선).
//  - 맨 위 제목: 연필(✎)을 눌러 수정 → 일정 목록의 글도 같이 바뀜
//  - 내가 쓴 말풍선에만 수정/삭제 버튼이 보임 (본인 글만 가능)
// TODO: 서버 저장 API 연결, 권한 체크는 아서와 함께
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/common/Avatar.jsx';

export default function PlanChat({ plan, onChange, onClose }) {
  const { user } = useAuth();
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [editId, setEditId] = useState(null);
  const [editDraft, setEditDraft] = useState('');
  const [text, setText] = useState('');

  const saveTitle = () => { if (titleDraft.trim()) onChange((p) => ({ ...p, title: titleDraft.trim() })); setEditingTitle(false); };
  const send = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    onChange((p) => ({ ...p, comments: [...p.comments, { id: Date.now(), author_id: user.user_id, author_name: user.user_name, text: text.trim(), time: '방금' }] }));
    setText('');
  };
  const saveEdit = () => { if (editDraft.trim()) onChange((p) => ({ ...p, comments: p.comments.map((c) => (c.id === editId ? { ...c, text: editDraft.trim() } : c)) })); setEditId(null); };
  const remove = (id) => onChange((p) => ({ ...p, comments: p.comments.filter((c) => c.id !== id) }));

  return (
    <aside className="card chat" aria-label="일정 대화">
      <div className="chat__head">
        <div className="chat__meta"><span>{plan.time}</span><span>·</span><span>{plan.place}</span>
          <button type="button" className="chat__close" onClick={onClose} aria-label="대화창 닫기">✕</button></div>
        {editingTitle ? (
          <div className="chat__edit">
            <input value={titleDraft} onChange={(e) => setTitleDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveTitle()} autoFocus aria-label="제목 수정" />
            <button type="button" className="btn btn--primary btn--small" onClick={saveTitle}>저장</button>
            <button type="button" className="btn btn--small" onClick={() => setEditingTitle(false)}>취소</button>
          </div>
        ) : (
          <h2 className="chat__title">{plan.title}
            <button type="button" className="chat__pencil" onClick={() => { setTitleDraft(plan.title); setEditingTitle(true); }} aria-label="제목 수정">✎</button>
          </h2>
        )}
      </div>
      <div className="chat__list">
        {plan.comments.length === 0 && <p className="chat__empty">아직 대화가 없어요.<br />첫 의견을 남겨보세요.</p>}
        {plan.comments.map((c) => {
          const mine = c.author_id === user.user_id;
          return (
            <div key={c.id} className={`msg${mine ? ' msg--mine' : ''}`}>
              {!mine && <Avatar name={c.author_name} />}
              <div>
                {!mine && <div className="msg__name">{c.author_name}</div>}
                {editId === c.id ? (
                  <div className="chat__edit">
                    <input value={editDraft} onChange={(e) => setEditDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveEdit()} autoFocus />
                    <button type="button" className="btn btn--primary btn--small" onClick={saveEdit}>저장</button>
                    <button type="button" className="btn btn--small" onClick={() => setEditId(null)}>취소</button>
                  </div>
                ) : (
                  <div className="msg__row"><div className="msg__bubble">{c.text}</div><span className="msg__time">{c.time}</span></div>
                )}
                {mine && editId !== c.id && (
                  <div className="msg__tools">
                    <button type="button" className="btn btn--text" onClick={() => { setEditId(c.id); setEditDraft(c.text); }}>수정</button>
                    <button type="button" className="btn btn--text" onClick={() => remove(c.id)}>삭제</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <form className="chat__form" onSubmit={send}>
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="메시지를 입력하세요" aria-label="메시지 입력" />
        <button className="btn btn--primary" type="submit">보내기</button>
      </form>
    </aside>
  );
}
