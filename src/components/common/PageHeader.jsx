// [공통] 페이지 제목 줄. actions 자리에 버튼을 넣을 수 있음
export default function PageHeader({ title, description, actions }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div>{actions}</div>}
    </div>
  );
}
