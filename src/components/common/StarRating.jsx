// [장소] 별점. 보기용: <StarRating value={4.5} /> / 입력용: <StarRating value={v} onChange={setV} />
const STARS = [1, 2, 3, 4, 5];
const FULL_STAR_MARGIN = 0.25; // 별 하나에서 이만큼 모자라도 꽉 찬 별로 표시
const HALF_STAR_MARGIN = 0.75; // 이만큼 모자라면 반쪽 별로 표시

const getStarClass = (value, star) => {
  if (value >= star - FULL_STAR_MARGIN) return 'on';
  if (value >= star - HALF_STAR_MARGIN) return 'half';
  return '';
};

export default function StarRating({ value = 0, onChange, size = 18 }) {
  if (onChange) {
    return (
      <div className="stars stars--input" role="radiogroup" aria-label="별점 선택" style={{ fontSize: size }}>
        {STARS.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}점`}
            className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>★</button>
        ))}
      </div>
    );
  }
  return (
    <span className="stars" role="img" aria-label={`별점 ${value.toFixed(1)}점`} style={{ fontSize: size }}>
      {STARS.map((n) => <i key={n} className={getStarClass(value, n)}>★</i>)}
    </span>
  );
}
