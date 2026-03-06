<script setup>
import { useAuthStore } from '@/stores/modules/auth.js'
const auth = useAuthStore()
</script>

<template>
  <div>
    <h2 class="page-title">안녕하세요, {{ auth.user?.name }}님</h2>
    <p class="page-desc">{{ auth.user?.dong }} {{ auth.user?.ho }} · 오늘의 아파트 소식을 확인하세요</p>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="stat-label">내 차량</div>
        <div class="stat-value">0 <span class="stat-unit">대</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">예약 현황</div>
        <div class="stat-value">0 <span class="stat-unit">건</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">방문차량</div>
        <div class="stat-value">0 <span class="stat-unit">건</span></div>
      </div>
      <div class="stat-card">
        <div class="stat-label">주차 현황</div>
        <div class="stat-value">- <span class="stat-unit">%</span></div>
      </div>
    </div>

    <div class="card-grid">
      <div class="card">
        <div class="card-header">
          <span class="card-title">최신 공지사항</span>
          <span class="card-more">더보기 →</span>
        </div>
        <div class="card-body">
          <p class="empty-text">아직 공지사항이 없습니다</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">내 예약 현황</span>
          <span class="card-more">더보기 →</span>
        </div>
        <div class="card-body">
          <p class="empty-text">예약 내역이 없습니다</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page-title { font-size: 22px; font-weight: 700; color: #1A1A2E; margin: 0; }
.page-desc { font-size: 13px; color: #999; margin-top: 4px; margin-bottom: 24px; }
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
.stat-card {
  background: #fff; border-radius: 12px; padding: 20px;
  border: 1px solid #ECEEF3;
}
.stat-label { font-size: 12px; color: #999; margin-bottom: 8px; }
.stat-value { font-size: 26px; font-weight: 700; color: #1A1A2E; }
.stat-unit { font-size: 13px; font-weight: 400; color: #999; }
.card-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.card { background: #fff; border-radius: 12px; border: 1px solid #ECEEF3; }
.card-header {
  padding: 16px 20px; border-bottom: 1px solid #F3F4F8;
  display: flex; justify-content: space-between; align-items: center;
}
.card-title { font-size: 14px; font-weight: 600; color: #333; }
.card-more { font-size: 12px; color: #999; cursor: pointer; }
.card-body { padding: 20px; }
.empty-text { font-size: 13px; color: #ccc; text-align: center; margin: 20px 0; }
</style>
