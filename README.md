# APTeN - Frontend

## 프로젝트 소개

APTeN은 입주민과 관리자가 함께 사용하는 스마트 아파트 통합 관리 시스템입니다.  
방문차량 등록부터 주차 현황, 시설 예약, 게시판까지 아파트 생활 전반을 한 곳에서 관리할 수 있습니다.

| 입주민 | 관리자 |
|---|---|
| ![입주민](https://github.com/user-attachments/assets/4f37a3ca-2ea4-4ae1-82df-44307f5ec994) | ![관리자](https://github.com/user-attachments/assets/d0561661-f91b-45ac-a1c4-5eddef495fa7) |

### 주요 기능
- 방문차량 사전등록 및 고정 방문차량 관리
- 입출차 기록 생성 (번호판 입력 시 차량 유형 자동 판별) 및 실시간 주차 현황 조회
- 시설 예약 및 GX 프로그램 승인 관리
- 게시판 (공지사항 / 자유게시판) 및 댓글
- 관리자 알림 (신규 회원가입, 차량 등록 신청 시 자동 발송)

### 특징
- 관리자/입주민 역할에 따라 완전히 분리된 레이아웃 및 사이드바 제공
- 공통 모달 컴포넌트(ActionResultModal, ConfirmModal)에 theme prop으로 관리자와 입주민 색상 분리 —> 컴포넌트 재사용성과 테마 일관성을 동시에 확보
- 401 발생 시 Refresh Token으로 자동 재발급 후 원래 요청을 재시도하는 Axios 인터셉터 적용
- 주차 현황 실시간 갱신은 SSE/WebSocket 대비 구현 복잡도를 고려해 setInterval 30초 폴링 방식 선택
- Vue 3 기반 차트 라이브러리 중 커스터마이징 자유도가 높은 ApexCharts를 선택해 시간대별/일별 주차 통계 시각화
- GX 예약 승인 현황을 시설별 탭으로 분리하여 관리자가 한눈에 확인 가능

## 아키텍처
```
Frontend (Vue.js) ↔ Backend (Spring Boot) ↔ Database (MySQL)
```

Vite 빌드 결과물을 Spring Boot `resources/static/`에 포함하여 단일 서버로 서빙합니다.

## 기술 스택

- Vue.js 3 (Composition API), Pinia, Vue Router
- Axios, ApexCharts
- Vite

## 프로젝트 구조
```
src/
├── api/          # API 호출 모듈
├── assets/       # 이미지, 전역 스타일
├── components/   # 공통 컴포넌트 (모달, 레이아웃 등)
├── composables/  # 재사용 로직
├── router/       # 라우터 (role 기반 가드 포함)
├── stores/       # Pinia 상태 관리
├── utils/        # 유틸리티 함수
└── views/
    ├── auth/     # 로그인, 회원가입, 비밀번호 재설정
    ├── admin/    # 관리자 페이지
    └── resident/ # 입주민 페이지
```

## ⚙️ 실행 방법
```bash
# 패키지 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build
```

빌드 결과물을 백엔드 `src/main/resources/static/` 폴더에 넣으면 별도 프론트 서버 없이 동작합니다.

## 배포 환경 주의사항

로컬 환경에서는 모든 기능이 정상 동작하지만,  
HTTP 기반 IP 주소로 배포 시 아래 기능은 동작하지 않습니다.

| 기능 | 원인 | 해결 방법 |
|---|---|---|
| 소셜 로그인 (Google/Kakao/Naver) | OAuth2는 HTTPS + 도메인 필수 | HTTPS 도메인 적용 후 각 콘솔에서 redirect URI 등록 |
| 비밀번호 재설정 | 메일 링크가 `APP_BASE_URL` 기준으로 생성됨 | 백엔드 `.env`의 `APP_BASE_URL`을 배포 서버 주소로 변경 |

## 인증 방식

JWT 토큰을 HttpOnly 쿠키로 관리합니다.  
Access Token이 만료되면 Refresh Token으로 자동 재발급하며, Refresh Token까지 만료된 경우 로그인 페이지로 이동합니다.

## 👥 팀원

| 이름 | 담당 |
|---|---|
| 김가은 | 프론트 기반 세팅, 인증, 방문차량, 고정 방문차량, 주차, 알림 |
| 이윤주 | 입주민 대시보드, 게시판, 댓글 |
| 손지혜 | 관리자 대시보드, 차량, 시설 |
| 박소영 | 세대 관리, 예약 |
