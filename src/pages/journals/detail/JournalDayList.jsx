// [여행기 상세] 날짜별 일정 기록 목록. 보기 상태는 JournalItemView, 수정 상태는 JournalItemEdit 로 그립니다.
import JournalItemView from './JournalItemView.jsx';
import JournalItemEdit from './JournalItemEdit.jsx';
import { dotDate } from '../../../utils/date.js';


export default function JournalDayList({ days, editing, onItemChange }) {
  return days.map((day, i) => (
    <section key={day.ji_day ?? i} className="jd-day">
      <h2 className="jd-day__head">
        <span>Day {day.ji_day ?? i + 1}</span>
        <span className="jd-day__date">{dotDate(day.date)}</span>
      </h2>

      {day.items.map((item, j) => (editing ? (
        <JournalItemEdit
          key={item.ji_id ?? item.pd_id}
          item={item}
          onChange={(patch) => onItemChange(i, j, patch)}
        />
      ) : (
        <JournalItemView key={item.ji_id} item={item} />
      )))}
    </section>
  ));
}
