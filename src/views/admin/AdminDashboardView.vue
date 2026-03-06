<template>
  <div class="dashboard-wrapper">
    
    <!-- Summary Cards -->
    <section class="summary-grid">
      <!-- 승인 대기 -->
      <div class="summary-card">
        <div class="card-info">
          <span class="card-label">승인 대기</span>
          <div class="card-value">3 <span class="card-unit">건</span></div>
          <span class="card-sub highlight-orange">방문차량 승인 필요</span>
        </div>
        <div class="card-icon icon-orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
      </div>

      <!-- 주차 현황 -->
      <div class="summary-card">
        <div class="card-info">
          <span class="card-label">주차 현황</span>
          <div class="card-value">78 <span class="card-unit">%</span></div>
          <div class="progress-bar-wrap">
            <div class="progress-bar">
              <div class="progress-fill blue" style="width: 78%"></div>
            </div>
          </div>
          <span class="card-sub">156 / 200면 사용중</span>
        </div>
        <div class="card-icon icon-blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 17V9h4a2 2 0 010 4H9"/>
          </svg>
        </div>
      </div>

      <!-- 오늘 예약 -->
      <div class="summary-card">
        <div class="card-info">
          <span class="card-label">오늘 예약</span>
          <div class="card-value">12 <span class="card-unit">건</span></div>
          <span class="card-sub highlight-green">전일 대비 +3건</span>
        </div>
        <div class="card-icon icon-green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
        </div>
      </div>

      <!-- 전체 세대 -->
      <div class="summary-card">
        <div class="card-info">
          <span class="card-label">전체 세대</span>
          <div class="card-value">248 <span class="card-unit">세대</span></div>
          <span class="card-sub">등록 회원 412명</span>
        </div>
        <div class="card-icon icon-gray">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9,22 9,12 15,12 15,22"/>
          </svg>
        </div>
      </div>
    </section>

    <!-- Middle Row -->
    <section class="middle-grid">
      <!-- 방문차량 관리 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">방문차량 관리</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>
        <div class="visitor-list">
          <div v-for="vehicle in visitorVehicles" :key="vehicle.plate" class="visitor-item">
            <div class="visitor-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="9" width="22" height="9" rx="2"/>
                <path d="M5 9V6a2 2 0 012-2h10a2 2 0 012 2v3"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
            </div>
            <div class="visitor-info">
              <strong class="visitor-plate">{{ vehicle.plate }}</strong>
              <span class="visitor-detail">{{ vehicle.resident }} · {{ vehicle.unit }} · {{ vehicle.purpose }}</span>
              <span class="visitor-date">{{ vehicle.date }}</span>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <a href="#" class="footer-link">전체 승인 대기 목록 보기 →</a>
        </div>
      </div>

      <!-- 오늘 시설 예약 현황 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">오늘 시설 예약 현황</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>
        <div class="facility-list">
          <div v-for="facility in facilities" :key="facility.name" class="facility-item">
            <div class="facility-info">
              <div class="facility-name-row">
                <strong class="facility-name">{{ facility.name }}</strong>
                <span class="facility-count">
                  <span :class="['count-current', facility.isFull ? 'count-red' : '']">{{ facility.current }}</span>
                  / {{ facility.total }} 타임
                </span>
              </div>
              <span class="facility-time">{{ facility.hours }}</span>
              <div class="facility-progress">
                <div class="progress-bar">
                  <div
                    class="progress-fill"
                    :class="facility.barColor"
                    :style="{ width: facility.percent + '%' }"
                  ></div>
                </div>
                <span class="facility-percent" :class="facility.isFull ? 'text-red' : ''">{{ facility.percent }}%</span>
              </div>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <a href="#" class="footer-link">시설 예약 현황 목록 보기 →</a>
        </div>
      </div>
    </section>

    <!-- Bottom Row -->
    <section class="bottom-grid">
      <!-- 최근 입출차 기록 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">최근 입출차 기록</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>
        <table class="entry-table">
          <thead>
            <tr>
              <th>구분</th>
              <th>차량번호</th>
              <th>유형</th>
              <th>세대</th>
              <th>시각</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in entryRecords" :key="record.plate + record.time">
              <td>
                <span :class="['tag-direction', record.direction === 'IN' ? 'tag-in' : 'tag-out']">
                  {{ record.direction }}
                </span>
              </td>
              <td class="plate-cell">{{ record.plate }}</td>
              <td>
                <span :class="['tag-type', record.typeClass]">{{ record.type }}</span>
              </td>
              <td class="unit-cell">{{ record.unit }}</td>
              <td class="time-cell">{{ record.time }}</td>
            </tr>
          </tbody>
        </table>
        <div class="panel-footer">
          <a href="#" class="footer-link">전체 입출차 기록 보기 →</a>
        </div>
      </div>

      <!-- 최근 게시판 활동 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">최근 게시판 활동</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>
        <div class="board-list">
          <div v-for="post in boardPosts" :key="post.id" class="board-item">
            <div class="board-left">
              <span :class="['board-tag', post.tagClass]">{{ post.tag }}</span>
              <div class="board-content">
                <span class="board-title">{{ post.title }}</span>
                <span class="board-meta">{{ post.author }} · {{ post.views }}</span>
              </div>
            </div>
            <div class="board-right">
              <span v-if="post.comments" class="board-comments">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                </svg>
                {{ post.comments }}
              </span>
              <span class="board-date">{{ post.date }}</span>
            </div>
          </div>
        </div>
        <div class="panel-footer">
          <a href="#" class="footer-link">전체 게시글 목록 보기 →</a>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

// 현재 날짜
const currentDate = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} (${days[d.getDay()]})`
})

// 방문차량
const visitorVehicles = ref([
  { plate: '12가 3456', resident: '김철수', unit: '101동 1201호', purpose: '택배 수령', date: '2025.02.24 (토) 방문' },
  { plate: '34나 7890', resident: '이영희', unit: '103동 502호', purpose: '친적 방문', date: '2025.02.24 (토) 방문' },
  { plate: '56다 1234', resident: '박민수', unit: '102동 801호', purpose: '인테리어', date: '2025.02.25 (일) 방문' },
])

// 시설
const facilities = ref([
  { name: '헬스장', hours: '06:00-22:00 · 정원 30명', current: 8, total: 16, percent: 50, barColor: 'dark', isFull: false },
  { name: '독서실', hours: '09:00-22:00 · 정원 20명', current: 3, total: 13, percent: 23, barColor: 'green', isFull: false },
  { name: '골프 연습장', hours: '08:00-20:00 · 정원 8명', current: 10, total: 12, percent: 83, barColor: 'yellow', isFull: true },
])

// 입출차 기록
const entryRecords = ref([
  { direction: 'IN',  plate: '23가 5678', type: '등록 차량', typeClass: 'type-registered', unit: '101동 1201호', time: '09:23' },
  { direction: 'OUT', plate: '45나 1234', type: '등록 차량', typeClass: 'type-registered', unit: '103동 502호', time: '09:15' },
  { direction: 'IN',  plate: '78다 9012', type: '미등록 차량', typeClass: 'type-unregistered', unit: '-', time: '09:02' },
  { direction: 'OUT', plate: '12가 3456', type: '방문 차량', typeClass: 'type-visitor', unit: '102동 801호', time: '08:47' },
])

// 게시판
const boardPosts = ref([
  { id: 1, tag: '공지', tagClass: 'tag-notice', title: '2025년 12월 정기 주차장 청소 안내', author: '관리사무소', views: '조회 124', comments: null, date: '2025.02.23' },
  { id: 2, tag: '자유', tagClass: 'tag-free', title: '1층 로비 택배 분실 관련 문의', author: '김가은 · 101동 1201호', views: '', comments: 5, date: '2025.02.23' },
  { id: 3, tag: '공지', tagClass: 'tag-notice', title: '겨울철 난방 설비 점검 결과 공지', author: '관리사무소', views: '조회 98', comments: null, date: '2025.02.22' },
])

const toggleAlarm = () => {
  alert('알림 패널 (추후 구현)')
}
</script>

<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.dashboard-wrapper {
  min-height: 0px;
  width: 1136px;
  margin-left: 0px;
  padding: 0px 28px;
  font-family: 'Noto Sans KR';
}


/* Summary Grid */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid #e9ecf1;
}

.card-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.card-label {
  font-size: 12px;
  color: #687282;
  font-weight: 500;
}

.card-value {
  font-size: 30px;
  font-weight: 800;
  color: #333333;
  line-height: 1.2;
}

.card-unit {
  font-size: 14px;
  font-weight: 500;
  color: #6b7280;
}

.card-sub {
  font-size: 11px;
  color: #9ca3af;
  margin-top: 2px;
}

.highlight-orange { color: #C08B2D !important; }
.highlight-green  { color: #4D8B5A !important; }

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg {
  width: 20px;
  height: 20px;
}

.icon-orange { background: #FDF6E8; color: #C08B2D; }
.icon-blue   { background: #E8EBF2; color: #2B3A55; }
.icon-green  { background: #ecfdf5; color: #4D8B5A; }
.icon-gray   { background: #f9fafb; color: #6b7280; }

.progress-bar-wrap {
  margin: 6px 0 2px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.4s ease;
}

.progress-fill.blue   { background: #3b82f6; }
.progress-fill.green  { background: #10b981; }
.progress-fill.dark   { background: #374151; }
.progress-fill.yellow { background: #f59e0b; }

/* Middle & Bottom Grid */
.middle-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

/* Panel */
.panel {
  background: #fff;
  border-radius: 14px;
  border: 1px solid #e9ecf1;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.panel-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.panel-more {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: none;
}

.panel-more:hover {
  color: #3b6ef8;
}

.panel-footer {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.footer-link {
  font-size: 12px;
  color: #9ca3af;
  text-decoration: none;
}

.footer-link:hover {
  color: #3b6ef8;
}

/* Visitor List */
.visitor-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.visitor-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: 10px;
  background: #f9fafb;
}

.visitor-icon {
  width: 36px;
  height: 36px;
  background: #e5e7eb;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.visitor-icon svg {
  width: 18px;
  height: 18px;
  color: #6b7280;
}

.visitor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.visitor-plate {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

.visitor-detail {
  font-size: 12px;
  color: #6b7280;
}

.visitor-date {
  font-size: 11px;
  color: #9ca3af;
}

/* Facility List */
.facility-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.facility-item {
  display: flex;
  flex-direction: column;
}

.facility-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2px;
}

.facility-name {
  font-size: 14px;
  font-weight: 600;
  color: #111827;
}

.facility-count {
  font-size: 13px;
  color: #6b7280;
}

.count-current { font-weight: 700; color: #111827; }
.count-red     { color: #ef4444 !important; }

.facility-time {
  font-size: 11px;
  color: #9ca3af;
  margin-bottom: 6px;
}

.facility-progress {
  display: flex;
  align-items: center;
  gap: 8px;
}

.facility-progress .progress-bar {
  flex: 1;
}

.facility-percent {
  font-size: 12px;
  font-weight: 600;
  color: #6b7280;
  min-width: 32px;
}

.text-red { color: #ef4444 !important; }

/* Entry Table */
.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.entry-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #9ca3af;
  padding: 4px 8px 10px;
  border-bottom: 1px solid #f3f4f6;
}

.entry-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #f9fafb;
  color: #374151;
}

.entry-table tr:last-child td {
  border-bottom: none;
}

.tag-direction {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 4px;
}

.tag-in  { background: #ecfdf5; color: #059669; }
.tag-out { background: #fff1f2; color: #e11d48; }

.tag-type {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.type-registered   { background: #eff6ff; color: #3b82f6; }
.type-unregistered { background: #fff7ed; color: #f59e0b; }
.type-visitor      { background: #f5f3ff; color: #7c3aed; }

.plate-cell { font-weight: 600; color: #111827; }
.unit-cell  { color: #6b7280; }
.time-cell  { color: #9ca3af; font-size: 12px; }

/* Board List */
.board-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.board-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.board-item:last-child {
  border-bottom: none;
}

.board-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

.board-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tag-notice { background: #eff6ff; color: #3b82f6; }
.tag-free   { background: #f3f4f6; color: #6b7280; }

.board-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.board-title {
  font-size: 13px;
  font-weight: 500;
  color: #111827;
}

.board-meta {
  font-size: 11px;
  color: #9ca3af;
}

.board-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

.board-comments {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 12px;
  color: #3b82f6;
  font-weight: 600;
}

.board-comments svg {
  width: 13px;
  height: 13px;
}

.board-date {
  font-size: 11px;
  color: #9ca3af;
}
</style>