<script setup>
import { ref, computed } from 'vue'

// 현재 날짜 계산 
const currentDate = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d = new Date()
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} (${days[d.getDay()]})`
})

// 방문차량 목록
const visitorVehicles = ref([
  { plate: '12가 3456', resident: '김철수', unit: '101동 1201호', purpose: '택배 수령', date: '2025.02.24 (토) 방문' },
  { plate: '34나 7890', resident: '이영희', unit: '103동 502호', purpose: '친적 방문', date: '2025.02.24 (토) 방문' },
  { plate: '56다 1234', resident: '박민수', unit: '102동 801호', purpose: '인테리어', date: '2025.02.25 (일) 방문' },
])

// 시설 예약 현황 
// barColor: 'dark' | 'green' | 'yellow'
// isFull: true이면 퍼센트·현재수 빨간색 표시
const facilities = ref([
  { name: '헬스장',    hours: '06:00-22:00 · 정원 30명', current: 8,  total: 16, percent: 50, barColor: 'dark',   isFull: false },
  { name: '독서실',    hours: '09:00-22:00 · 정원 20명', current: 3,  total: 13, percent: 23, barColor: 'green',  isFull: false },
  { name: '골프 연습장', hours: '08:00-20:00 · 정원 8명',  current: 10, total: 12, percent: 83, barColor: 'yellow', isFull: true  },
])

//  최근 입출차 기록 
// direction: 'IN' | 'OUT'
// typeClass: 'type-registered' | 'type-unregistered' | 'type-visitor'
const entryRecords = ref([
  { direction: 'IN',  plate: '23가 5678', type: '등록 차량',   typeClass: 'type-registered',   unit: '101동 1201호', time: '09:23' },
  { direction: 'OUT', plate: '45나 1234', type: '등록 차량',   typeClass: 'type-registered',   unit: '103동 502호',  time: '09:15' },
  { direction: 'IN',  plate: '78다 9012', type: '미등록 차량', typeClass: 'type-unregistered', unit: '-',            time: '09:02' },
  { direction: 'OUT', plate: '12가 3456', type: '방문 차량',   typeClass: 'type-visitor',      unit: '102동 801호',  time: '08:47' },
])

//  최근 게시판 활동 
// tagClass: 'tag-notice' | 'tag-free'
// comments: null이면 댓글 아이콘 미표시
const boardPosts = ref([
  { id: 1, tag: '공지', tagClass: 'tag-notice', title: '2025년 12월 정기 주차장 청소 안내', author: '관리사무소',          views: '조회 124', comments: null, date: '2025.02.23' },
  { id: 2, tag: '자유', tagClass: 'tag-free',   title: '1층 로비 택배 분실 관련 문의',      author: '김가은 · 101동 1201호', views: '',         comments: 5,    date: '2025.02.23' },
  { id: 3, tag: '공지', tagClass: 'tag-notice', title: '겨울철 난방 설비 점검 결과 공지',   author: '관리사무소',          views: '조회 98',  comments: null, date: '2025.02.22' },
])

// 알림 패널 토글 (추후 구현)
const toggleAlarm = () => {
  alert('알림 패널 (추후 구현)')
}
</script>


<template>
  <div class="dashboard-wrapper">

    <!--  요약 카드 (승인, 주차, 예약 세대)  -->
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

          <!-- 주차 점유율 프로그레스바 -->
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

    <!--  중간 행: 방문차량 / 예약 현황 -->
    <section class="middle-grid">

      <!-- 방문차량 관리 패널 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">방문차량 관리</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>

        <!-- 방문차량 리스트 -->
        <div class="visitor-list">
          <div v-for="vehicle in visitorVehicles" :key="vehicle.plate" class="visitor-item">

            <!-- 차량 아이콘 -->
            <div class="visitor-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="9" width="22" height="9" rx="2"/>
                <path d="M5 9V6a2 2 0 012-2h10a2 2 0 012 2v3"/>
                <circle cx="7" cy="18" r="2"/>
                <circle cx="17" cy="18" r="2"/>
              </svg>
            </div>

            <!-- 차량 정보: 번호판 / 세대·목적 / 방문일 -->
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

      <!-- 오늘 시설 예약 현황 패널 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">오늘 시설 예약 현황</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>

        <!-- 시설 리스트 -->
        <div class="facility-list">
          <div v-for="facility in facilities" :key="facility.name" class="facility-item">

            <!-- 왼쪽 컬러 바 (barColor에 따라 색상 결정) -->
            <div class="facility-bar" :class="'bar-' + facility.barColor"></div>

            <!-- 시설명 + 운영시간 -->
            <div class="facility-left">
              <strong class="facility-name">{{ facility.name }}</strong>
              <span class="facility-time">{{ facility.hours }}</span>
            </div>

            <!-- 오른쪽: 프로그레스바 + 타임 수 + 퍼센트 -->
            <div class="facility-right">
              <div class="facility-name-row">
                <div class="progress-bar">
                  <div class="progress-fill" :class="facility.barColor" :style="{ width: facility.percent + '%' }"></div>
                </div>

                <!-- isFull이면 현재 타임 수 빨간색 -->
                <span class="facility-count">
                  <span :class="['count-current', facility.isFull ? 'count-red' : '']">{{ facility.current }}</span>
                  / {{ facility.total }} 타임
                </span>
              </div>

              <!-- isFull이면 퍼센트 빨간색 -->
              <span class="facility-percent" :class="facility.isFull ? 'text-red' : ''">{{ facility.percent }}%</span>
            </div>
          </div>
        </div>

        <div class="panel-footer">
          <a href="#" class="footer-link">시설 예약 현황 목록 보기 →</a>
        </div>
      </div>

    </section>

    <!-- ── 하단 행: 입출차 기록 / 게시판 활동 ────────────── -->
    <section class="bottom-grid">

      <!-- 최근 입출차 기록 패널 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">최근 입출차 기록</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>

        <!-- 입출차 테이블 -->
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

              <!-- IN/OUT 방향 태그 -->
              <td>
                <span :class="['tag-direction', record.direction === 'IN' ? 'tag-in' : 'tag-out']">
                  {{ record.direction }}
                </span>
              </td>
              <td class="plate-cell">{{ record.plate }}</td>

              <!-- 차량 유형 태그 (등록/미등록/방문) -->
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

      <!-- 최근 게시판 활동 패널 -->
      <div class="panel">
        <div class="panel-header">
          <h2 class="panel-title">최근 게시판 활동</h2>
          <a href="#" class="panel-more">전체보기 →</a>
        </div>

        <!-- 게시글 리스트 -->
        <div class="board-list">
          <div v-for="post in boardPosts" :key="post.id" class="board-item">

            <!-- 왼쪽: 태그 + 제목/작성자 -->
            <div class="board-left">
              <span :class="['board-tag', post.tagClass]">{{ post.tag }}</span>
              <div class="board-content">
                <span class="board-title">{{ post.title }}</span>
                <span class="board-meta">{{ post.author }} · {{ post.views }}</span>
              </div>
            </div>

            <!-- 오른쪽: 댓글 수(있을 때만) + 날짜 -->
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


<style scoped>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

/* 대시보드 래퍼 */
.dashboard-wrapper {
  width: 100%;
  max-width: 100%;
  padding: 0 32px;
}

/* 요약 카드 그리드 (4열) */
.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.summary-card {
  background: #fff;
  border-radius: 15px;
  padding: 15px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border: 1px solid #e9ecf1;
}

/* 카드 내용 영역: 라벨 / 수치 / 서브텍스트를 상하 균등 배치 */
.card-info {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 90px;
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
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

.card-sub {
  font-size: 12px;
  color: #6B7280;
}

/* 서브텍스트 색상 변형 */
.highlight-orange { color: #C08B2D !important; }
.highlight-green  { color: #4D8B5A !important; }

/* 카드 우측 아이콘 */
.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.card-icon svg { width: 20px; height: 20px; }

/* 아이콘 색상 테마 */
.icon-orange { background: #FDF6E8; color: #C08B2D; }
.icon-blue   { background: #E8EBF2; color: #2B3A55; }
.icon-green  { background: #C6F6D5; color: #4D8B5A; }
.icon-gray   { background: #EDEEF2; color: #6B7280; }

/* 주차 현황 카드 내 프로그레스바 여백 */
.progress-bar-wrap { margin: 6px 0 2px; }

/* 공통 프로그레스바 */
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

/* 프로그레스바 색상 */
.progress-fill.blue   { background: #3b82f6; }
.progress-fill.green  { background: #4D8B5A; }
.progress-fill.dark   { background: #2B3A55; }
.progress-fill.yellow { background: #C08B2D; }

/* 중간/하단 2열 그리드 */
.middle-grid,
.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 20px;
}

/* 패널 공통 스타일 */
.panel {
  background: #fff;
  border-radius: 15px;
  border: 1px solid #e9ecf1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

/* 패널 헤더: 제목 + 전체보기 링크 */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 10px;
}

.panel-title {
  font-size: 19px;
  font-weight: 700;
  color: #333333;
}

.panel-more {
  font-size: 13px;
  color: #3D5170;
  text-decoration: none;
}

.panel-more:hover { color: #3b6ef8; }

/* 패널 푸터: 목록 보기 링크 */
.panel-footer {
  padding-top: 12px;
  text-align: center;
}

.footer-link {
  font-size: 12px;
  color: #3D5170;
  text-decoration: none;
}

.footer-link:hover { color: #3b6ef8; }

/* 방문차량 리스트 */
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

/* 차량 아이콘 원형 배경 */
.visitor-icon {
  width: 36px;
  height: 36px;
  background: #E8EBF2;
  border-radius: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.visitor-icon svg {
  width: 18px;
  height: 18px;
  color: #2B3A55;
}

.visitor-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.visitor-plate { font-size: 14px; font-weight: 700; color: #333333; }
.visitor-detail { font-size: 12px; color: #687282; }
.visitor-date   { font-size: 11px; color: #687282; }

/* 시설 예약 현황 리스트 */
.facility-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* 시설 아이템: 컬러바 | 이름+시간 | 프로그레스+타임수 */
.facility-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 15px 16px;
  border-radius: 10px;
  background: #f9fafb;
  justify-content: space-between;
}

/* 왼쪽 컬러 바 */
.facility-bar {
  width: 4px;
  height: 44px;
  border-radius: 5px;
  flex-shrink: 0;
}

/* 컬러 바 색상 */
.bar-dark   { background: #2B3A55; }
.bar-green  { background: #4D8B5A; }
.bar-yellow { background: #C08B2D; }

/* 시설명 + 운영시간 영역 */
.facility-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 100px;
}

/* 프로그레스바 + 타임수 + 퍼센트 영역 */
.facility-right {
  width: 160px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 프로그레스바와 타임 수를 한 줄에 배치 */
.facility-name-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.facility-name-row .progress-bar { flex: 1; }

.facility-name  { font-size: 14px; font-weight: 600; color: #333333; }
.facility-count { font-size: 12px; color: #92959D; }
.facility-time  { font-size: 12px; color: #687282; }

/* 타임 수 색상: 기본 초록, 만석이면 빨간색 */
.count-current { font-weight: 700; color: #4D8B5A; }
.count-red     { color: #C08B2D !important; }

.facility-percent { font-size: 12px; color: #6B7280; min-width: 32px; }

/* 만석일 때 빨간색 */
.text-red { color: #E53E3E !important; }

/* 입출차 기록 테이블 */
.entry-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.entry-table th {
  text-align: left;
  font-size: 11px;
  font-weight: 600;
  color: #687282;
  padding: 4px 8px 10px;
  border-bottom: 1px solid #f3f4f6;
  letter-spacing: 1.5px;
}

.entry-table td {
  padding: 10px 8px;
  border-bottom: 1px solid #F7F8FA;
  color: #374151;
}

.entry-table tr:last-child td { border-bottom: none; }

/* IN/OUT 방향 태그 */
.tag-direction {
  display: block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 0;
  border-radius: 5px;
  min-width: 36px;
  text-align: center;
}

.tag-in  { background: #C6F6D5; color: #4D8B5A; }
.tag-out { background: #FFF5F5; color: #E53E3E; }

/* 차량 유형 태그 */
.tag-type {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 5px;
}

.type-registered   { background: #E8EBF2; color: #2B3A55; }
.type-unregistered { background: #FDF6E8; color: #C08B2D; }
.type-visitor      { background: #EDEEF2; color: #6B7280; }

.plate-cell { color: #333333; }
.unit-cell  { color: #687282; }
.time-cell  { color: #92959D; font-size: 13px; }

/* 게시판 활동 리스트 */
.board-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* 게시글 아이템: 배경 + 라운드 */
.board-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #f9fafb;
  border-radius: 10px;
  margin-bottom: 8px;
}

.board-item:last-child { margin-bottom: 0; }

/* 왼쪽: 태그 + 제목/작성자 */
.board-left {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1;
}

/* 게시글 유형 태그 */
.board-tag {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 5px;
  flex-shrink: 0;
  margin-top: 1px;
}

.tag-notice { background: #1E2A3E; color: #FFFFFF; }
.tag-free   { background: #EDF2F7; color: #4A5568; }

.board-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.board-title { font-size: 13px; font-weight: 500; color: #111827; }
.board-meta  { font-size: 11px; color: #687282; }

/* 오른쪽: 댓글 수 + 날짜 */
.board-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  margin-left: 12px;
}

/* 댓글 수 (있을 때만 표시) */
.board-comments {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 18px;
  color: #C08B2D;
  font-weight: 600;
}

.board-comments svg { width: 13px; height: 13px; }

.board-date { font-size: 11px; color: #92959D; }
</style>