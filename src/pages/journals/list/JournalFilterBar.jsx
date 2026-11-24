// [여행기] 목록 위쪽의 해시태그 필터 + 검색창
export default function JournalFilterBar({ allTags, tag, onTagChange, query, onQueryChange }) {
  return (
    <div className="list-toolbar">
      <div className="chip-row" aria-label="해시태그 필터">
        <button type="button" className={`chip chip--tag${tag === '' ? ' active' : ''}`} aria-pressed={tag === ''} onClick={() => onTagChange('')}>전체</button>
        {allTags.map((t) => (
          <button key={t} type="button" className={`chip chip--tag${t === tag ? ' active' : ''}`} aria-pressed={t === tag} onClick={() => onTagChange(tag === t ? '' : t)}>#{t}</button>
        ))}
      </div>
      <input
        type="search"
        className="list-search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder="제목, 작성자, 해시태그 검색"
        aria-label="여행기 검색"
      />
    </div>
  );
}
