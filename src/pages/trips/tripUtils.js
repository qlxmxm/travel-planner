// [여행계획] 화면 공통 도우미. 여행(trip)은 api/planApi.js 의 toTrip() 모양입니다.
// 서버에는 "공개 여행" 개념(컬럼)이 없어서, 여행은 방장·멤버만 볼 수 있습니다.
export const isMember = (trip, user) => trip.member_ids.includes(user.user_id) || trip.owner_id === user.user_id;
// 여행 기간(end_date)이 지났는지 → 지났으면 "여행기에 추가" 버튼이 나타남
export const isEnded = (trip) => new Date(`${trip.end_date}T00:00:00`) < new Date(new Date().toDateString());
