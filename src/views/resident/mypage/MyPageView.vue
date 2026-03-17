<script setup>
import {onMounted, ref} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import Modal from '@/components/Modal.vue'

const router = useRouter()
const auth = useAuthStore()

// 회원 탈퇴 확인 모달 표시 여부
const showDeactivateConfirm = ref(false)
// 에러 메시지
const errorMsg = ref('')

// 컴포넌트 마운트 시 내 정보 조회
onMounted(async () => {
  await auth.fetchMe()
})

// 로그아웃 후 로그인 페이지로 이동
async function handleLogout() {
  await auth.logout()
  router.push('/login')
}

// 회원 탈퇴 처리 후 로그인 페이지로 이동
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

      <!-- 왼쪽 패널 -->
      <div class="left-panel">

        <!-- 프로필 -->

        <div class="avatar-wrap">
          <div class="avatar"></div>
          <div class="online-dot"></div>
        </div>
        <p class="user-name">{{ auth.user?.name || '-' }}</p>
        <p class="user-household">{{ auth.user?.dong }} {{ auth.user?.ho }}</p>
        <div class="line"></div>
        <!-- 세대 정보 -->
        <div class="section-title-row">
          <span class="title-text">🏠 세대 정보</span>
          <router-link to="/resident/mypage/edit" class="edit-link">수정 →</router-link>
        </div>
        <div class="info-list">
          <div class="info-item">
            <span class="info-label">동/호수</span>
            <span class="info-value">{{
                auth.user?.dong && auth.user?.ho ? `${auth.user.dong} ${auth.user.ho}` : '-'
              }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">입주일</span>
            <span class="info-value">-</span>
          </div>
          <div class="info-item">
            <span class="info-label">등록 차량</span>
            <span class="info-value">-</span>
          </div>
          <div class="info-item">
            <span class="info-label">관리자 연락처</span>
            <span class="info-value">-</span>
          </div>
        </div>


      </div>

      <!-- 오른쪽 패널 -->
      <div class="right-panel">

        <!-- 빠른 메뉴 -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-icon">⚡</span>
            <h3>빠른 메뉴</h3>a
          </div>
          <div class="quick-grid">
            <router-link to="/resident/my-vehicle" class="quick-item">
              <div class="quick-icon" style="background:#EBF5FF;">🚗</div>
              <span>내 차량 등록</span>
            </router-link>
            <router-link to="/resident/visitor-vehicles" class="quick-item">
              <div class="quick-icon" style="background:#FFF8E8;">🚙</div>
              <span>방문차량 등록</span>
            </router-link>
            <router-link to="/resident/board" class="quick-item">
              <div class="quick-icon" style="background:#F0F0FF;">👤</div>
              <span>내가 쓴 글</span>
            </router-link>
            <router-link to="/resident/reservation" class="quick-item">
              <div class="quick-icon" style="background:#EDFAF4;">🏋️</div>
              <span>시설 예약</span>
            </router-link>
            <router-link to="/resident/board/form" class="quick-item">
              <div class="quick-icon" style="background:#F5EEFF;">✏️</div>
              <span>글 작성</span>
            </router-link>
            <router-link to="/resident/board" class="quick-item">
              <div class="quick-icon" style="background:#FFF0EC;">🔔</div>
              <span>공지사항</span>
            </router-link>
          </div>
        </div>

        <!-- 내 예약 현황 -->
        <div class="card">
          <div class="card-header">
            <span class="card-header-icon">📅</span>
            <h3>내 예약 현황</h3>
            <router-link to="/resident/my-reservation" class="more-link">예약하기 →</router-link>
          </div>
          <div class="reservation-empty">
            <p>예약 내역이 없습니다</p>
            <router-link to="/resident/reservation" class="btn-reserve">예약하러 가기</router-link>
          </div>
        </div>
      </div>
    </div>
    <!-- 하단 버튼 -->
    <div class="bottom-buttons">
      <button class="btn-logout" @click="handleLogout">↪ 로그아웃</button>
      <button class="btn-deactivate" @click="showDeactivateConfirm = true">⊗ 회원 탈퇴</button>
    </div>

    <!-- 탈퇴 확인 모달 -->
    <Modal
        v-if="showDeactivateConfirm"
        title="회원 탈퇴"
        subtitle="탈퇴 후에는 복구가 불가능합니다."
        @close="showDeactivateConfirm = false"
    >
      <p class="modal-desc">정말 탈퇴하시겠습니까?</p>
      <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>
      <template #footer>
        <button class="btn-modal-cancel" @click="showDeactivateConfirm = false">취소</button>
        <button class="btn-modal-delete" @click="handleDeactivate">탈퇴하기</button>
      </template>
    </Modal>

  </div>
</template>

<style scoped>
.mypage {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0px;
}

.content-wrapper {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

/* 왼쪽 */
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

/* 오른쪽 */
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

/* 모달 내부 */
.modal-desc {
  font-size: 14px;
  color: #555;
  margin: 0;
}

.error-msg {
  color: #E05555;
  font-size: 13px;
  margin-top: 8px;
}

.btn-modal-cancel {
  flex: 1;
  padding: 10px;
  border: 1px solid #E0E3EB;
  border-radius: 8px;
  background: #fff;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-delete {
  flex: 1;
  padding: 10px;
  background: #E05555;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-modal-delete:hover {
  background: #c94444;
}
</style>