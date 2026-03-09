<script setup>
import {computed} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const currentTitle = computed(() => route.meta.title || '대시보드')

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <!-- 로고 -->
      <div class="sidebar-logo">
        <div class="logo-icon">A</div>
        <div>
          <div class="logo-text">APTEN</div>
          <div class="logo-role">아파트</div>
        </div>
      </div>

      <!-- 네비게이션 -->
      <nav class="sidebar-nav">

        <div class="nav-group">메인</div>
        <router-link to="/resident/dashboard" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          대시보드
        </router-link>

        <router-link to="/resident/mypage" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          마이페이지
        </router-link>

        <div class="nav-group">차량</div>
        <router-link to="/resident/my-vehicle" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="16.5" cy="17.5" r="2.5"/>
          </svg>
          내 차량
        </router-link>

        <router-link to="/resident/visitor-vehicles" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="16.5" cy="17.5" r="2.5"/>
            <line x1="12" y1="5" x2="12" y2="1"/>
            <line x1="10" y1="3" x2="14" y2="3"/>
          </svg>
          방문차량 등록
          <span v-if="visitorBadge > 0" class="badge">{{ visitorBadge }}</span>
        </router-link>

        <router-link to="/resident/visitor-vehicles/list" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          방문차량 목록
        </router-link>

        <div class="nav-group">시설</div>
        <router-link to="/resident/facility" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M2 21h20M3 7v14M21 7v14M6 3h12v4H6zM9 11h2M13 11h2M9 15h2M13 15h2"/>
          </svg>
          시설 목록
        </router-link>

        <router-link to="/resident/my-reservation" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          내 예약
        </router-link>

        <div class="nav-group">커뮤니티</div>
        <router-link to="/resident/board/notice" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          공지사항
          <span v-if="noticeBadge > 0" class="badge">{{ noticeBadge }}</span>
        </router-link>

        <router-link to="/resident/board" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          자유게시판
        </router-link>

        <router-link to="/resident/my-posts" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          내가 쓴 글
        </router-link>

      </nav>

      <!-- 프로필 -->
      <div class="sidebar-profile">
        <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || 'U' }}</div>
        <div class="profile-info">
          <div class="profile-name">{{ auth.user?.name || '사용자' }}</div>
          <div class="profile-status">
            <span class="status-dot"></span>
            온라인 인증 이용
          </div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-title">{{ currentTitle }}</div>
      </header>
      <main class="content">
        <router-view/>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 전체 레이아웃 */
* { margin: 0; padding: 0; box-sizing: border-box; }
.layout {
  display: flex;
  min-height: 100vh;
  background: #EEF3FB;
}

/* 사이드바 */
.sidebar {
  width: 240px;
  min-width: 240px;
  background: #fff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  margin: 0;
  position: sticky;
  top: 0;
  height: 100vh;
}

.sidebar-logo {
  padding: 24px 20px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: #4973E5; color: #fff; font-size: 16px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}
.logo-text { font-size: 15px; font-weight: 700; color: #333333; }
.logo-role { font-size: 11px; color: #999; }

/* 네비게이션 */
.sidebar-nav { flex: 1; padding: 8px 0; overflow-y: auto; }
.nav-group {
  font-size: 10px; font-weight: 600; color: #B0B5C3;
  letter-spacing: 0.5px; padding: 14px 20px 5px;
}
.nav-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 20px;
  border-radius: 0;
  font-size: 13px; color: #666; text-decoration: none;
  margin-bottom: 0; position: relative;
  transition: color 0.15s, background 0.15s;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  color: #4973E5;
  font-weight: 600;
  border-left: 3px solid transparent;
}
.nav-item:hover .nav-icon { stroke: #4973E5; }

.nav-item.router-link-active {
  background: #EEF3FB;
  color: #4973E5;
  font-weight: 600;
  border-left: 3px solid #4973E5;
}
.nav-item.router-link-active .nav-icon { stroke: #4973E5; }

.nav-icon {
  width: 16px; height: 16px; flex-shrink: 0;
  stroke: #9CA3AF; transition: stroke 0.15s;
}

.badge {
  margin-left: auto; background: #EF4444; color: #fff;
  font-size: 10px; font-weight: 700; min-width: 18px; height: 18px;
  border-radius: 99px; display: flex; align-items: center;
  justify-content: center; padding: 0 5px;
}

/* 프로필 */
.sidebar-profile {
  padding: 14px 16px; border-top: 1px solid #E8EBF0;
  display: flex; align-items: center; gap: 10px;
}
.profile-avatar {
  width: 34px; height: 34px; border-radius: 50%; background: #EEF3FB;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #4973E5; flex-shrink: 0;
}
.profile-name { font-size: 13px; font-weight: 600; color: #333333; }
.profile-status {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; color: #999; margin-top: 2px;
}

.status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #22C55E; flex-shrink: 0;
}

/* 메인 */
.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #EEF3FB;
  overflow-y: auto;
}

.topbar {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}

.topbar-title {
  font-size: 24px;
  font-weight: 800;
  color: #1A1A2E;
}

.content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 36px 48px;
}
</style>