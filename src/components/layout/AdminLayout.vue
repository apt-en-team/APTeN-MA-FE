<script setup>
import {computed, ref, onMounted, onBeforeUnmount, provide} from "vue";
import {useRoute, useRouter} from "vue-router";
import {useAuthStore} from "@/stores/modules/auth.js";
import reservationAPI from "@/api/reservation";
import notificationAPI from "@/api/notification.js";

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const currentTitle = computed(() => route.meta.title || "관리자 대시보드");

const facilityStatusSuffix = computed(() => {
  if (route.name !== "AdminFacilityStatus") return "";
  const typeId = Number(route.params.typeId || 1);
  const typeNameMap = {1: "독서실", 2: "헬스장", 3: "골프연습장", 4: "GX"};
  return typeNameMap[typeId] || "";
});

const todayStr = computed(() => {
  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const day = days[d.getDay()];
  return `${yyyy}.${mm}.${dd} (${day})`;
});

async function handleLogout() {
  await auth.logout();
  router.push("/");
}

const gxPendingCount = ref(0);

const fetchGxPendingCount = async () => {
  try {
    const res = await reservationAPI.getAdminReservations({status: "PENDING", size: 1, page: 1});
    gxPendingCount.value = res.data.resultData?.totalElements || 0;
  } catch (e) {
    console.error(e);
  }
};

const goToGxPage = () => {
  router.push({name: "AdminFacilityStatus", params: {typeId: 4}});
};

const goBackToReservationList = () => {
  router.push("/admin/reservations");
};

const openModalFn = ref(null);
provide("registerOpenModal", (fn) => {
  openModalFn.value = fn;
});

const handleActionClick = () => {
  if (openModalFn.value) openModalFn.value();
};

const goToFacilityStatus = () => {
  router.push("/admin/reservations/facility-status/1");
};

// ── 알림 관련 ─────────────────────────────────────────────────

const bellOpen = ref(false);
const notifications = ref([]);
const unreadCount = ref(0);

const fetchUnreadCount = async () => {
  try {
    const res = await notificationAPI.getUnreadCount();
    unreadCount.value = res.data.resultData || 0;
  } catch (e) {
    console.error(e);
  }
};

const fetchNotifications = async () => {
  try {
    const res = await notificationAPI.getNotifications();
    notifications.value = res.data.resultData || [];
  } catch (e) {
    console.error(e);
  }
};

const toggleBell = async () => {
  bellOpen.value = !bellOpen.value;
  if (bellOpen.value) await fetchNotifications();
};

const handleNotificationClick = async (notification) => {
  if (!notification.read) {
    await notificationAPI.markAsRead(notification.notificationId);
    notification.read = true;
    unreadCount.value = Math.max(0, unreadCount.value - 1);
  }
};

const handleMarkAllAsRead = async () => {
  await notificationAPI.markAllAsRead();
  notifications.value.forEach((n) => (n.read = true));
  unreadCount.value = 0;
};

const bellRef = ref(null);
const handleOutsideClick = (e) => {
  if (bellRef.value && !bellRef.value.contains(e.target)) {
    bellOpen.value = false;
  }
};

const formatTime = (createdAt) => {
  const diff = Math.floor((Date.now() - new Date(createdAt).getTime()) / 1000);
  if (diff < 60) return "방금 전";
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

const typeColor = (type) => {
  if (type === "NEW_MEMBER") return "#6366f1";
  if (type === "NEW_VEHICLE") return "#f59e0b";
  return "#64748b";
};

const typeLabel = (type) => {
  if (type === "NEW_MEMBER") return "회원";
  if (type === "NEW_VEHICLE") return "차량";
  return "알림";
};

onMounted(() => {
  fetchGxPendingCount();
  fetchUnreadCount();
  const timer = setInterval(fetchUnreadCount, 30000);
  document.addEventListener("click", handleOutsideClick);
  onBeforeUnmount(() => {
    clearInterval(timer);
    document.removeEventListener("click", handleOutsideClick);
  });
});
</script>

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
        <router-link to="/admin/dashboard" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/>
            <rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/>
          </svg>
          대시보드
        </router-link>
        <router-link to="/admin/households" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          세대 관리
        </router-link>

        <div class="nav-group">COMMUNITY</div>
        <router-link to="/admin/board" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          게시판 관리
        </router-link>
        <router-link to="/admin/board/write" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          공지사항 작성
        </router-link>

        <div class="nav-group">VEHICLE</div>
        <router-link to="/admin/vehicles" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="3" width="15" height="13" rx="2"/>
            <path d="M16 8h4l3 5v3h-7V8z"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
          입주민 차량 목록
        </router-link>
        <router-link to="/admin/visitor-vehicles" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          방문 차량 목록
        </router-link>
        <router-link to="/admin/visitor-vehicles/fixed" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          고정 방문차량 목록
        </router-link>

        <div class="nav-group">PARKING</div>
        <router-link to="/admin/parking-logs" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          입출차 기록
        </router-link>
        <router-link to="/admin/parking-dashboard" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          주차 현황
        </router-link>
        <router-link to="/admin/parking-stats" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          주차 통계
        </router-link>

        <div class="nav-group">FACILITY / RESERVATION</div>
        <router-link to="/admin/facility" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          시설 관리
        </router-link>
        <router-link to="/admin/reservations" class="nav-item">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          전체 예약 현황
        </router-link>
      </nav>

      <div class="sidebar-profile">
        <div class="profile-avatar">관</div>
        <div class="profile-info-wrap">
          <div class="profile-name">{{ auth.user?.name || "관리자" }}</div>
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

    <div class="main">
      <header class="topbar">
        <div class="topbar-left">
          <h1 class="topbar-title">{{ currentTitle }}</h1>
          <p class="topbar-sub">{{ todayStr }} · APTEN 아파트</p>
        </div>
        <div class="topbar-right">

          <!-- 알림 벨 (아이콘만) -->
          <div class="bell-wrap" ref="bellRef">
            <button class="btn-bell" @click.stop="toggleBell">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <span v-if="unreadCount > 0" class="bell-badge">{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
            </button>

            <!-- 드롭다운 -->
            <div v-if="bellOpen" class="bell-dropdown">
              <div class="bell-dropdown-header">
                <div class="bell-header-left">
                  <span class="bell-dropdown-title">알림</span>
                  <span v-if="unreadCount > 0" class="bell-unread-pill">{{ unreadCount }}개 미확인</span>
                </div>
                <button v-if="unreadCount > 0" class="btn-read-all" @click="handleMarkAllAsRead">
                  모두 읽음
                </button>
              </div>

              <div class="bell-dropdown-body">
                <div v-if="notifications.length === 0" class="bell-empty">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" stroke-width="1.5">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                  </svg>
                  <p>새로운 알림이 없습니다</p>
                </div>

                <div
                    v-for="n in notifications"
                    :key="n.notificationId"
                    class="bell-item"
                    :class="{ unread: !n.read }"
                    @click="handleNotificationClick(n)"
                >
                  <div class="bell-item-icon" :style="{ background: typeColor(n.type) + '15' }">
                    <svg v-if="n.type === 'NEW_MEMBER'" width="14" height="14" viewBox="0 0 24 24" fill="none"
                         :stroke="typeColor(n.type)" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <svg v-else-if="n.type === 'NEW_VEHICLE'" width="14" height="14" viewBox="0 0 24 24" fill="none"
                         :stroke="typeColor(n.type)" stroke-width="2">
                      <rect x="1" y="3" width="15" height="13" rx="2"/>
                      <path d="M16 8h4l3 5v3h-7V8z"/>
                      <circle cx="5.5" cy="18.5" r="2.5"/>
                      <circle cx="18.5" cy="18.5" r="2.5"/>
                    </svg>
                  </div>

                  <div class="bell-item-content">
                    <div class="bell-item-top">
                      <span class="bell-item-type" :style="{ color: typeColor(n.type) }">{{ typeLabel(n.type) }}</span>
                      <span class="bell-item-time">{{ formatTime(n.createdAt) }}</span>
                    </div>
                    <p class="bell-item-msg">{{ n.message }}</p>
                  </div>

                  <span v-if="!n.read" class="bell-item-dot" :style="{ background: typeColor(n.type) }"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 페이지별 액션 버튼 -->
          <button v-if="route.name === 'AdminVisitorVehicleList'" class="btn-action" @click="handleActionClick">
            + 방문차량 등록
          </button>
          <button v-if="route.name === 'AdminFixedVisitorVehicleList'" class="btn-action" @click="handleActionClick">
            + 고정 방문차량 등록
          </button>
          <button v-if="route.name === 'AdminFacilityManage'" class="btn-action"
                  @click="router.push({ name: 'AdminFacilityRegister' })">
            + 시설 추가
          </button>
          <button v-if="route.name === 'AdminBoardList'" class="btn-action" @click="handleActionClick">
            + 공지 작성
          </button>
          <button v-if="route.name === 'AdminParkingLog'" class="btn-action" @click="handleActionClick">
            + 기록 등록
          </button>
          <button v-if="route.name === 'AdminVehicleListView'" class="btn-action" @click="handleActionClick">
            + 차량 등록
          </button>
          <button v-if="route.name === 'AdminFacilityStatus'" class="btn-action btn-secondary"
                  @click="goBackToReservationList">
            목록으로
          </button>
          <button
              v-if="gxPendingCount > 0 && (route.name === 'AdminReservationListView' || route.name === 'AdminFacilityStatus')"
              class="gx-pending-badge"
              @click="goToGxPage"
          >
            GX 승인 대기 {{ gxPendingCount }}건
          </button>
          <button v-if="route.name === 'AdminReservationListView'" class="btn-action" @click="goToFacilityStatus">
            시설별 현황 →
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
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

.layout {
  display: flex;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #f5f6f8;
}

.sidebar {
  width: 240px;
  height: 100vh;
  background: #1e2a3e;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-logo {
  padding: 24px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.logo-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #2b3a55;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-text {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.logo-role {
  font-size: 11px;
  color: #7b8ea8;
  margin-top: 2px;
}

.sidebar-nav {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
}

.nav-group {
  font-size: 10px;
  font-weight: 600;
  color: #687282;
  letter-spacing: 0.08em;
  padding: 14px 10px 5px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 9px 10px;
  border-radius: 7px;
  font-size: 13px;
  color: #8b9ab0;
  text-decoration: none;
  margin-bottom: 1px;
  transition: all 0.15s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #cbd5e0;
}

.nav-item.router-link-active {
  background: #2b3a55;
  color: #fff;
  font-weight: 600;
}

.nav-item svg {
  stroke: #8b9ab0 !important;
}

.sidebar-profile {
  padding: 16px 20px;
  flex-shrink: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  display: flex;
  align-items: center;
  gap: 10px;
}

.profile-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #2b3a55;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #aaa;
}

.profile-info-wrap { flex: 1; min-width: 0; }

.profile-name {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.profile-email {
  font-size: 11px;
  color: #7b8ea8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-logout-icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s, border-color 0.15s;
}

.btn-logout-icon:hover { background: rgba(255,255,255,0.08); border-color: red !important; }
.btn-logout-icon svg { color: #7b8ea8 !important; stroke: #7b8ea8 !important; }
.btn-logout-icon:hover svg { color: red !important; stroke: red !important; }

.main {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f6f8;
  overflow: hidden;
}

.topbar {
  height: 88px;
  flex-shrink: 0;
  background: #f5f6f8;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
}

.topbar-left { display: flex; flex-direction: column; gap: 4px; }
.topbar-title { font-size: 22px; font-weight: 700; color: #1a202c; line-height: 1; }
.topbar-sub { font-size: 12px; color: #687282; }
.topbar-right { display: flex; align-items: center; gap: 10px; }

/* ── 벨 버튼 (아이콘만) ── */
.bell-wrap { position: relative; }

.btn-bell {
  position: relative;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  color: #6b7280;
  transition: all 0.15s;
}

.btn-bell:hover {
  border-color: #1A1A2E;
  color: #1A1A2E;
}

.btn-bell:hover svg { stroke: #1A1A2E; }

/* 뱃지 */
.bell-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 17px;
  height: 17px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  border: 2px solid #f5f6f8;
}

/* ── 드롭다운 (흰색 깔끔) ── */
.bell-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  background: #fff;
  border: 1px solid #e8ecf0;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.1), 0 2px 8px rgba(0, 0, 0, 0.06);
  z-index: 100;
  overflow: hidden;
}

.bell-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 18px 13px;
  border-bottom: 1px solid #f1f3f6;
}

.bell-header-left { display: flex; align-items: center; gap: 8px; }

.bell-dropdown-title {
  font-size: 14px;
  font-weight: 700;
  color: #111827;
}

/* 미확인 pill */
.bell-unread-pill {
  font-size: 11px;
  font-weight: 500;
  color: #ef4444;
  background: #fef2f2;
  padding: 2px 8px;
  border-radius: 99px;
}

.btn-read-all {
  font-size: 12px;
  color: #9ca3af;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 0.15s;
}

.btn-read-all:hover { color: #374151; }

.bell-dropdown-body {
  max-height: 380px;
  overflow-y: auto;
}

/* 알림 없을 때 */
.bell-empty {
  padding: 40px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.bell-empty p { font-size: 13px; color: #9ca3af; }

/* 알림 아이템 */
.bell-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 13px 18px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #f8f9fb;
}

.bell-item:last-child { border-bottom: none; }
.bell-item:hover { background: #fafbff; }

/* 읽지 않은 알림 */
.bell-item.unread { background: #f2f2fb; }
.bell-item.unread:hover { background: #ececf6; }

/* 타입 아이콘 원형 */
.bell-item-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.bell-item-content { flex: 1; min-width: 0; }

.bell-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 3px;
}

.bell-item-type {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.bell-item-time { font-size: 11px; color: #9ca3af; }

.bell-item-msg {
  font-size: 13px;
  color: #374151;
  line-height: 1.5;
  word-break: keep-all;
}

/* 읽지 않은 점 */
.bell-item-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
}

.btn-action {
  height: 36px;
  padding: 0 18px;
  background: #2b3a55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-action:hover { background: #1e2a3e; }

.content {
  flex: 1;
  padding: 20px 64px;
  overflow-y: auto;
}

.gx-pending-badge {
  height: 36px;
  padding: 0 14px;
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fcd34d;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}
</style>