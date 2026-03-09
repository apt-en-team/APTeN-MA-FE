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
      <div class="sidebar-logo">
        <div class="logo-icon">A</div>
        <div>
          <div class="logo-text">아파트엔</div>
          <div class="logo-role">입주민</div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-group">MAIN</div>
        <router-link to="/resident/dashboard" class="nav-item">대시보드</router-link>

        <div class="nav-group">COMMUNITY</div>
        <router-link to="/resident/boards" class="nav-item">게시판</router-link>

        <div class="nav-group">VEHICLE / PARKING</div>
        <router-link to="/resident/vehicles" class="nav-item">내 차량</router-link>
        <router-link to="/resident/visitor-vehicles" class="nav-item">방문차량</router-link>
        <router-link to="/resident/parking/status" class="nav-item">주차 현황</router-link>

        <div class="nav-group">FACILITY / RESERVATION</div>
        <router-link to="/resident/facilities" class="nav-item">시설</router-link>
        <router-link to="/resident/reservations" class="nav-item">내 예약</router-link>

        <div class="nav-group">MY</div>
        <router-link to="/resident/mypage" class="nav-item">마이페이지</router-link>
      </nav>

      <div class="sidebar-profile">
        <div class="profile-avatar">{{ auth.user?.name?.charAt(0) || 'U' }}</div>
        <div>
          <div class="profile-name">{{ auth.user?.name || '사용자' }}</div>
          <div class="profile-info">{{ auth.user?.dong }} {{ auth.user?.ho }}</div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-title">{{ currentTitle }}</div>
        <button @click="handleLogout" class="btn-logout">로그아웃</button>
      </header>
      <main class="content">
        <router-view/>
      </main>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: flex;
  min-height: 100vh;
}

.sidebar {
  width: 240px;
  background: #fff;
  border-right: 1px solid #E8EBF0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-logo {
  padding: 20px;
  border-bottom: 1px solid #F0F1F5;
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #4973E5;
  color: #fff;
  font-size: 16px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
}

.logo-role {
  font-size: 11px;
  color: #999;
}

.sidebar-nav {
  flex: 1;
  padding: 16px 12px;
  overflow-y: auto;
}

.nav-group {
  font-size: 10px;
  font-weight: 600;
  color: #B0B5C3;
  letter-spacing: 1px;
  padding: 12px 12px 6px;
}

.nav-item {
  display: block;
  padding: 10px 12px;
  border-radius: 8px;
  font-size: 13px;
  color: #666;
  text-decoration: none;
  margin-bottom: 2px;
}

.nav-item:hover {
  background: #F3F5F9;
  color: #333;
}

.nav-item.router-link-active {
  background: #EEF1FF;
  color: #4973E5;
  font-weight: 600;
}

.sidebar-profile {
  padding: 16px;
  border-top: 1px solid #F0F1F5;
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #E8EBF0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #777;
}

.profile-name {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.profile-info {
  font-size: 11px;
  color: #999;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #EEF3FB;
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

.btn-logout {
  padding: 7px 16px;
  border-radius: 6px;
  border: 1px solid #E0E3EB;
  background: #fff;
  font-size: 13px;
  color: #666;
  cursor: pointer;
}

.btn-logout:hover {
  background: #F5F6FA;
}

.content {
  flex: 1;
  padding: 28px;
  overflow-y: auto;
}
</style>
