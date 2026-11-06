// [공통] 이름 첫 글자 동그라미
export default function Avatar({ name }) {
  return <span className="avatar" aria-hidden="true">{name?.[0]}</span>;
}
