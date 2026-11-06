// [장소] 별점. 보기용: <StarRating value={4.5} /> / 입력용: <StarRating value={v} onChange={setV} />
export default function StarRating({ value = 0, onChange, size = 18 }) {
  const stars = [1, 2, 3, 4, 5];
  if (onChange) {
    return (
      <div className="stars stars--input" role="radiogroup" aria-label="별점 선택" style={{ fontSize: size }}>
        {stars.map((n) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}점`}
            className={n <= value ? 'on' : ''} onClick={() => onChange(n)}>★</button>
        ))}
      </div>
    );
  }
  return (
    <span className="stars" role="img" aria-label={`별점 ${value.toFixed(1)}점`} style={{ fontSize: size }}>
      {stars.map((n) => <i key={n} className={value >= n - 0.25 ? 'on' : value >= n - 0.75 ? 'half' : ''}>★</i>)}
    </span>
  );
}
