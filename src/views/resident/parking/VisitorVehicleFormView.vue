<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {registerVisitorVehicle} from '@/api/visitorVehicle.js'
import ActionResultModal from '@/components/common/ActionResultModal.vue'

const router = useRouter()
const loading = ref(false)
const errorMsg = ref('')

// 성공 모달 상태
const successModal = ref({show: false, licensePlate: ''})

const today = new Date().toISOString().split('T')[0]
const purposeTags = ['택배 수령', '친척 방문', '지인 방문', '이사 도우미', '인테리어 공사', '기타']

const form = ref({
  licensePlate: '',
  visitorName: '',
  visitPurpose: '',
  visitDate: ''
})

const selectPurposeTag = (tag) => {
  form.value.visitPurpose = form.value.visitPurpose === tag ? '' : tag
}

const handleSubmit = async () => {
  errorMsg.value = ''
  loading.value = true
  try {
    await registerVisitorVehicle(form.value)
    // 성공 → ActionResultModal 오픈
    successModal.value.licensePlate = form.value.licensePlate
    successModal.value.show = true
  } catch (error) {
    if (error.response?.status === 400) {
      errorMsg.value = '과거 날짜는 선택할 수 없습니다.'
    } else {
      errorMsg.value = '등록에 실패했습니다. 다시 시도해주세요.'
    }
  } finally {
    loading.value = false
  }
}

// 모달 확인 버튼 클릭 → 목록 페이지로 이동
const handleSuccessClose = () => {
  successModal.value.show = false
  router.push({name: 'VisitorVehiclesList'})
}
</script>

<template>
  <div class="visitor-vehicle-register">
    <div class="content-wrapper">

      <!-- 왼쪽: 등록 폼 -->
      <div class="edit-card">
        <div class="card-title">
          <h3>방문차량 등록</h3>
          <p class="subtitle">모든 * 항목은 필수 입력입니다.</p>
        </div>

        <div class="field">
          <label>차량번호 <span class="required">*</span></label>
          <input v-model="form.licensePlate" type="text" placeholder="예: 12가3456"/>
        </div>

        <div class="field">
          <label>방문자 이름</label>
          <input v-model="form.visitorName" type="text" placeholder="방문자 이름을 입력하세요"/>
        </div>

        <div class="field">
          <label>방문 목적</label>
          <input v-model="form.visitPurpose" type="text" placeholder="방문 목적을 선택하거나 직접 입력하세요"/>
          <div class="tag-list">
            <button v-for="tag in purposeTags" :key="tag"
                    :class="['tag-btn', form.visitPurpose === tag ? 'tag-active' : '']" @click="selectPurposeTag(tag)">
              {{ tag }}
            </button>
          </div>
        </div>

        <div class="field">
          <label>방문 예정일 <span class="required">*</span></label>
          <input v-model="form.visitDate" type="date" :min="today"/>
        </div>

        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>

        <div class="form-actions">
          <div class="right-actions">
            <button class="btn-cancel" @click="router.push({ name: 'VisitorVehiclesList' })">취소</button>
            <button class="btn-save" @click="handleSubmit" :disabled="loading">
              {{ loading ? '등록 중...' : '등록하기' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 오른쪽: 안내 사이드 패널 -->
      <div class="side-panel">
        <div class="notice-card">
          <h4>등록 안내</h4>
          <ul>
            <li>등록 즉시 자동 승인 처리됩니다.</li>
            <li>등록한 차량은 방문 예정일 당일에만 입차 가능합니다.</li>
            <li>출차는 날짜 제한 없이 자유롭게 가능합니다.</li>
            <li>과거 날짜는 선택할 수 없습니다.</li>
          </ul>
        </div>
      </div>

    </div>

    <!-- 등록 완료 모달: ActionResultModal (입주민 → theme="resident") -->
    <ActionResultModal
        v-if="successModal.show"
        type="success"
        title="등록 완료"
        subtitle="방문차량이 등록되었습니다"
        :item-name="successModal.licensePlate"
        action-label="방문차량 등록"
        confirm-text="확인"
        theme="resident"
        @close="handleSuccessClose"
    />
  </div>
</template>

<style scoped>
.visitor-vehicle-register {
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
  justify-content: flex-end;
  align-items: center;
  padding-top: 24px;
  margin-top: 8px;
}

.right-actions {
  display: flex;
  gap: 10px;
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

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.tag-btn {
  padding: 5px 14px;
  border: 1px solid #E0E3EB;
  border-radius: 20px;
  font-size: 12px;
  background: #fff;
  color: #687282;
  cursor: pointer;
  transition: all 0.12s;
}

.tag-btn:hover {
  background: #EEF2FF;
  border-color: #4973E5;
  color: #4973E5;
}

.tag-active {
  background: #EEF2FF;
  border-color: #4973E5;
  color: #4973E5;
  font-weight: 600;
}

.side-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.notice-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.notice-card h4 {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 16px;
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
  color: #687282;
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