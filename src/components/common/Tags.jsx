// [공통] 해시태그 표시 (여행계획·여행기에서 같이 씀). tags 가 비어 있으면 아무것도 그리지 않음. active 에 든 태그는 강조.
export default function Tags({ tags = [], active }) {
  if (!tags.length) return null;
  return <div className="tags">{tags.map((t) => <span key={t} className={`tag${active === t ? ' on' : ''}`}>#{t}</span>)}</div>;
}
