# [여행기] 화면에 내려주는 응답 데이터 만들기
import json
from datetime import date, datetime, timedelta
from fastapi import HTTPException


class JournalResponseService:

    @staticmethod
    def format_time(value):
        """React input[type=time]용 HH:mm 문자열"""
        if value is None:
            return ""
        if isinstance(value, datetime):
            return value.strftime("%H:%M")
        return str(value)[:5]

    @staticmethod
    def format_date(value):
        if isinstance(value, datetime):
            return value.date().isoformat()
        if isinstance(value, date):
            return value.isoformat()
        return None

    @staticmethod
    def get_day_number(visit_time, start_time):
        if visit_time is None or start_time is None:
            raise HTTPException(400, "여행 일정의 날짜 정보가 없습니다.")

        visit_date = visit_time.date() if isinstance(visit_time, datetime) else visit_time
        start_date = start_time.date() if isinstance(start_time, datetime) else start_time
        day_number = (visit_date - start_date).days + 1

        if day_number < 1:
            raise HTTPException(400, "여행 시작일보다 앞선 일정이 있습니다.")

        return day_number

    @staticmethod
    def place_from_memo(memo):
        """
        여행계획 일정의 memo 에는 {"place": 장소, "label": 구분, "title": 제목} JSON 이 들어 있습니다.
        여행기에는 장소 이름(place)만 쓰고, JSON 이 아닌 글이면 그대로 씁니다.
        """
        text = (memo or "").strip()
        if text.startswith("{"):
            try:
                data = json.loads(text)
            except ValueError:
                return text
            if isinstance(data, dict):
                for key in ("place", "label", "title"):
                    value = str(data.get(key) or "").strip()
                    if value:
                        return value
                return ""
        return text

    @staticmethod
    def photo_from_memo(memo):
        """일정 memo JSON 의 photo (임시그림 이름 또는 /uploads/... 주소). 없으면 빈 문자열."""
        text = (memo or "").strip()
        if text.startswith("{"):
            try:
                data = json.loads(text)
            except ValueError:
                return ""
            if isinstance(data, dict):
                return str(data.get("photo") or "").strip()[:255]
        return ""

    @staticmethod
    def get_place_title(detail, place_name):
        """장소명 → 메모의 장소 이름 → 기본 제목 순서로 사용"""
        if place_name and place_name.strip():
            return place_name.strip()

        title = JournalResponseService.place_from_memo(detail.memo)
        if title:
            return title[:100]

        return "장소 미지정"

    @staticmethod
    def format_journal(journal, author_name=None):
        return {
            "j_id": journal.j_id,
            "p_id": journal.p_id,
            "u_id": journal.u_id,
            "j_title": journal.j_title,
            "j_intro": journal.j_intro or "",
            "j_photo": journal.j_photo or "",
            "p_create": journal.p_create,
            "loc": journal.loc,
            "u_name": author_name,
        }

    @staticmethod
    def format_item(item):
        return {
            "ji_id": item.ji_id,
            "j_id": item.j_id,
            "ji_day": item.ji_day,
            "ji_order": item.ji_order,
            "ji_time": JournalResponseService.format_time(item.ji_time),
            # 예전에 JSON 그대로 저장된 제목도 장소 이름으로 보여줌
            "ji_title": JournalResponseService.place_from_memo(item.ji_title) or item.ji_title,
            "ji_content": item.ji_content or "",
            "ji_photo": item.ji_photo or "",
            "ji_rating": item.ji_rating,
        }

    @staticmethod
    def format_comments(comments, names=None):
        names = names or {}
        return [
            {
                "jc_id": comment.jc_id,
                "j_id": comment.j_id,
                "u_id": comment.u_id,
                "jc_content": comment.jc_content,
                "jc_create": comment.jc_create,
                "u_name": names.get(comment.u_id),
            }
            for comment in comments
        ]

    @staticmethod
    def group_days(items, start_date=None):
        """저장된 일정을 날짜별로 묶어 반환"""
        days = {}

        for item in items:
            day_number = item.ji_day

            if day_number not in days:
                if item.ji_time is not None:
                    day_date = JournalResponseService.format_date(item.ji_time)
                elif start_date is not None:
                    base_date = (
                        start_date.date()
                        if isinstance(start_date, datetime)
                        else start_date
                    )
                    day_date = (
                        base_date + timedelta(days=day_number - 1)
                    ).isoformat()
                else:
                    day_date = None

                days[day_number] = {
                    "ji_day": day_number,
                    "date": day_date,
                    "items": [],
                }

            days[day_number]["items"].append(
                JournalResponseService.format_item(item)
            )

        return [days[key] for key in sorted(days)]
