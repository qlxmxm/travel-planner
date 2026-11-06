// [공통] 해시태그 고르기. value: 선택된 태그 배열, onChange(새 배열). 목록에 없는 태그는 입력해서 추가.
import { useState } from 'react';
import { tagList } from '../../data/hashtags.js';

export default function TagPicker({ value, onChange }) {
  const [text, setText] = useState('');
  const all = [...new Set([...tagList, ...value])];
  const toggle = (t) => onChange(value.includes(t) ? value.filter((x) => x !== t) : [...value, t]);
  const add = () => {
    const t = text.trim().replace(/^#/, '').replace(/\s+/g, '');
    if (t && !value.includes(t)) onChange([...value, t]);
    setText('');
  };
  return (
    <div className="tag-picker">
      <div className="chip-row" style={{ marginBottom: 10 }}>
        {all.map((t) => (
          <button key={t} type="button" className={`chip${value.includes(t) ? ' active' : ''}`} aria-pressed={value.includes(t)} onClick={() => toggle(t)}>#{t}</button>
        ))}
      </div>
      <div className="chat__edit" style={{ marginTop: 0 }}>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder="직접 추가 (예: 가족여행) 후 Enter" aria-label="해시태그 직접 추가" />
        <button type="button" className="btn" onClick={add}>추가</button>
      </div>
    </div>
  );
}
