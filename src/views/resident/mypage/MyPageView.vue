<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import vehicleAPI from '@/api/vehicle.js'
import reservationAPI from '@/api/reservation.js'
import ConfirmModal from '@/components/common/ConfirmModal.vue'

const router = useRouter()
const auth = useAuthStore()

const showDeactivateConfirm = ref(false)
const errorMsg = ref('')

// 승인된 차량 수 (APPROVED 상태만 카운트)
const vehicleCount = ref(0)

// 내 예약 목록 (최근 3건, 예약 있을 때 카드에 표시)
const reservations = ref([])

// 관리자 연락처 (고정값)
const ADMIN_PHONE = '010-1234-5678'

onMounted(async () => {
  await auth.fetchMe()

  // 등록 차량 수 조회 (APPROVED 상태만 카운트)
  try {
    const res = await vehicleAPI.getMyVehicles()
    const vehicles = res.data?.resultData ?? []
    vehicleCount.value = vehicles.filter(v => v.status === 'APPROVED').length
  } catch (e) {
    console.error('차량 목록 조회 실패', e)
  }

  // 내 예약 목록 조회 (최근 3건)
  // 예약 있으면 카드에 목록 표시, 없으면 시설 목록으로 이동 버튼 표시
  try {
    const res = await reservationAPI.getMyReservations({page: 1, size: 3, tab: ''})
    console.log('예약 응답:', res.data)
    reservations.value = res.data?.resultData ?? []
  } catch (e) {
    console.error('예약 목록 조회 실패', e)
  }
})

// 예약 상태 → 한글 라벨 변환
const statusLabel = (status) => {
  if (status === 'PENDING') return '승인대기'
  if (status === 'CONFIRMED') return '예약완료'
  if (status === 'COMPLETED') return '이용완료'
  if (status === 'CANCELLED') return '취소완료'
  return status
}

// 예약 상태 → 뱃지 색상 클래스 반환
const statusColor = (status) => {
  if (status === 'PENDING') return 'orange'
  if (status === 'CONFIRMED') return 'blue'
  if (status === 'COMPLETED') return 'gray'
  if (status === 'CANCELLED') return 'red'
  return 'gray'
}

// 로그아웃 처리
async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

// 회원 탈퇴 처리
async function handleDeactivate() {
  try {
    await auth.deactivate()
    router.push('/login')
  } catch (e) {
    errorMsg.value = '탈퇴 처리에 실패했습니다'
  }
}
</script>

<template>
  <div class="mypage">
    <div class="content-wrapper">

      <!-- 왼쪽 패널: 프로필 + 세대 정보 -->
      <div class="left-panel">
        <div class="avatar-wrap">
          <div class="avatar"></div>
          <div class="online-dot"></div>
        </div>
        <p class="user-name">{{ auth.user?.name || '-' }}</p>
        <p class="user-household">{{ auth.user?.dong }} {{ auth.user?.ho }}</p>
        <div class="line"></div>
        <div class="section-title-row">
          <span class="title-text">🏠 세대 정보</span>
          <router-link to="/resident/mypage/edit" class="edit-link">수정 →</router-link>
        </div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">동/호수</span>
            <span class="info-value">
              {{ auth.user?.dong && auth.user?.ho ? `${auth.user.dong} ${auth.user.ho}` : '-' }}
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">등록 차량</span>
            <span class="info-value">{{ vehicleCount > 0 ? `${vehicleCount}대` : '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">관리자 연락처</span>
            <span class="info-value">{{ ADMIN_PHONE }}</span>
          </div>
        </div>
      </div>

      <!-- 오른쪽 패널 -->
      <div class="right-panel">

        <!-- 빠른 메뉴 카드 -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-icon">⚡</span>
            <h3>빠른 메뉴</h3>
          </div>
          <div class="quick-grid">
            <router-link to="/resident/my-vehicle" class="quick-item">
              <div class="quick-icon" style="background:#EBF5FF;">🚗</div>
              <span>내 차량 등록</span>
            </router-link>
            <router-link to="/resident/visitor-vehicles" class="quick-item">
              <div class="quick-icon" style="background:#FFF8E8;">📋</div>
              <span>방문 등록</span>
            </router-link>
            <router-link to="/resident/board/my-posts" class="quick-item">
              <div class="quick-icon" style="background:#F0F0FF;">👤</div>
              <span>내가 쓴 글</span>
            </router-link>
            <!-- 시설 예약 → 시설 목록 페이지로 이동 -->
            <router-link to="/resident/facility" class="quick-item">
              <div class="quick-icon" style="background:#EDFAF4;">🏋️</div>
              <span>시설 예약</span>
            </router-link>
            <router-link to="/resident/board/form" class="quick-item">
              <div class="quick-icon" style="background:#F5EEFF;">✏️</div>
              <span>글 작성</span>
            </router-link>
            <router-link to="/resident/board/notice" class="quick-item">
              <div class="quick-icon" style="background:#FFF0EC;">🔔</div>
              <span>공지사항</span>
            </router-link>
          </div>
        </div>

        <!-- 내 예약 현황 카드 -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-icon">📅</span>
            <h3>내 예약 현황</h3>
            <router-link to="/resident/my-reservation" class="more-link">예약하기 →</router-link>
          </div>

          <!-- 예약 없을 때: 시설 목록 페이지로 이동 -->
          <div v-if="reservations.length === 0" class="reservation-empty">
            <p>예약 내역이 없습니다</p>
            <router-link to="/resident/facility" class="btn-reserve">예약하러 가기</router-link>
          </div>

          <!-- 예약 있을 때: 목록 표시 (클릭 시 내 예약 페이지로 이동) -->
          <div v-else class="reservation-list">
            <div
                v-for="res in reservations"
                :key="res.reservationId"
                class="reservation-item"
                @click="router.push('/resident/my-reservation')"
            >
              <div class="res-left">
                <!-- 상태 뱃지 -->
                <span :class="['res-badge', `res-badge--${statusColor(res.status)}`]">
                  {{ statusLabel(res.status) }}
                </span>
                <div>
                  <div class="res-facility">{{ res.facilityName }}</div>
                  <div class="res-date">
                    {{ res.reservationDate }} ·
                    {{ String(res.startTime).slice(0, 5) }} ~ {{ String(res.endTime).slice(0, 5) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 하단 버튼: 로그아웃 / 회원 탈퇴 -->
    <div class="bottom-buttons">
      <button class="btn-logout" @click="handleLogout">↪ 로그아웃</button>
      <button class="btn-deactivate" @click="showDeactivateConfirm = true">⊗ 회원 탈퇴</button>
    </div>

    <!-- 탈퇴 확인 모달 -->
    <ConfirmModal
        v-if="showDeactivateConfirm"
        title="정말 탈퇴하시겠습니까?"
        subtitle="탈퇴 후에는 복구가 불가능합니다."
        subtitle-color="#E53E3E"
        item-label="계정"
        :item-name="auth.user?.email || '-'"
        confirm-text="탈퇴하기"
        confirm-type="danger"
        theme="resident"
        @confirm="handleDeactivate"
        @cancel="showDeactivateConfirm = false"
    />
  </div>
</template>

<style scoped>
.mypage {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.content-wrapper {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.left-panel {
  width: 220px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  background: #fff;
  border-radius: 16px;
  padding: 28px 30px 24px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.avatar-wrap {
  position: relative;
  width: 72px;
  height: 72px;
  margin: 0 auto 12px;
}

.avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #E0E3EA;
}

.online-dot {
  position: absolute;
  bottom: 3px;
  right: 3px;
  width: 13px;
  height: 13px;
  background: #2EAD5C;
  border-radius: 50%;
  border: 2px solid #fff;
}

.user-name {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 4px;
}

.user-household {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.section-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.line {
  width: 100%;
  height: 1px;
  background: #E0E3EB;
  margin: 16px 0;
}

.title-text {
  font-size: 14px;
  font-weight: 700;
  text-align: left;
  color: #333;
}

.edit-link {
  margin-left: auto;
  font-size: 12px;
  color: #4973E5;
  text-decoration: none;
  font-weight: 600;
}

.edit-link:hover {
  text-decoration: underline;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.info-label {
  font-size: 11px;
  color: #aaa;
}

.info-value {
  font-size: 13px;
  font-weight: 600;
  color: #333;
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 18px;
}

.card-header-icon {
  font-size: 16px;
}

.card-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0;
}

.more-link {
  margin-left: auto;
  font-size: 12px;
  color: #4973E5;
  text-decoration: none;
  font-weight: 600;
}

.more-link:hover {
  text-decoration: underline;
}

.quick-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 10px;
  border-radius: 12px;
  background: #F8F9FC;
  text-decoration: none;
  color: #333;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid #F0F1F5;
  transition: background 0.15s, transform 0.15s;
}

.quick-item:hover {
  background: #EEF1FF;
  transform: translateY(-2px);
}

.quick-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

/* 예약 없을 때 */
.reservation-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28px 0;
  gap: 12px;
}

.reservation-empty p {
  font-size: 14px;
  color: #bbb;
  margin: 0;
}

.btn-reserve {
  padding: 8px 20px;
  background: #F0F2FF;
  color: #4973E5;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  text-decoration: none;
}

.btn-reserve:hover {
  background: #E0E5FF;
}

/* 예약 있을 때 목록 */
.reservation-list {
  display: flex;
  flex-direction: column;
}

.reservation-item {
  display: flex;
  align-items: center;
  padding: 12px 4px;
  border-bottom: 1px solid #F7F8FA;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.1s;
}

.reservation-item:last-child {
  border-bottom: none;
}

.reservation-item:hover {
  background: #F7F8FC;
}

.res-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.res-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  white-space: nowrap;
  margin-top: 2px;
}

.res-badge--blue {
  background: #EEF0FD;
  color: #4973E5;
}

.res-badge--orange {
  background: #FFF4E5;
  color: #F59E0B;
}

.res-badge--gray {
  background: #F3F4F6;
  color: #9CA3AF;
}

.res-badge--red {
  background: #FFECEC;
  color: #EF4444;
}

.res-facility {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.res-date {
  font-size: 12px;
  color: #888;
  margin-top: 2px;
}

.bottom-buttons {
  display: flex;
  justify-content: center;
  gap: 10px;
}

.btn-logout, .btn-deactivate {
  padding: 10px 20px;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-logout {
  background: #fff;
  border: 1px solid #E0E3EB;
  color: #555;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.btn-logout:hover {
  background: #F5F6FA;
}

.btn-deactivate {
  background: #fff;
  border: 1px solid #FFCDD2;
  color: #E05555;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
}

.btn-deactivate:hover {
  background: #FFF5F5;
}
</style>