<!-- src/views/resident/parking/VisitorVehiclesEditView.vue -->
<script setup>
import {ref} from 'vue'
import {useRouter} from 'vue-router'
import {registerVisitorVehicle} from '@/api/visitorVehicle.js'

const router = useRouter()
const loading = ref(false)   // 등록 중 버튼 비활성화용
const errorMsg = ref('')     // 에러 메시지 표시용
const successMsg = ref('')   // 성공 메시지 표시용

// 오늘 날짜 (input date의 min 속성에 넣어서 과거 날짜 선택 차단)
const today = new Date().toISOString().split('T')[0]

// 폼 데이터 (백엔드 VisitorVehicleReq와 동일한 구조)
const form = ref({
  licensePlate: '',   // 차량번호
  visitorName: '',    // 방문자 이름
  visitPurpose: '',   // 방문 목적
  visitDate: ''       // 방문 예정일
})

// 등록 버튼 클릭 시 실행
const handleSubmit = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  loading.value = true
  try {
    // POST /api/visitor-vehicles 호출
    await registerVisitorVehicle(form.value)
    successMsg.value = '방문차량이 등록되었습니다.'
    // 1초 후 목록 페이지로 이동
    setTimeout(() => router.push({name: 'VisitorVehiclesList'}), 1000)
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

        <!-- 차량번호 (필수) -->
        <div class="field">
          <label>차량번호 <span class="required">*</span></label>
          <input v-model="form.licensePlate" type="text" placeholder="예: 12가3456"/>
        </div>

        <!-- 방문자 이름 (선택) -->
        <div class="field">
          <label>방문자 이름</label>
          <input v-model="form.visitorName" type="text" placeholder="방문자 이름을 입력하세요"/>
        </div>

        <!-- 방문 목적 (선택) -->
        <div class="field">
          <label>방문 목적</label>
          <input v-model="form.visitPurpose" type="text" placeholder="방문 목적을 입력하세요"/>
        </div>

        <!-- 방문 예정일 (필수, 오늘 이후만 선택 가능) -->
        <div class="field">
          <label>방문 예정일 <span class="required">*</span></label>
          <input v-model="form.visitDate" type="date" :min="today"/>
        </div>

        <!-- 에러/성공 메시지 -->
        <p v-if="errorMsg" class="error">{{ errorMsg }}</p>
        <p v-if="successMsg" class="success">{{ successMsg }}</p>

        <!-- 하단 버튼 -->
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

/* 왼쪽 폼 */
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

.success {
  color: #2EAD5C;
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

/* 오른쪽 사이드 */
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