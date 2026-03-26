<template>
  <div class="landing-page">
    <!-- 배경 글로우 -->
    <div class="bg-glow"></div>

    <!-- 상단 헤더 -->
    <header class="landing-header">
      <div class="header-logo">
        <div class="logo-icon">A</div>
        <span class="logo-text">아파트엔</span>
      </div>
    </header>

    <!-- 메인 콘텐츠 -->
    <main class="landing-main">
      <p class="sub-title">SMART APARTMENT MANAGEMENT</p>
      <h1 class="main-title">아파트엔</h1>
      <p class="main-desc">스마트 주거·생활 통합 관리 시스템</p>
      <div class="divider-bar"></div>

      <!-- 선택 카드 2개 -->
      <div class="card-row">
        <!-- 입주민 카드 -->
        <div class="select-card resident-card" @click="goTo('/login')">
          <div class="card-icon-wrap">
            <span class="card-icon">🏢</span>
          </div>
          <span class="card-label">Resident</span>
          <h2 class="card-title">입주민</h2>
          <p class="card-desc">게시판 · 시설 예약 · 차량 관리 · 주차 현황</p>
          <div class="card-arrow">→</div>
        </div>

        <!-- 관리자 카드 -->
        <div class="select-card admin-card" @click="goTo('/admin/login')">
          <div class="card-icon-wrap">
            <span class="card-icon">🔧</span>
          </div>
          <span class="card-label">Administrator</span>
          <h2 class="card-title">관리자</h2>
          <p class="card-desc">세대 관리 · 승인 · 입출차 · 주차 통계</p>
          <div class="card-arrow">→</div>
        </div>
      </div>
    </main>

    <!-- 하단 푸터 -->
    <footer class="landing-footer">
      <p>아파트엔에 오신 것을 환영합니다</p>
      <div class="footer-links">
        <span>이용약관</span>
        <span class="sep">|</span>
        <span>개인정보처리방침</span>
        <span class="sep">|</span>
        <span>고객센터</span>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router'
const router = useRouter()

function goTo(path) {
  router.push(path)
}
</script>

<style scoped>
.landing-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0F1923 0%, #1A2332 50%, #0D1520 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  top: 30%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 500px;
  height: 500px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(79,110,247,0.08) 0%, transparent 70%);
  pointer-events: none;
}

/* 헤더 */
.landing-header {
  width: 100%;
  padding: 20px 40px;
  display: flex;
  align-items: center;
}
.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #4973E5;
  color: #fff;
  font-size: 14px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}
.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
}

/* 메인 */
.landing-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 20px;
}
.sub-title {
  font-size: 11px;
  font-weight: 600;
  color: rgba(255,255,255,0.3);
  letter-spacing: 4px;
  margin-bottom: 20px;
}
.main-title {
  font-size: 52px;
  font-weight: 800;
  color: #fff;
  margin: 0;
}
.main-desc {
  font-size: 16px;
  color: #8B92A0;
  margin-top: 12px;
}
.divider-bar {
  width: 50px;
  height: 3px;
  border-radius: 2px;
  background: rgba(79,110,247,0.6);
  margin: 28px 0 40px;
}

/* 카드 */
.card-row {
  display: flex;
  gap: 24px;
}
.select-card {
  width: 320px;
  padding: 32px;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  overflow: hidden;
}
.select-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 48px rgba(0,0,0,0.3);
}

.resident-card {
  background: linear-gradient(135deg, #4973E5 0%, #3B5BDB 100%);
  border: 1px solid rgba(255,255,255,0.12);
}
.admin-card {
  background: linear-gradient(135deg, #2D3142 0%, #1A1A2E 100%);
  border: 1px solid rgba(255,255,255,0.08);
}

.card-icon-wrap {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}
.resident-card .card-icon-wrap { background: rgba(255,255,255,0.15); }
.admin-card .card-icon-wrap { background: rgba(255,255,255,0.08); }
.card-icon { font-size: 22px; }

.card-label {
  font-size: 11px;
  color: rgba(255,255,255,0.5);
  letter-spacing: 1px;
}
.card-title {
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  margin: 8px 0 10px;
}
.card-desc {
  font-size: 13px;
  margin: 0;
}
.resident-card .card-desc { color: rgba(255,255,255,0.6); }
.admin-card .card-desc { color: rgba(255,255,255,0.35); }

.card-arrow {
  position: absolute;
  bottom: 28px;
  right: 28px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  transition: transform 0.2s;
}
.resident-card .card-arrow { background: rgba(255,255,255,0.2); }
.admin-card .card-arrow { background: rgba(255,255,255,0.08); }
.select-card:hover .card-arrow { transform: translateX(4px); }

/* 푸터 */
.landing-footer {
  padding: 28px;
  text-align: center;
}
.landing-footer p {
  font-size: 12px;
  color: #8B92A0;
  margin-bottom: 8px;
}
.footer-links {
  font-size: 11px;
  color: #5A6070;
}
.footer-links .sep {
  margin: 0 8px;
  color: #3A3F4E;
}

/* 모바일 반응형 */
@media (max-width: 700px) {
  .card-row { flex-direction: column; }
  .select-card { width: 100%; max-width: 340px; }
  .main-title { font-size: 36px; }
}
</style>
