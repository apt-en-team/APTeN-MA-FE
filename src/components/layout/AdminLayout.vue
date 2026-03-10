<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const route  = useRoute()
const router = useRouter()
const auth   = useAuthStore()

const currentTitle = computed(() => route.meta.title || '관리자 대시보드')

const todayStr = computed(() => {
  const days = ['일', '월', '화', '수', '목', '금', '토']
  const d    = new Date()
  const yyyy = d.getFullYear()
  const mm   = String(d.getMonth() + 1).padStart(2, '0')
  const dd   = String(d.getDate()).padStart(2, '0')
  const day  = days[d.getDay()]
  return `${yyyy}.${mm}.${dd} (${day})`
})

async function handleLogout() {
  await auth.logout()
  router.push('/')
}
</script>

<template>
  <div class="layout">
    <!-- 사이드바 -->
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="logo-icon">A</div>
        <div>
          <div class="logo-text">아파트엔</div>
          <div class="logo-role">관리자</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">MAIN</div>
        <router-link to="/admin/dashboard" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
          대시보드
        </router-link>
        <router-link to="/admin/households" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          세대 관리
        </router-link>      

        <div class="nav-group">COMMUNITY</div>
        <router-link to="/admin/boards" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          게시판 관리
        </router-link>

        <div class="nav-group">VEHICLE / PARKING</div>
        <router-link to="/admin/vehicles" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          전체 차량 목록
        </router-link>
        <router-link to="/admin/visitor-vehicles" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          방문차량 목록
        </router-link>
        <router-link to="/admin/parking-logs" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          입출차 기록
        </router-link>
        <router-link to="/admin/parking-dashboard" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          주차 현황
        </router-link>
        <router-link to="/admin/parking-stats" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          주차 통계
        </router-link>

        <div class="nav-group">FACILITY / RESERVATION</div>
        <router-link to="/admin/facilities" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          시설 관리
        </router-link>
        <router-link to="/admin/reservations" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          전체 예약 현황
        </router-link>
      </nav>

      <!-- 프로필 + 로그아웃 아이콘 -->
      <div class="sidebar-profile">
        <div class="profile-avatar">관</div>
        <div class="profile-info-wrap">
          <div class="profile-name">{{ auth.user?.name || '관리자' }}</div>
          <div class="profile-email">{{ auth.user?.email }}</div>
        </div>
        <button class="btn-logout-icon" @click="handleLogout" title="로그아웃">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>

    <!-- 메인 영역 -->
    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentTitle }}</h1>
          <p class="topbar-sub">{{ todayStr }} · APTEN 아파트</p>
        </div>
        <div class="topbar-right">
          <!-- 알림 버튼 -->
          <button class="btn-bell">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span class="bell-label">알림</span>
          </button>

          <!-- 공지 작성 (btn-bell 밖 독립 버튼) -->
          <button class="btn-notice">+ 공지 작성</button>

          <!-- 페이지별 액션 버튼 -->
          <button v-if="route.name === 'HouseholdManage'" class="btn-action">+ 세대 추가</button>
          <button v-if="route.name === 'FacilityManage'"  class="btn-action">+ 시설 추가</button>
          <button v-if="route.name === 'AdminBoardList'"  class="btn-action">+ 공지 작성</button>
        </div>
      </header>


      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.layout {
  display: flex;
  width: 100vw;
  min-height: 100vh;
  overflow: hidden;
  font-family: 'Noto Sans KR', sans-serif;
  color: #333333;
  background: #F5F6F8;
}

/* ── 사이드바 ── */
.sidebar {
  width: 240px;
  height: 1024px;
  background: #1E2A3E;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-logo {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-icon {
  width: 36px; height: 36px;
  border-radius: 8px; background: #2B3A55;
  color: #fff; font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

.logo-text { font-size: 15px; font-weight: 700; color: #fff; }
.logo-role { font-size: 11px; color: #7B8EA8; margin-top: 2px; }

.sidebar-nav { flex: 1; padding: 12px; overflow-y: auto; }

.nav-group {
  font-size: 10px; font-weight: 600; color: #4A5568;
  letter-spacing: 0.08em; padding: 14px 10px 5px;
}

.nav-item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 10px; border-radius: 7px;
  font-size: 13px; 
  color: #8B9AB0;
  text-decoration: none; margin-bottom: 1px;
  transition: all 0.15s; position: relative;
}

.nav-item:hover { background: rgba(255,255,255,0.06); color: #cbd5e0; }
.nav-item.router-link-active { background: #2B3A55; color: #fff; font-weight: 600; }

.nav-item svg {
   stroke: #8B9AB0 !important;
}


/* 프로필 영역 */
.sidebar-profile {
  padding: 16px 20px; flex-shrink: 0;
  border-top: 1px solid rgba(255,255,255,0.07);
  display: flex; align-items: center; gap: 10px;
}

.profile-avatar {
  width: 32px; height: 32px; border-radius: 50%;
  background: #2B3A55; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600; color: #aaa;
}

.profile-info-wrap { flex: 1; min-width: 0; }
.profile-name  { font-size: 13px; font-weight: 600; color: #fff; }
.profile-email { font-size: 11px; color: #7B8EA8; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* 로그아웃 아이콘 버튼 */
.btn-logout-icon {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;

  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.btn-logout-icon:hover {
  background: rgba(255,255,255,0.08);
  border-color: red !important;
}

.btn-logout-icon svg {
  color: #7B8EA8 !important;
  stroke: #7B8EA8 !important;
}

.btn-logout-icon:hover svg {
  color: red !important;
  stroke: red !important;
}

/* ── 메인 ── */
.main {
  flex: 1;
  height: 1024px;
  display: flex;
  flex-direction: column;
  background: #F5F6F8;
  overflow: hidden;
}

/* ── 탑바 ── */
.topbar {
  height: 84px;
  flex-shrink: 0;
  background: #F5F6F8;
  border-bottom: 1px solid #E2E8F0;
  display: flex; align-items: center;
  justify-content: space-between;
  padding: 0 64px; /* content와 동일하게 맞춤 */
}

.topbar-left { display: flex; flex-direction: column; gap: 4px; }
.topbar-title { font-size: 22px; font-weight: 700; color: #1A202C; line-height: 1; }
.topbar-sub   { font-size: 12px; color: #A0AEC0; }

.topbar-right { display: flex; align-items: center; gap: 10px; }

.btn-bell {
  display: flex; align-items: center; gap: 5px;
  position: relative;
  height: 36px; padding: 0 14px;
  border: 1px solid #E2E8F0; border-radius: 8px;
  background: #fff; cursor: pointer; color: #6B7280;
  font-size: 13px; font-family: 'Noto Sans KR', sans-serif;
}

.bell-badge {
  position: absolute; top: -4px; right: -4px;
  background: #E53E3E; color: #fff;
  font-size: 9px; font-weight: 700;
  width: 16px; height: 16px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}

.bell-label { font-size: 13px; color: #6B7280; }

/* 공지 작성 */
.btn-notice {
  height: 36px; padding: 0 16px;
  background: #2B3A55; color: #fff;
  border: none; border-radius: 7px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
  transition: background 0.15s;
}
.btn-notice:hover { background: #1E2A3E; }

/* 페이지별 액션 */
.btn-action {
  height: 36px; padding: 0 18px;
  background: #2B3A55; color: #fff;
  border: none; border-radius: 7px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: 'Noto Sans KR', sans-serif;
}
.btn-action:hover { background: #1E2A3E; }

/* ── 콘텐츠 ── */
.content {
  flex: 1;
  padding: 20px 32px;
  overflow-y: auto;
}
</style>