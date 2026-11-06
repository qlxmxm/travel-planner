// [여행기] 여행기 상세 (트리플 여행기 스타일): Day → 시간 알약 + 장소 + 별점 + 글 + 사진, 맨 아래 댓글
// 작성자 본인에게만 여행기 수정/삭제 버튼이 보입니다.
// 댓글은 화면 안에서만 동작합니다 (작성/수정/삭제). 내 댓글(홍길동)에만 수정·삭제 버튼이 보여요.
// TODO: GET /journals/{id}, 댓글 API 연결, 좋아요, 권한 체크(본인 댓글만)
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { sampleJournals } from '../../data/sampleJournals.js';
import { useAuth } from '../../context/AuthContext.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Modal from '../../components/common/Modal.jsx';
import Tags from '../../components/common/Tags.jsx';

const MARKERS = ['var(--m1)', 'var(--m3)', 'var(--m2)', 'var(--m4)', 'var(--m5)'];

export default function JournalDetailPage() {
  const { journalId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [confirmDel, setConfirmDel] = useState(false);
  const j = sampleJournals.find((x) => String(x.journal_id) === journalId) || sampleJournals[0];
  const [comments, setComments] = useState(j.comments);
  const [text, setText] = useState('');
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState('');

  const add = (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setComments((cs) => [...cs, { id: Date.now(), author_id: user.user_id, author_name: user.user_name, text: text.trim(), date: '방금' }]);
    setText('');
  };
  const save = () => { if (draft.trim()) setComments((cs) => cs.map((c) => (c.id === editId ? { ...c, text: draft.trim() } : c))); setEditId(null); };

  return (
    <article className="jr">
      <header className="jr__head">
        <h1>{j.title}</h1>
        <p>{j.author} · {j.date} · ♡ {j.likes} · 조회 {j.views}</p>
        <Tags tags={j.hashtags} />
        {j.author_id === user.user_id && (
          <div className="jr__owner">
            <Link to={`/journals/${j.journal_id}/edit`} className="btn btn--small">여행기 수정</Link>
            <button type="button" className="btn btn--small btn--danger-text" onClick={() => setConfirmDel(true)}>삭제</button>
          </div>
        )}
      </header>

      {j.days.map((d) => (
        <section key={d.day} className="jr-day">
          <h2><span>Day {d.day}</span><time>{d.date}</time></h2>
          {d.intro && <p className="jr-day__intro">{d.intro}</p>}
          {d.items.map((it, i) => (
            <div key={i} className="jr-item">
              <div className="jr-item__head">
                {it.kind === 'flight'
                  ? <span className="jr-time jr-time--flight" aria-hidden="true">✈</span>
                  : <span className="jr-time" style={{ background: MARKERS[i % MARKERS.length] }}>{it.time}</span>}
                <b>{it.name}</b>
              </div>
              {it.kind === 'place' && (
                <div className="jr-item__body">
                  {it.rating > 0 && <div className="jr-stars" aria-label={`별점 ${it.rating}점`}>{'★'.repeat(it.rating)}</div>}
                  {it.text.map((t, k) => <p key={k}>{t}</p>)}
                  {it.photo && <img src={it.photo} alt="" />}
                </div>
              )}
            </div>
          ))}
        </section>
      ))}

      <section className="jr-comments">
        <h2>댓글 {comments.length}</h2>
        <form className="jr-comments__form" onSubmit={add}>
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="댓글을 남겨보세요" aria-label="댓글 입력" />
          <button type="submit" className="btn btn--primary">등록</button>
        </form>
        <ul>
          {comments.map((c) => (
            <li key={c.id}>
              <Avatar name={c.author_name} />
              <div className="jr-comments__body">
                <div><b>{c.author_name}</b><span>{c.date}</span></div>
                {editId === c.id ? (
                  <div className="chat__edit">
                    <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && save()} autoFocus />
                    <button type="button" className="btn btn--primary btn--small" onClick={save}>저장</button>
                    <button type="button" className="btn btn--small" onClick={() => setEditId(null)}>취소</button>
                  </div>
                ) : <p>{c.text}</p>}
                {c.author_id === user.user_id && editId !== c.id && (
                  <div>
                    <button type="button" className="btn btn--text" onClick={() => { setEditId(c.id); setDraft(c.text); }}>수정</button>
                    <button type="button" className="btn btn--text" onClick={() => setComments((cs) => cs.filter((x) => x.id !== c.id))}>삭제</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <Modal open={confirmDel} title="여행기 삭제" onClose={() => setConfirmDel(false)} width={400}>
        <p style={{ marginBottom: 20 }}>이 여행기를 삭제할까요?<br />댓글도 함께 사라져요.</p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setConfirmDel(false)}>취소</button>
          <button type="button" className="btn btn--danger" onClick={() => navigate('/journals')}>삭제</button>
        </div>
      </Modal>
    </article>
  );
}
