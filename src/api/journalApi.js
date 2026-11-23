
import axios from 'axios';
import { getToken } from './client.js';

const http = axios.create({
  baseURL: '/api/journals',
  timeout: 10000,
});

// 로그인 JWT 자동 첨부
http.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// FastAPI 오류 메시지 변환
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error.response?.data?.detail;

    const message = typeof detail === 'string'
      ? detail
      : Array.isArray(detail)
        ? detail.map((item) => item.msg).join(', ')
        : error.response
          ? `요청 실패 (${error.response.status})`
          : '서버에 연결할 수 없습니다.';

    return Promise.reject(new Error(message));
  }
);

// Axios 응답에서 data만 반환
const data = (request) => request.then((response) => response.data);

export const journalApi = {
  // ==================================================
  // 1. 여행계획 → 여행기
  // ==================================================

  // 완료된 여행계획을 여행기 작성 화면에 불러오기
  getPlanPreview(planId) {
    return data(http.get(`/from-plan/${planId}/preview`));
  },

  // 여행계획을 복사하여 여행기 생성
  create(planId, payload) {
    return data(http.post(`/from-plan/${planId}`, payload));
  },

  // ==================================================
  // 2. 여행기 목록
  // ==================================================

  // 전체 여행기 조회
  getList(skip = 0, limit = 100) {
    return data(http.get('', {
      params: { skip, limit },
    }));
  },

  // 로그인한 사용자의 여행기 조회
  getMine() {
    return data(http.get('/me'));
  },

  // ==================================================
  // 3. 여행기 상세·수정·삭제
  // ==================================================

  // 여행기 상세 조회
  getDetail(journalId) {
    return data(http.get(`/${journalId}`));
  },

  // 여행기 수정 화면 데이터 조회
  getForEdit(journalId) {
    return data(http.get(`/${journalId}/edit`));
  },

  // 여행기 전체 수정
  update(journalId, payload) {
    return data(http.patch(`/${journalId}`, payload));
  },

  // 여행기 삭제
  remove(journalId) {
    return data(http.delete(`/${journalId}`));
  },

  // ==================================================
  // 4. 여행기 개별 일정
  // ==================================================

  // 일정의 내용·사진·별점 수정
  updateItem(itemId, payload) {
    return data(http.patch(`/items/${itemId}`, payload));
  },

  // ==================================================
  // 5. 댓글
  // ==================================================

  // 여행기 댓글 조회
  getComments(journalId) {
    return data(http.get(`/${journalId}/comments`));
  },

  // 댓글 작성
  addComment(journalId, content) {
    return data(http.post(`/${journalId}/comments`, {
      jc_content: content,
    }));
  },

  // 댓글 수정
  updateComment(commentId, content) {
    return data(http.patch(`/comments/${commentId}`, {
      jc_content: content,
    }));
  },

  // 댓글 삭제
  removeComment(commentId) {
    return data(http.delete(`/comments/${commentId}`));
  },

  // ==================================================
  // 6. 해시태그 조회
  // ==================================================

  // 원본 여행계획에 연결된 해시태그 조회
  getHashtags(journalId) {
    return data(http.get(`/${journalId}/hashtags`));
  },

  // ==================================================
  // 7. 좋아요
  // ==================================================

  // 여행기 좋아요 개수 → { j_id, like_count }
  getLikeCount(journalId) {
    return data(http.get(`/${journalId}/likes/count`));
  },

  // 내가 좋아요한 여행기 목록 → [{ j_id, jl_create }] (로그인 필요)
  getMyLikes() {
    return data(http.get('/likes/me'));
  },

  // 좋아요 누르기 / 취소
  addLike(journalId) {
    return data(http.post(`/${journalId}/likes`));
  },

  removeLike(journalId) {
    return data(http.delete(`/${journalId}/likes`));
  },
};
