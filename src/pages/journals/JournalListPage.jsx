// [여행기] 여행기 목록 (트리플 여행기 스타일). 내가 쓴 여행기에만 삭제 버튼이 보입니다. (지금은 화면 안에서만 삭제됨)
// 검색(제목·소개·작성자·해시태그)과 해시태그(맛집여행/관광/스포츠여행 등) 필터가 있습니다.
// TODO: GET /journals?q=&hashtag=, DELETE /journals/{id} 연결, 정렬, 권한 체크(작성자만 삭제)
import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';
import Avatar from '../../components/common/Avatar.jsx';
import Modal from '../../components/common/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import EmptyState from '../../components/common/EmptyState.jsx';
import Tags from '../../components/common/Tags.jsx';
import { sampleJournals } from '../../data/sampleJournals.js';
import { tagList } from '../../data/hashtags.js';

export default function JournalListPage() {
  const { user } = useAuth();
  const [list, setList] = useState(sampleJournals);
  const [removing, setRemoving] = useState(null);
  const [q, setQ] = useState('');
  const [tag, setTag] = useState('');
  const kw = q.trim().toLowerCase();
  const shown = list.filter((j) => (!tag || j.hashtags.includes(tag)) && (!kw || [j.title, j.summary, j.author, ...j.hashtags].some((s) => s.toLowerCase().includes(kw))));
  return (
    <>
      <PageHeader title="여행기" description="다녀온 사람들의 사진과 이야기를 만나보세요." actions={<Link to="/journals/new" className="btn btn--primary">여행기 쓰기</Link>} />
      <div className="list-toolbar">
        <div className="chip-row chip-row--tags" aria-label="해시태그 필터">
          <button type="button" className={`chip chip--tag${!tag ? ' active' : ''}`} onClick={() => setTag('')}>전체</button>
          {tagList.map((t) => <button key={t} type="button" className={`chip chip--tag${t === tag ? ' active' : ''}`} aria-pressed={t === tag} onClick={() => setTag(tag === t ? '' : t)}>#{t}</button>)}
        </div>
        <input type="search" className="list-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목, 작성자, 해시태그 검색" aria-label="여행기 검색" />
      </div>
      {shown.length === 0 && <EmptyState icon="🔍" title="검색 결과가 없어요" description="다른 검색어나 해시태그를 선택해 보세요." />}
      <div className="journal-grid">
        {shown.map((j) => (
          <div key={j.journal_id} className="trip-card-wrap">
            <Link to={`/journals/${j.journal_id}`} className="journal-card">
              <img src={j.cover} alt="" />
              <h3>{j.title}</h3>
              <p>{j.summary}</p>
              <Tags tags={j.hashtags} active={tag} />
              <div className="journal-card__by"><Avatar name={j.author} /><span>{j.author}</span><span>♡ {j.likes}</span></div>
            </Link>
            {j.author_id === user.user_id && <button type="button" className="card-del" onClick={() => setRemoving(j)} aria-label={`${j.title} 삭제`}>삭제</button>}
          </div>
        ))}
      </div>
      <Modal open={!!removing} title="여행기 삭제" onClose={() => setRemoving(null)} width={400}>
        <p style={{ marginBottom: 20 }}>“{removing?.title}” 여행기를 삭제할까요?<br />댓글도 함께 사라져요.</p>
        <div className="form-actions">
          <button type="button" className="btn" onClick={() => setRemoving(null)}>취소</button>
          <button type="button" className="btn btn--danger" onClick={() => { setList((l) => l.filter((x) => x.journal_id !== removing.journal_id)); setRemoving(null); }}>삭제</button>
        </div>
      </Modal>
    </>
  );
}
