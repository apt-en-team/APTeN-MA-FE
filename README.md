## 실행 방법
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

로컬에서는 모든 기능이 정상 동작하지만, HTTP 기반 IP 주소로 배포 시 아래 기능은 동작하지 않습니다.

| 기능 | 원인 | 해결 방법 |
|---|---|---|
| 소셜 로그인 (Google/Kakao/Naver) | OAuth2는 HTTPS + 도메인 필수 | HTTPS 도메인 적용 후 각 콘솔에서 redirect URI 등록 |
| 비밀번호 재설정 | 메일 링크가 `APP_BASE_URL` 기준으로 생성됨 | 백엔드 `.env`의 `APP_BASE_URL`을 배포 서버 주소로 변경 |

## 인증 방식

JWT 토큰을 HttpOnly 쿠키로 관리합니다.
Access Token이 만료되면 Refresh Token으로 자동 재발급하며, Refresh Token까지 만료된 경우 로그인 페이지로 이동합니다.

## 팀원

| 이름 | 담당 |
|---|---|
| 김가은 | 프론트 기반 세팅, 인증, 방문차량, 고정 방문차량, 주차, 알림 |
| 이윤주 | 입주민 대시보드, 게시판, 댓글 |
| 손지혜 | 관리자 대시보드, 차량, 시설 |
| 박소영 | 세대 관리, 예약 |
