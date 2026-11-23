// [공통] 구글지도 표시 (위도 lat / 경도 lng).
// - .env 에 VITE_GOOGLE_MAPS_API_KEY 가 있으면: 공식 Maps JavaScript API (마커)
// - 키가 없으면: 키 없이 되는 구글지도 iframe 임베드 (결제·키 불필요, 비공식 방식)
// - 둘 다 안 되면 "구글지도에서 열기" 링크만 보여줌
import { useEffect, useRef, useState } from 'react';

const KEY = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
let loader = null; // 스크립트는 한 번만 불러옴

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!loader) {
    loader = new Promise((resolve, reject) => {
      window.__gmapsReady = () => resolve(window.google.maps);
      const s = document.createElement('script');
      s.src = `https://maps.googleapis.com/maps/api/js?key=${KEY}&callback=__gmapsReady&language=ko`;
      s.async = true;
      s.onerror = () => { loader = null; reject(new Error('구글지도를 불러오지 못했습니다.')); };
      document.head.appendChild(s);
    });
  }
  return loader;
}

export default function MapView({ lat, lng, name, address, className = '', height = 320 }) {
  const box = useRef(null);
  const [failed, setFailed] = useState(false);
  const pos = lat != null && lng != null ? { lat: Number(lat), lng: Number(lng) } : null;
  const link = pos
    ? `https://www.google.com/maps/search/?api=1&query=${pos.lat},${pos.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address || name || '')}`;

  useEffect(() => {
    setFailed(false);
    if (!pos || !KEY) return undefined;
    let dead = false;
    // 키가 잘못됐을 때 구글이 부르는 전역 콜백
    window.gm_authFailure = () => { if (!dead) setFailed(true); };
    loadGoogleMaps().then((maps) => {
      if (dead || !box.current) return;
      const map = new maps.Map(box.current, { center: pos, zoom: 15, mapTypeControl: false, streetViewControl: false });
      new maps.Marker({ position: pos, map, title: name });
    }).catch(() => { if (!dead) setFailed(true); });
    return () => { dead = true; };
  }, [pos?.lat, pos?.lng, name]); // eslint-disable-line react-hooks/exhaustive-deps

  // 키가 없으면 iframe 임베드 (좌표가 없으면 주소로 검색)
  if (!KEY && (pos || address || name)) {
    const q = pos ? `${pos.lat},${pos.lng}` : encodeURIComponent(address || name);
    return (
      <div className={className}>
        <iframe
          className="map-box"
          style={{ height, border: 0 }}
          title={`${name || '장소'} 지도`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          src={`https://maps.google.com/maps?q=${q}&z=15&hl=ko&output=embed`}
        />
        <a className="map-open" href={link} target="_blank" rel="noreferrer">구글지도에서 크게 보기 ↗</a>
      </div>
    );
  }

  if (!pos || failed) {
    return (
      <div className={`map-fallback ${className}`} style={{ minHeight: 120 }}>
        <p>{!pos ? '이 장소는 위치 좌표가 없어요.' : '지도를 불러오지 못했어요.'}</p>
        <a className="btn" href={link} target="_blank" rel="noreferrer">구글지도에서 열기</a>
      </div>
    );
  }
  return (
    <div className={className}>
      <div ref={box} className="map-box" style={{ height }} />
      <a className="map-open" href={link} target="_blank" rel="noreferrer">구글지도에서 크게 보기 ↗</a>
    </div>
  );
}
