// [여행계획] 멤버 탭 - 방장용 초대 코드 상자 (보기 · 복사 · 새로 만들기)
import { useState } from 'react';
import { dateOnly } from '../../../utils/date.js';

export default function InviteBox({ invite, onCreate }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try { await navigator.clipboard.writeText(invite.i_code); } catch { /* 복사 권한이 없어도 화면 표시는 진행 */ }
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="card invite-box">
      <div>
        <span>초대 코드</span>
        <b>{invite ? invite.i_code : '없음'}</b>
        <small>{invite ? `${dateOnly(invite.i_expire)}까지, 한 번만 사용할 수 있어요` : '아직 사용할 수 있는 코드가 없어요'}</small>
      </div>
      <div className="invite-box__btns">
        {invite && <button type="button" className="btn" onClick={copy}>{copied ? '복사됨' : '복사'}</button>}
        <button type="button" className="btn" onClick={onCreate}>새 코드 만들기</button>
      </div>
    </section>
  );
}
