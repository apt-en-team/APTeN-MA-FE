<template>
  <div class="layout">
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
        <router-link to="/admin/dashboard" class="nav-item">대시보드</router-link>
        <router-link to="/admin/households" class="nav-item">세대 관리</router-link>

        <div class="nav-group">COMMUNITY</div>
        <router-link to="/admin/boards" class="nav-item">게시판 관리</router-link>

        <div class="nav-group">VEHICLE / PARKING</div>
        <router-link to="/admin/vehicles" class="nav-item">전체 차량 목록</router-link>
        <router-link to="/admin/visitor-vehicles" class="nav-item">방문차량 승인</router-link>
        <router-link to="/admin/parking-logs" class="nav-item">입출차 기록</router-link>
        <router-link to="/admin/parking-dashboard" class="nav-item">주차 현황</router-link>
        <router-link to="/admin/parking-stats" class="nav-item">주차 통계</router-link>

        <div class="nav-group">FACILITY / RESERVATION</div>
        <router-link to="/admin/facilities" class="nav-item">시설 관리</router-link>
        <router-link to="/admin/reservations" class="nav-item">전체 예약 현황</router-link>
      </nav>

      <div class="sidebar-profile">
        <div class="profile-avatar">관</div>
        <div>
          <div class="profile-name">{{ auth.user?.name || '관리자' }}</div>
          <div class="profile-info">{{ auth.user?.email }}</div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-title">{{ currentTitle }}</div>
        <button @click="handleLogout" class="btn-logout">로그아웃</button>
      </header>
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/modules/auth.js'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const currentTitle = computed(() => route.name || '관리자 대시보드')

async function handleLogout() {
  await auth.logout()
  router.push('/login')
}
</script>

<style scoped>
.layout { display: flex; min-height: 100vh; }
.sidebar {
  width: 240px; background: #1A1A2E; border-right: 1px solid #2D3142;
  display: flex; flex-direction: column; flex-shrink: 0;
}
.sidebar-logo {
  padding: 20px; border-bottom: 1px solid #2D3142;
  display: flex; align-items: center; gap: 10px;
}
.logo-icon {
  width: 36px; height: 36px; border-radius: 10px;
  background: #2D3142; color: #fff; font-size: 16px; font-weight: bold;
  display: flex; align-items: center; justify-content: center;
}
.logo-text { font-size: 16px; font-weight: 700; color: #fff; }
.logo-role { font-size: 11px; color: #7B7F8E; }
.sidebar-nav { flex: 1; padding: 16px 12px; overflow-y: auto; }
.nav-group {
  font-size: 10px; font-weight: 600; color: #5A5E6E;
  letter-spacing: 1px; padding: 12px 12px 6px;
}
.nav-item {
  display: block; padding: 10px 12px; border-radius: 8px;
  font-size: 13px; color: #8B8FA0; text-decoration: none; margin-bottom: 2px;
}
.nav-item:hover { background: #2D3142; color: #ccc; }
.nav-item.router-link-active {
  background: #2D3142; color: #fff; font-weight: 600;
}
.sidebar-profile {
  padding: 16px; border-top: 1px solid #2D3142;
  display: flex; align-items: center; gap: 10px;
}
.profile-avatar {
  width: 34px; height: 34px; border-radius: 50%; background: #2D3142;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 600; color: #aaa;
}
.profile-name { font-size: 13px; font-weight: 600; color: #fff; }
.profile-info { font-size: 11px; color: #7B7F8E; }
.main { flex: 1; display: flex; flex-direction: column; background: #F5F6FA; }
.topbar {
  height: 60px; background: #fff; border-bottom: 1px solid #E8EBF0;
  display: flex; align-items: center; justify-content: space-between; padding: 0 28px;
}
.topbar-title { font-size: 16px; font-weight: 600; color: #1A1A2E; }
.btn-logout {
  padding: 7px 16px; border-radius: 6px; border: 1px solid #E0E3EB;
  background: #fff; font-size: 13px; color: #666; cursor: pointer;
}
.btn-logout:hover { background: #F5F6FA; }
.content { flex: 1; padding: 28px; overflow-y: auto; }
</style>
