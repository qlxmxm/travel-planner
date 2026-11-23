// [공통] 사진 업로드. 큰 사진(휴대폰 사진 등)은 브라우저에서 먼저 줄인 뒤 POST /api/uploads 로 보냅니다.
// 반환: 저장된 사진 주소 (예: /uploads/ab12cd34ef.jpg) → 이 값을 DB의 사진 칸에 저장합니다.
import { getToken } from './client.js';

const MAX_SIDE = 1600;           // 긴 변이 이 값보다 크면 줄임
const SHRINK_OVER = 1.5 * 1024 * 1024;

async function shrink(file) {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size <= SHRINK_OVER) return file;
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? blob : file;
  } catch {
    return file;     // 줄이기에 실패하면 원본 그대로 보냄
  }
}

export async function uploadPhoto(file) {
  if (!file || !file.type.startsWith('image/')) throw new Error('사진 파일을 골라 주세요.');
  const body = await shrink(file);
  const token = getToken();
  const res = await fetch('/api/uploads', {
    method: 'POST',
    headers: { 'Content-Type': body.type || file.type, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(typeof err.detail === 'string' ? err.detail : `사진을 올리지 못했어요 (${res.status})`);
  }
  return (await res.json()).url;
}
