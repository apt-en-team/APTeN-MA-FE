<script setup>
import { reactive, computed, onMounted, onUnmounted } from 'vue'
import axios from '@/api/axios.js'

// 주차 현황 상태 데이터
const state = reactive({
  totalSpaces: 0,    // 전체 주차면 수
  currentCount: 0,   // 현재 주차 중인 차량 수
  availableCount: 0, // 잔여 주차면 수
  loading: true,     // 데이터 로딩 여부
})

// 주차 사용률 (현재 주차 중 / 전체 주차면 * 100)
const usageRate = computed(() =>
    state.totalSpaces > 0
        ? Math.round((state.currentCount / state.totalSpaces) * 100)
        : 0
)

// 사용률에 따른 상태 레이블 및 색상 (90% 이상: 혼잡, 70% 이상: 보통, 미만: 여유)
const statusLabel = computed(() => {
  if (usageRate.value >= 90) return { text: '혼잡', color: '#E74C3C', bg: '#FFF5F5' }
  if (usageRate.value >= 70) return { text: '보통', color: '#F59E0B', bg: '#FFFBEB' }
  return { text: '여유', color: '#2EAD5C', bg: '#F0FFF4' }
})

// 주차 현황 API 호출 (GET /parking/status)
// total_spaces / current_count snake_case 응답도 fallback 처리
// availableCount가 없으면 전체 - 현재로 직접 계산
const fetchStatus = async () => {
  state.loading = true
  try {
    const res = await axios.get('/parking/status')
    const data = res.data?.resultData ?? res.data
    state.totalSpaces    = data.totalSpaces    ?? data.total_spaces  ?? 0
    state.currentCount   = data.currentCount   ?? data.current_count ?? 0
    state.availableCount = data.availableCount ?? (state.totalSpaces - state.currentCount)
  } catch (e) {
    console.error('주차 현황 조회 실패', e)
  } finally {
    state.loading = false
  }
}

// 컴포넌트 마운트 시 최초 조회 후 30초마다 자동 갱신
// 컴포넌트 언마운트 시 타이머 제거
let timer = null
onMounted(() => {
  fetchStatus()
  timer = setInterval(fetchStatus, 30000)
})
onUnmounted(() => clearInterval(timer))
</script>

<template>
  <div class="parking-status-page">
    <div class="list-card">

      <!-- 헤더: 페이지 제목 + 수동 새로고침 버튼 -->
      <div class="card-header">
        <div class="card-title">
          <h3>주차 현황</h3>
          <p class="subtitle">실시간 주차 정보를 확인할 수 있습니다.</p>
        </div>
        <button class="btn-refresh" @click="fetchStatus">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23 4 23 10 17 10"/>
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
          </svg>
          새로고침
        </button>
      </div>

      <!-- 로딩 상태 -->
      <div v-if="state.loading" class="empty-state">불러오는 중...</div>

      <template v-else>

        <!-- 현재 주차장 혼잡도 상태 배지 (여유/보통/혼잡) -->
        <div class="status-banner" :style="{ background: statusLabel.bg, borderColor: statusLabel.color + '44' }">
          <span class="status-dot" :style="{ background: statusLabel.color }" />
          <span class="status-text">
            현재 주차장 상태:
            <strong :style="{ color: statusLabel.color }">{{ statusLabel.text }}</strong>
          </span>
        </div>

        <!-- 주차 사용률 게이지 바 (사용률에 따라 색상 변경) -->
        <div class="gauge-section">
          <div class="gauge-header">
            <span class="gauge-label">주차 사용률</span>
            <span class="gauge-rate" :style="{ color: usageRate >= 90 ? '#E74C3C' : usageRate >= 70 ? '#F59E0B' : '#4973E5' }">
              {{ usageRate }}%
            </span>
          </div>
          <div class="gauge-track">
            <div
                class="gauge-fill"
                :style="{
                width: usageRate + '%',
                background: usageRate >= 90 ? '#E74C3C' : usageRate >= 70 ? '#F59E0B' : '#4973E5'
              }"
            />
          </div>
          <div class="gauge-footer">
            <span>사용 {{ state.currentCount }}면</span>
            <span>여유 {{ state.availableCount }}면</span>
          </div>
        </div>

        <!-- 전체/현재/잔여 주차면 통계 카드 3개 -->
        <div class="stat-grid">

          <!-- 전체 주차면 -->
          <div class="stat-card">
            <div class="stat-label">전체 주차면</div>
            <div class="stat-value">{{ state.totalSpaces }}<span class="stat-unit">면</span></div>
            <div class="stat-sub">총 주차 가능 대수</div>
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <path d="M9 17V9h4a2 2 0 010 4H9"/>
              </svg>
            </div>
          </div>

          <!-- 현재 주차 중인 차량 수 (혼잡도에 따라 색상 변경) -->
          <div class="stat-card">
            <div class="stat-label">현재 주차 중</div>
            <div class="stat-value" :style="{ color: statusLabel.color }">
              {{ state.currentCount }}<span class="stat-unit">대</span>
            </div>
            <div class="stat-sub" :style="{ color: statusLabel.color }">{{ statusLabel.text }}</div>
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
                <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
                <circle cx="7" cy="17" r="2"/>
                <path d="M9 17h6"/>
                <circle cx="17" cy="17" r="2"/>
              </svg>
            </div>
          </div>

          <!-- 잔여 주차면 (0이면 빨강/만차, 아니면 초록/주차가능) -->
          <div class="stat-card">
            <div class="stat-label">잔여 주차면</div>
            <div class="stat-value" :style="{ color: state.availableCount === 0 ? '#E74C3C' : '#2EAD5C' }">
              {{ state.availableCount }}<span class="stat-unit">면</span>
            </div>
            <div class="stat-sub" :style="{ color: state.availableCount === 0 ? '#E74C3C' : '#2EAD5C' }">
              {{ state.availableCount === 0 ? '만차' : '주차 가능' }}
            </div>
            <div class="stat-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="1.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
          </div>

        </div>

        <!-- 자동 갱신 안내 문구 -->
        <div class="info-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4973E5" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          주차 현황은 30초마다 자동으로 갱신됩니다.
        </div>

      </template>
    </div>
  </div>
</template>

<style scoped>
.parking-status-page {
  padding: 0;
  min-height: 100vh;
}

.list-card {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 헤더 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.card-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #aaa;
  margin: 0;
}

.btn-refresh {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 20px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-refresh:hover { background: #3a5bd9; }

/* 로딩 */
.empty-state {
  text-align: center;
  padding: 60px 0;
  color: #aaa;
  font-size: 14px;
}

/* 상태 배너 */
.status-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  border: 1px solid;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.3; }
}

.status-text {
  font-size: 13px;
  color: #687282;
}

/* 게이지 */
.gauge-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px;
  background: #F8FAFC;
  border-radius: 12px;
  border: 1px solid #E2E8F0;
}

.gauge-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.gauge-label { font-size: 13px; font-weight: 600; color: #687282; }
.gauge-rate  { font-size: 22px; font-weight: 800; }

.gauge-track {
  width: 100%;
  height: 12px;
  background: #E2E8F0;
  border-radius: 99px;
  overflow: hidden;
}

.gauge-fill {
  height: 100%;
  border-radius: 99px;
  transition: width 0.8s ease;
}

.gauge-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #aaa;
}

/* 통계 카드 */
.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  border: 1px solid #ECEEF3;
  position: relative;
}

.stat-label {
  font-size: 12px;
  color: #999;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-unit {
  margin-left: 5px;
  font-size: 14px;
  font-weight: 400;
  color: #999;
}

.stat-sub {
  font-size: 11px;
  color: #2EAD5C;
  margin-top: 4px;
}

.stat-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  opacity: 0.6;
}

/* 안내 */
.info-box {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  background: #F7F8FF;
  border-radius: 8px;
  font-size: 12px;
  color: #687282;
}
</style>