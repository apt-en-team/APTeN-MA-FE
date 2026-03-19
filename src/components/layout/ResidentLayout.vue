<script setup>
import {computed, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const visitorBadge = ref(0)
const noticeBadge = ref(0)

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
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z"/>
          </svg>
          대시보드
        </router-link>

        <router-link to="/resident/mypage" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
          </svg>
          마이페이지
        </router-link>

        <div class="nav-group">차량</div>
        <router-link to="/resident/my-vehicle" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
            <circle cx="7" cy="17" r="2"/>
            <path d="M9 17h6"/>
            <circle cx="17" cy="17" r="2"/>
          </svg>
          내 차량
        </router-link>

        <router-link to="/resident/visitor-vehicles/list" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 0 1 0 3.75H5.625a1.875 1.875 0 0 1 0-3.75Z" />
          </svg>
          방문차량 목록
        </router-link>

        <router-link to="/resident/visitor-vehicles/fixed" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M5 17H3a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1l2-3h10l2 3h1a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2"/>
            <circle cx="7.5" cy="17.5" r="2.5"/>
            <circle cx="16.5" cy="17.5" r="2.5"/>
            <path d="M12 2v4M10 4h4"/>
            <path d="M17 9l2 2-2 2"/>
          </svg>
          고정 방문차량 목록
        </router-link>

        <router-link to="/resident/parking/status" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
          </svg>
          주차 현황
        </router-link>

        <div class="nav-group">시설</div>
        <router-link to="/resident/facility" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"/>
          </svg>
          시설 목록
        </router-link>

        <router-link to="/resident/my-reservation" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/>
          </svg>
          내 예약
        </router-link>

        <div class="nav-group">커뮤니티</div>
        <router-link to="/resident/board/notice" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path stroke-linecap="round" stroke-linejoin="round" d="M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 1 1 0-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 0 1-1.44-4.282m3.102.069a18.03 18.03 0 0 1-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 0 1 8.835 2.535M10.34 6.66a23.847 23.847 0 0 0 8.835-2.535m0 0A23.74 23.74 0 0 0 18.795 3m.38 1.125a23.91 23.91 0 0 1 1.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 0 0 1.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 0 1 0 3.46" />
          </svg>
          공지사항
          <span v-if="noticeBadge > 0" class="badge">{{ noticeBadge }}</span>
        </router-link>

        <router-link to="/resident/board" class="nav-item">
          <svg class="nav-icon" fill="none" viewBox="0 0 24 24" stroke-width="1.8" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
          </svg>
          자유게시판
        </router-link>

        <router-link to="/resident/board/my-posts" class="nav-item">
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125"/>
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
        <div class="header-actions">
        <button class="btn-bell">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
          </svg>
          알림
        </button>
        <button class="btn-setting">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z"/>
            <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
          </svg>
          설정
        </button>
      </div>
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

/* topbar */

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar {
  height: 62px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
}

.topbar-title {
  font-size: 24px;
  font-weight: 800;
  color: #1A1A2E;
}
.btn-bell {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #555;
  cursor: pointer;
}
.btn-bell:hover { background: #F5F6FA; }

.btn-setting {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}
.btn-setting:hover { background: #F5F6FA; }


.content {
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 10px 48px;
}
</style>