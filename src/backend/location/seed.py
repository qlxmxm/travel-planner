# [장소] 맛집·관광명소·숙소 샘플 데이터 넣기. VS Code 실행 버튼 또는 src 폴더에서:  python -m backend.location.seed
# location 테이블은 DB 정의서대로 미리 만들어져 있어야 합니다.
# 같은 (카테고리, 이름)이 이미 있으면 건너뛰므로 여러 번 실행해도 됩니다.
# l_start/l_end : 맛집 = 오픈/마감 시간, 관광명소 = 운영 시간, 숙소 = 체크인/체크아웃
# l_image : 프론트 src/data/photos.js 의 키 이름 (예: photos[l_image])
import asyncio
import sys
from pathlib import Path

# VS Code 실행 버튼(파일 경로로 실행)으로도 돌아가도록 src 폴더를 import 경로에 추가
sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from sqlalchemy import select

from backend.db import AsyncSessionLocal
from backend.location.models import Location

FOOD, SIGHTSEEING, LODGING = "맛집", "관광명소", "숙소"

LOCATIONS = [
    # ───────── 맛집 ─────────
    dict(l_category=FOOD, l_name="아사쿠사 규카츠", l_city="도쿄", l_add="도쿄 다이토구 아사쿠사 2-3-4",
         l_telno="03-1234-5678", l_start="11:00", l_end="21:00", l_image="gyukatsu",
         l_lat=35.7119, l_lng=139.7967,
         l_intro="직접 구워 먹는 소고기 커틀릿 전문점. 와사비 간장 소스가 잘 어울리고, 저녁에는 웨이팅이 길어요."),
    dict(l_category=FOOD, l_name="시부야 라멘 거리", l_city="도쿄", l_add="도쿄 시부야구 도겐자카 1-2-3",
         l_telno="03-2345-6789", l_start="10:30", l_end="23:30", l_image="ramen",
         l_lat=35.6580, l_lng=139.6982,
         l_intro="진한 돈코츠 국물로 유명한 라멘집. 1인 좌석이 많아 혼자 가기에도 좋아요."),
    dict(l_category=FOOD, l_name="도톤보리 타코야키", l_city="오사카", l_add="오사카 주오구 도톤보리 1-6-8",
         l_telno="06-3456-7890", l_start="10:00", l_end="22:00", l_image="osaka",
         l_lat=34.6687, l_lng=135.5013,
         l_intro="겉은 바삭하고 속은 부드러운 오사카식 타코야키. 가쓰오부시가 춤추는 걸 볼 수 있어요."),
    dict(l_category=FOOD, l_name="제주 흑돼지 거리 식당", l_city="제주", l_add="제주 제주시 관덕로15길 12",
         l_telno="064-123-4567", l_start="12:00", l_end="22:00", l_image="jeju",
         l_lat=33.5124, l_lng=126.5250,
         l_intro="두툼한 흑돼지 오겹살을 멜젓에 찍어 먹는 곳. 저녁 시간엔 예약을 추천해요."),
    dict(l_category=FOOD, l_name="강릉 초당 순두부", l_city="강릉", l_add="강원 강릉시 초당순두부길 77",
         l_telno="033-652-0000", l_start="07:00", l_end="20:00", l_image="gangneung",
         l_lat=37.7915, l_lng=128.9149,
         l_intro="바닷물로 간을 한 고소한 순두부. 아침 일찍 열어서 해돋이 보고 들르기 좋아요."),
    dict(l_category=FOOD, l_name="해운대 돼지국밥", l_city="부산", l_add="부산 해운대구 구남로 24",
         l_telno="051-746-0000", l_start="00:00", l_end="24:00", l_image="sunset",
         l_lat=35.1631, l_lng=129.1636,
         l_intro="24시간 여는 뽀얀 국물의 돼지국밥집. 부추와 새우젓을 넣어 먹어 보세요."),
    dict(l_category=FOOD, l_name="광장시장 빈대떡", l_city="서울", l_add="서울 종로구 창경궁로 88",
         l_telno="02-2267-0291", l_start="09:00", l_end="23:00", l_image="tokyo",
         l_lat=37.5700, l_lng=126.9996,
         l_intro="녹두를 바로 갈아 부치는 바삭한 빈대떡. 시장 골목에서 막걸리와 함께 먹기 좋아요."),
    dict(l_category=FOOD, l_name="속초 오징어순대", l_city="속초", l_add="강원 속초시 아바이마을길 15",
         l_telno="033-632-0000", l_start="09:00", l_end="20:00", l_image="mountain",
         l_lat=38.2014, l_lng=128.5946,
         l_intro="아바이마을의 명물. 오징어 속을 꽉 채운 순대를 달걀물에 부쳐 줘요."),
    dict(l_category=FOOD, l_name="신주쿠 스시 오마카세", l_city="도쿄", l_add="도쿄 신주쿠구 니시신주쿠 1-5-1",
         l_telno="03-6789-0123", l_start="17:00", l_end="23:00", l_image="tokyo",
         l_lat=35.6909, l_lng=139.6982,
         l_intro="셰프가 그날 들어온 생선으로 내주는 코스. 카운터 8석뿐이라 예약 필수예요."),
    dict(l_category=FOOD, l_name="을지로 노가리 골목", l_city="서울", l_add="서울 중구 을지로13길 19",
         l_telno="02-2265-0000", l_start="15:00", l_end="24:00", l_image="tokyo",
         l_lat=37.5664, l_lng=126.9910,
         l_intro="퇴근길 직장인들로 붐비는 노가리 골목. 골목 전체에 야외 테이블이 깔려요."),
    dict(l_category=FOOD, l_name="자갈치 시장 회센터", l_city="부산", l_add="부산 중구 자갈치해안로 52",
         l_telno="051-245-2594", l_start="05:00", l_end="22:00", l_image="sunset",
         l_lat=35.0966, l_lng=129.0306,
         l_intro="1층에서 고른 생선을 2층 식당에서 바로 회로 떠 줘요. 매운탕까지 꼭 드셔 보세요."),
    dict(l_category=FOOD, l_name="제주 고기국수", l_city="제주", l_add="제주 제주시 삼성로 41",
         l_telno="064-757-0000", l_start="08:30", l_end="18:00", l_image="jeju",
         l_lat=33.5070, l_lng=126.5290,
         l_intro="돼지 뼈 국물에 두툼한 수육을 올린 제주식 국수. 점심엔 줄이 길어요."),
    dict(l_category=FOOD, l_name="강릉 커피거리 카페", l_city="강릉", l_add="강원 강릉시 창해로14번길 20",
         l_telno="033-651-0000", l_start="10:00", l_end="22:00", l_image="gangneung",
         l_lat=37.7713, l_lng=128.9473,
         l_intro="안목해변 앞 로스터리 카페. 핸드드립과 바다 전망을 함께 즐길 수 있어요."),
    dict(l_category=FOOD, l_name="쓰키지 해산물 덮밥", l_city="도쿄", l_add="도쿄 주오구 쓰키지 4-10-5",
         l_telno="03-3541-0000", l_start="06:00", l_end="14:00", l_image="tokyo",
         l_lat=35.6655, l_lng=139.7707,
         l_intro="장외시장 안의 카이센동 가게. 성게와 연어알을 듬뿍 올려 줘요. 아침 일찍 가야 해요."),
    dict(l_category=FOOD, l_name="신세카이 쿠시카츠", l_city="오사카", l_add="오사카 나니와구 에비스히가시 2-3-9",
         l_telno="06-6643-0000", l_start="11:00", l_end="22:30", l_image="osaka",
         l_lat=34.6525, l_lng=135.5063,
         l_intro="꼬치 튀김 전문점. 소스는 한 번만 찍는 게 규칙이에요."),
    dict(l_category=FOOD, l_name="속초 물회 전문점", l_city="속초", l_add="강원 속초시 청초호반로 72",
         l_telno="033-635-0000", l_start="10:00", l_end="21:00", l_image="mountain",
         l_lat=38.1950, l_lng=128.5890,
         l_intro="새콤달콤한 육수에 싱싱한 회를 듬뿍 넣은 물회. 여름에 특히 인기예요."),

    # ───────── 관광명소 ─────────
    dict(l_category=SIGHTSEEING, l_name="아사쿠사 센소지", l_city="도쿄", l_add="도쿄 다이토구 아사쿠사 2-3-1",
         l_telno="03-3842-0181", l_start="06:00", l_end="17:00", l_image="asakusa",
         l_lat=35.7148, l_lng=139.7967,
         l_intro="도쿄에서 가장 오래된 사찰. 가미나리몬에서 나카미세 거리를 따라 걷는 코스가 대표적이에요."),
    dict(l_category=SIGHTSEEING, l_name="시부야 스크램블 교차로", l_city="도쿄", l_add="도쿄 시부야구 도겐자카 2-1",
         l_telno="03-5555-0101", l_start="00:00", l_end="24:00", l_image="shibuya",
         l_lat=35.6595, l_lng=139.7005,
         l_intro="한 번에 수천 명이 건너는 세계에서 가장 붐비는 교차로. 해 질 무렵 전망대에서 내려다보면 좋아요."),
    dict(l_category=SIGHTSEEING, l_name="아키하바라 전자상가", l_city="도쿄", l_add="도쿄 지요다구 소토칸다 1-15",
         l_telno="03-5555-0202", l_start="10:00", l_end="20:00", l_image="akihabara",
         l_lat=35.6984, l_lng=139.7731,
         l_intro="애니메이션, 게임, 전자제품이 모인 거리. 건물마다 층별로 취향이 달라 구경하는 재미가 있어요."),
    dict(l_category=SIGHTSEEING, l_name="애월 해안도로", l_city="제주", l_add="제주 제주시 애월읍 애월해안로",
         l_telno="064-710-0000", l_start="00:00", l_end="24:00", l_image="jeju",
         l_lat=33.4636, l_lng=126.3110,
         l_intro="에메랄드빛 바다를 따라 달리는 드라이브 코스. 카페와 포토 스폿이 곳곳에 있어요."),
    dict(l_category=SIGHTSEEING, l_name="설악산 대청봉", l_city="속초", l_add="강원 속초시 설악산로 833",
         l_telno="033-636-7700", l_start="03:00", l_end="15:00", l_image="mountain",
         l_lat=38.1194, l_lng=128.4654,
         l_intro="설악산의 최고봉. 단풍철에는 새벽부터 입산이 몰리니 일찍 출발하세요."),
    dict(l_category=SIGHTSEEING, l_name="해운대 해수욕장", l_city="부산", l_add="부산 해운대구 우동 해운대해변로 264",
         l_telno="051-749-7621", l_start="00:00", l_end="24:00", l_image="sunset",
         l_lat=35.1587, l_lng=129.1604,
         l_intro="부산을 대표하는 해변. 여름엔 해수욕, 저녁엔 동백섬 산책로를 따라 노을을 보기 좋아요."),
    dict(l_category=SIGHTSEEING, l_name="경복궁", l_city="서울", l_add="서울 종로구 사직로 161",
         l_telno="02-3700-3900", l_start="09:00", l_end="18:00", l_image="tokyo",
         l_lat=37.5796, l_lng=126.9770,
         l_intro="조선의 법궁. 한복을 입으면 무료로 입장할 수 있고, 수문장 교대식도 볼 수 있어요."),
    dict(l_category=SIGHTSEEING, l_name="오사카성", l_city="오사카", l_add="오사카 주오구 오사카조 1-1",
         l_telno="06-6941-3044", l_start="09:00", l_end="17:00", l_image="osaka",
         l_lat=34.6873, l_lng=135.5262,
         l_intro="벚꽃 명소로 유명한 성. 천수각 꼭대기 전망대에서 오사카 시내가 한눈에 보여요."),
    dict(l_category=SIGHTSEEING, l_name="성산일출봉", l_city="제주", l_add="제주 서귀포시 성산읍 일출로 284-12",
         l_telno="064-783-0959", l_start="07:00", l_end="20:00", l_image="sunset",
         l_lat=33.4581, l_lng=126.9425,
         l_intro="바다 위로 솟은 분화구. 30분 정도 오르면 정상에서 일출을 볼 수 있어요."),
    dict(l_category=SIGHTSEEING, l_name="경포대 해변", l_city="강릉", l_add="강원 강릉시 창해로 514",
         l_telno="033-640-4920", l_start="00:00", l_end="24:00", l_image="gangneung",
         l_lat=37.8055, l_lng=128.9087,
         l_intro="소나무 숲과 넓은 백사장이 이어진 해변. 근처 경포호 산책로도 함께 걷기 좋아요."),
    dict(l_category=SIGHTSEEING, l_name="N서울타워", l_city="서울", l_add="서울 용산구 남산공원길 105",
         l_telno="02-3455-9277", l_start="10:00", l_end="23:00", l_image="tokyo",
         l_lat=37.5512, l_lng=126.9882,
         l_intro="남산 꼭대기의 전망 타워. 사랑의 자물쇠와 서울 야경이 유명해요."),
    dict(l_category=SIGHTSEEING, l_name="감천문화마을", l_city="부산", l_add="부산 사하구 감내2로 203",
         l_telno="051-204-1444", l_start="09:00", l_end="18:00", l_image="sunset",
         l_lat=35.0975, l_lng=129.0106,
         l_intro="산비탈을 따라 알록달록한 집들이 모인 마을. 골목마다 벽화와 포토존이 있어요."),
    dict(l_category=SIGHTSEEING, l_name="한라산 성판악 탐방로", l_city="제주", l_add="제주 제주시 조천읍 516로 1865",
         l_telno="064-725-9950", l_start="05:30", l_end="18:00", l_image="mountain",
         l_lat=33.3850, l_lng=126.6200,
         l_intro="백록담까지 오르는 대표 코스. 왕복 8~9시간이라 입산 시간을 꼭 확인하세요."),
    dict(l_category=SIGHTSEEING, l_name="메이지 신궁", l_city="도쿄", l_add="도쿄 시부야구 요요기카미조노초 1-1",
         l_telno="03-3379-5511", l_start="06:00", l_end="16:30", l_image="shibuya",
         l_lat=35.6764, l_lng=139.6993,
         l_intro="하라주쿠역 바로 옆 울창한 숲속 신사. 도심 속에서 조용히 산책하기 좋아요."),
    dict(l_category=SIGHTSEEING, l_name="유니버설 스튜디오 재팬", l_city="오사카", l_add="오사카 고노하나구 사쿠라지마 2-1-33",
         l_telno="0570-20-0606", l_start="09:00", l_end="21:00", l_image="osaka",
         l_lat=34.6654, l_lng=135.4323,
         l_intro="영화 테마파크. 인기 구역은 입장 정리권이 필요하니 아침 일찍 가세요."),
    dict(l_category=SIGHTSEEING, l_name="안목해변", l_city="강릉", l_add="강원 강릉시 창해로14번길",
         l_telno="033-640-5420", l_start="00:00", l_end="24:00", l_image="gangneung",
         l_lat=37.7720, l_lng=128.9480,
         l_intro="커피거리 바로 앞 해변. 카페 창가에서 바다를 보며 쉬어 가기 좋아요."),

    # ───────── 숙소 ─────────
    dict(l_category=LODGING, l_name="신주쿠 와세다 스테이", l_city="도쿄", l_add="도쿄 신주쿠구 다카다노바바 3-4-5",
         l_telno="03-4567-8901", l_start="15:00", l_end="11:00", l_image="hotel",
         l_lat=35.7126, l_lng=139.7038,
         l_intro="다카다노바바역에서 도보 10분. 패밀리룸이 있어 4인 가족이나 친구들이 함께 묵기 좋아요."),
    dict(l_category=LODGING, l_name="나리타 에어포트 인", l_city="도쿄", l_add="지바현 나리타시 산리즈카 1-1",
         l_telno="0476-00-1111", l_start="14:00", l_end="10:00", l_image="narita",
         l_lat=35.7720, l_lng=140.3929,
         l_intro="나리타 공항 셔틀이 다니는 호텔. 이른 아침 비행기 전날 묵기 편해요."),
    dict(l_category=LODGING, l_name="난바 리버사이드 호텔", l_city="오사카", l_add="오사카 주오구 난바 2-1-10",
         l_telno="06-6211-0000", l_start="15:00", l_end="11:00", l_image="osaka",
         l_lat=34.6658, l_lng=135.5020,
         l_intro="도톤보리까지 걸어서 5분. 야경 보고 늦게 들어오기 좋은 위치예요."),
    dict(l_category=LODGING, l_name="강릉 오션뷰 호텔", l_city="강릉", l_add="강원 강릉시 창해로 307",
         l_telno="033-123-4567", l_start="15:00", l_end="11:00", l_image="gangneung",
         l_lat=37.7956, l_lng=128.9186,
         l_intro="객실에서 일출이 보이는 바다 앞 호텔. 조식 뷔페가 인기예요."),
    dict(l_category=LODGING, l_name="애월 바다 펜션", l_city="제주", l_add="제주 제주시 애월읍 애월해안로 200",
         l_telno="064-799-0000", l_start="16:00", l_end="11:00", l_image="jeju",
         l_lat=33.4628, l_lng=126.3094,
         l_intro="해안도로 바로 앞 독채 펜션. 테라스에서 노을을 보며 바비큐를 할 수 있어요."),
    dict(l_category=LODGING, l_name="설악 산장 게스트하우스", l_city="속초", l_add="강원 속초시 설악산로 1000",
         l_telno="033-636-0000", l_start="15:00", l_end="10:00", l_image="mountain",
         l_lat=38.1730, l_lng=128.4890,
         l_intro="설악산 입구 근처라 새벽 산행 전에 묵기 좋아요. 공용 주방이 있어요."),
    dict(l_category=LODGING, l_name="명동 시티 호텔", l_city="서울", l_add="서울 중구 명동길 50",
         l_telno="02-772-0000", l_start="15:00", l_end="11:00", l_image="hotel",
         l_lat=37.5636, l_lng=126.9850,
         l_intro="명동역 바로 앞이라 쇼핑하고 들어오기 편해요. 공항버스 정류장도 가까워요."),
    dict(l_category=LODGING, l_name="해운대 마린 호텔", l_city="부산", l_add="부산 해운대구 해운대해변로 296",
         l_telno="051-740-0000", l_start="15:00", l_end="11:00", l_image="sunset",
         l_lat=35.1595, l_lng=129.1640,
         l_intro="해운대 해변이 내려다보이는 오션뷰 객실. 루프탑 수영장이 있어요."),
    dict(l_category=LODGING, l_name="아사쿠사 료칸", l_city="도쿄", l_add="도쿄 다이토구 아사쿠사 3-10-2",
         l_telno="03-3841-0000", l_start="15:00", l_end="10:00", l_image="asakusa",
         l_lat=35.7155, l_lng=139.7950,
         l_intro="다다미방과 대욕장이 있는 일본 전통 숙소. 센소지까지 걸어서 5분이에요."),
    dict(l_category=LODGING, l_name="북촌 한옥 스테이", l_city="서울", l_add="서울 종로구 북촌로11길 30",
         l_telno="02-765-0000", l_start="15:00", l_end="11:00", l_image="hotel",
         l_lat=37.5826, l_lng=126.9850,
         l_intro="전통 한옥에서 하룻밤. 마당이 있는 독채라 조용히 쉬기 좋아요."),
    dict(l_category=LODGING, l_name="광안리 오션 게스트하우스", l_city="부산", l_add="부산 수영구 광안해변로 219",
         l_telno="051-751-0000", l_start="16:00", l_end="11:00", l_image="sunset",
         l_lat=35.1532, l_lng=129.1186,
         l_intro="광안대교 야경이 보이는 게스트하우스. 1인 도미토리와 2인실이 있어요."),
    dict(l_category=LODGING, l_name="서귀포 감귤밭 펜션", l_city="제주", l_add="제주 서귀포시 남원읍 신례로 300",
         l_telno="064-764-0000", l_start="15:00", l_end="11:00", l_image="jeju",
         l_lat=33.2950, l_lng=126.6200,
         l_intro="감귤밭 한가운데 있는 펜션. 겨울엔 귤 따기 체험도 할 수 있어요."),
    dict(l_category=LODGING, l_name="시부야 스카이 호텔", l_city="도쿄", l_add="도쿄 시부야구 시부야 2-24-12",
         l_telno="03-5468-0000", l_start="15:00", l_end="11:00", l_image="shibuya",
         l_lat=35.6590, l_lng=139.7030,
         l_intro="시부야역 직결 고층 호텔. 객실에서 스크램블 교차로가 내려다보여요."),
    dict(l_category=LODGING, l_name="교토행 우메다 호텔", l_city="오사카", l_add="오사카 기타구 우메다 3-1-1",
         l_telno="06-6345-0000", l_start="15:00", l_end="11:00", l_image="osaka",
         l_lat=34.7025, l_lng=135.4959,
         l_intro="오사카역과 연결돼 교토·고베로 당일치기 다녀오기 편한 위치예요."),
    dict(l_category=LODGING, l_name="강릉 한옥 마을 숙소", l_city="강릉", l_add="강원 강릉시 난설헌로 193",
         l_telno="033-648-0000", l_start="15:00", l_end="11:00", l_image="gangneung",
         l_lat=37.7900, l_lng=128.9070,
         l_intro="오죽헌과 경포호 사이의 한옥 숙소. 아침에 한식 조식이 나와요."),
    dict(l_category=LODGING, l_name="속초 해변 리조트", l_city="속초", l_add="강원 속초시 대포항길 186",
         l_telno="033-630-0000", l_start="15:00", l_end="11:00", l_image="mountain",
         l_lat=38.1760, l_lng=128.6050,
         l_intro="객실에서 동해와 설악산이 모두 보이는 리조트. 실내 수영장이 있어요."),
]


async def main():
    added = 0
    async with AsyncSessionLocal() as db:
        for data in LOCATIONS:
            exists = await db.scalar(
                select(Location.l_id).where(
                    Location.l_category == data["l_category"], Location.l_name == data["l_name"]
                )
            )
            if exists:
                continue
            db.add(Location(**data))
            added += 1
        await db.commit()
    print(f"장소 {added}개를 넣었습니다. (이미 있던 {len(LOCATIONS) - added}개는 건너뜀)")


if __name__ == "__main__":
    asyncio.run(main())
