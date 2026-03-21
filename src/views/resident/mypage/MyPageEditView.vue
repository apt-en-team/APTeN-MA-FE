<script setup>
import {ref, onMounted} from 'vue'
import {useRouter} from 'vue-router'
import {useAuthStore} from '@/stores/modules/auth.js'
import api from '@/api/axios.js'
// 탈퇴 확인 모달 → ConfirmModal
import ConfirmModal from '@/components/common/ConfirmModal.vue'
// 수정 완료 결과 모달 → ActionResultModal
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const auth = useAuthStore()

const form = ref({name: '', phone: ''})
const errorMsg = ref('')
const loading = ref(false)

// 탈퇴 확인 모달
const showDeleteConfirm = ref(false)

// 수정 완료 모달
const showSuccessModal = ref(false)

onMounted(async () => {
  await auth.fetchMe()
  form.value.name = auth.user?.name || ''
  form.value.phone = auth.user?.phone || ''
})

// 내 정보 수정 (PUT /api/users/me)
async function handleUpdate() {
  errorMsg.value = ''
  if (!form.value.name) {
    errorMsg.value = '이름을 입력해주세요';
    return
  }
  if (!form.value.phone) {
    errorMsg.value = '전화번호를 입력해주세요';
    return
  }

  loading.value = true
  try {
    await api.put('/users/me', {name: form.value.name, phone: form.value.phone})
    await auth.fetchMe()
    // 성공 → ActionResultModal 오픈
    showSuccessModal.value = true
  } catch (e) {
    errorMsg.value = e.response?.data?.resultMessage || '수정에 실패했습니다'
  }
  loading.value = false
}

// 수정 완료 모달 확인 → 마이페이지로 이동
const handleSuccessClose = () => {
  showSuccessModal.value = false
  router.push('/resident/mypage')
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
  <div class="mypage-edit">
    <div class="content-wrapper">

      <!-- 왼쪽: 수정 폼 -->
      <div class="edit-card">
        <div class="card-title">
          <h3>내 정보 수정</h3>
          <p class="subtitle">모든 * 항목은 필수 입력입니다.</p>
        </div>

        <div class="field">
          <label>입주자 <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="이름을 입력하세요"/>
        </div>

        <div class="field">
          <label>전화번호 <span class="required">*</span></label>
          <input v-model="form.phone" type="text" placeholder="010-0000-0000"/>
        </div>

        <div class="field">
          <label>이메일</label>
          <input :value="auth.user?.email || '-'" type="text" readonly class="readonly"/>
        </div>

        <div class="field-row">
          <div class="field">
            <label>동</label>
            <input :value="auth.user?.dong || '-'" type="text" readonly class="readonly"/>
          </div>
          <div class="field">
            <label>호수</label>
            <input :value="auth.user?.ho || '-'" type="text" readonly class="readonly"/>
          </div>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <div class="form-actions">
          <button class="btn-delete" @click="showDeleteConfirm = true">삭제</button>
          <div class="right-actions">
            <button class="btn-cancel" @click="router.push('/resident/mypage')">취소</button>
            <button class="btn-save" @click="handleUpdate" :disabled="loading">
              {{ loading ? '저장 중...' : '수정완료' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 오른쪽 사이드 -->
      <div class="side-panel">
        <div class="info-card">
          <h4>현재 정보</h4>
          <div class="current-profile">
            <div class="avatar">{{ auth.user?.name?.charAt(0) || '?' }}</div>
            <div class="profile-info">
              <p class="profile-name">{{ auth.user?.name || '-' }}</p>
              <p class="profile-household">
                <span class="dot green"></span>
                {{ auth.user?.dong && auth.user?.ho ? `${auth.user.dong} ${auth.user.ho}` : '-' }}
              </p>
            </div>
            <span class="badge-approved">인증 완료</span>
          </div>
          <div class="current-list">
            <div class="current-item">
              <span class="current-label">전화 번호</span>
              <span class="current-value">{{ auth.user?.phone || '-' }}</span>
            </div>
            <div class="current-item">
              <span class="current-label">이메일</span>
              <span class="current-value email">{{ auth.user?.email || '-' }}</span>
            </div>
          </div>
        </div>

        <div class="notice-card">
          <h4>수정 주의사항</h4>
          <ul>
            <li>이름과 전화번호만 수정 가능합니다.</li>
            <li>동/호수 변경은 관리자에게 문의하세요.</li>
            <li>이메일은 변경할 수 없습니다.</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- 수정 완료 모달: ActionResultModal (입주민 → theme="resident") -->
    <ActionResultModal
        v-if="showSuccessModal"
        type="success"
        title="수정 완료"
        subtitle="내 정보가 수정되었습니다"
        :item-name="form.name"
        action-label="정보 수정"
        confirm-text="확인"
        theme="resident"
        @close="handleSuccessClose"
    />

    <!-- 탈퇴 확인 모달: ConfirmModal (입주민 → theme="resident") -->
    <ConfirmModal
        v-if="showDeleteConfirm"
        title="정말 탈퇴하시겠습니까?"
        subtitle="탈퇴 후에는 복구가 불가능합니다."
        subtitle-color="#E53E3E"
        item-label="계정"
        :item-name="auth.user?.email || '-'"
        confirm-text="탈퇴하기"
        confirm-type="danger"
        theme="resident"
        @confirm="handleDeactivate"
        @cancel="showDeleteConfirm = false"
    />

  </div>
</template>

<style scoped>
.mypage-edit {
  padding: 0px;
  min-height: 100vh;
}

.content-wrapper {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}

.edit-card {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.card-title {
  margin-bottom: 28px;
}

.card-title h3 {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 4px;
}

.subtitle {
  font-size: 13px;
  color: #aaa;
  margin: 0;
}

.field {
  margin-bottom: 20px;
}

.field label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
}

.field input {
  width: 100%;
  padding: 11px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 10px;
  font-size: 14px;
  color: #1A1A2E;
  box-sizing: border-box;
  transition: border-color 0.15s;
}

.field input:focus {
  outline: none;
  border-color: #4973E5;
}

.field input.readonly {
  background: #F8F9FC;
  color: #999;
}

.field-row {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
}

.field-row .field {
  flex: 1;
  margin-bottom: 0;
}

.required {
  color: #E05555;
}

.error {
  color: #E05555;
  font-size: 13px;
  margin-bottom: 12px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 24px;
  border-top: 1px solid #F0F1F5;
  margin-top: 8px;
}

.right-actions {
  display: flex;
  gap: 10px;
}

.btn-delete {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #FFCDD2;
  border-radius: 10px;
  color: #E05555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-delete:hover {
  background: #FFF5F5;
}

.btn-cancel {
  padding: 10px 20px;
  background: #fff;
  border: 1px solid #E0E3EB;
  border-radius: 10px;
  color: #555;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #F5F6FA;
}

.btn-save {
  padding: 10px 24px;
  background: #4973E5;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-save:hover {
  background: #3a5bd9;
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.side-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card, .notice-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.info-card h4, .notice-card h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 16px;
}

.current-profile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 14px;
  border-bottom: 1px solid #F0F1F5;
  margin-bottom: 14px;
}

.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #E8EEFF;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 700;
  color: #4973E5;
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 2px;
}

.profile-household {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #999;
  margin: 0;
}

.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot.green {
  background: #2EAD5C;
}

.badge-approved {
  background: #E6F9EE;
  color: #2EAD5C;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  white-space: nowrap;
}

.current-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.current-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.current-label {
  font-size: 12px;
  color: #aaa;
  flex-shrink: 0;
}

.current-value {
  font-size: 13px;
  font-weight: 500;
  color: #333;
  text-align: right;
  word-break: break-all;
}

.notice-card ul {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.notice-card ul li {
  font-size: 12px;
  color: #888;
  padding-left: 14px;
  position: relative;
  line-height: 1.5;
}

.notice-card ul li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4973E5;
}
</style>