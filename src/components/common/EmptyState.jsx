// [공통] 데이터가 없을 때 보여주는 빈 화면
export default function EmptyState({ icon = '🗺️', title, description, children }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon}</div>
      <div className="empty-state__title">{title}</div>
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
