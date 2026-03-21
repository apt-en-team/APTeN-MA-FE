<script setup>
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { registerFixedVisitorVehicle } from '@/api/visitorVehicle.js'

const router = useRouter()

const form = reactive({
  vehicleNumber: '',
  visitorName: '',
  purpose: '',
  startDate: '',
  endDate: '',
})

const error = reactive({
  vehicleNumber: '',
  visitorName: '',
  purpose: '',
  startDate: '',
})

// 오늘 날짜 (시작일 min)
const today = new Date().toISOString().slice(0, 10)

// 고정 방문차량 특성에 맞는 방문 목적 태그
const purposeTags = ['정기 배송', '시설 관리', '청소 업체', '경비 업체', '친인척 방문', '기타']

// 태그 클릭 시 폼에 반영 (이미 선택된 태그 클릭 시 해제)
const selectPurposeTag = (tag) => {
  form.purpose = form.purpose === tag ? '' : tag
}

// 유효성 검사
const validate = () => {
  let isValid = true
  error.vehicleNumber = ''
  error.visitorName = ''
  error.purpose = ''
  error.startDate = ''

  if (!form.vehicleNumber.trim()) {
    error.vehicleNumber = '차량번호를 입력해주세요.'
    isValid = false
  }
  if (!form.visitorName.trim()) {
    error.visitorName = '방문자 이름을 입력해주세요.'
    isValid = false
  }
  if (!form.purpose.trim()) {
    error.purpose = '방문 목적을 입력해주세요.'
    isValid = false
  }
  if (!form.startDate) {
    error.startDate = '시작일을 선택해주세요.'
    isValid = false
  }
  return isValid
}

// 등록 (API-062)
const handleSubmit = async () => {
  if (!validate()) return
  try {
    await registerFixedVisitorVehicle({
      vehicleNumber: form.vehicleNumber,
      visitorName: form.visitorName,
      purpose: form.purpose,
      startDate: form.startDate,
      endDate: form.endDate || null,
    })
    router.push('/resident/visitor-vehicles/fixed')
  } catch (e) {
    console.error('고정 방문차량 등록 실패', e)
  }
}

// 취소
const handleCancel = () => {
  router.push('/resident/visitor-vehicles/fixed')
}
</script>

<template>
  <div class="page-layout">

    <!-- ── 등록 폼 ── -->
    <div class="main-content">
      <div class="card">
        <h2 class="card-title">고정 방문차량 등록</h2>
        <p class="card-sub">모든 * 항목은 필수 입력입니다.</p>

        <div class="form-body">

          <!-- 차량번호 -->
          <div class="form-group">
            <label class="form-label">차량번호 <span class="required">*</span></label>
            <input
                class="form-input"
                :class="{ error: error.vehicleNumber }"
                type="text"
                placeholder="예: 12가3456"
                v-model="form.vehicleNumber"
            />
            <p v-if="error.vehicleNumber" class="error-msg">{{ error.vehicleNumber }}</p>
          </div>

          <!-- 방문자 이름 -->
          <div class="form-group">
            <label class="form-label">방문자 이름 <span class="required">*</span></label>
            <input
                class="form-input"
                :class="{ error: error.visitorName }"
                type="text"
                placeholder="방문자 이름을 입력하세요"
                v-model="form.visitorName"
            />
            <p v-if="error.visitorName" class="error-msg">{{ error.visitorName }}</p>
          </div>

          <!-- 방문 목적 (태그 선택 or 직접 입력) -->
          <div class="form-group">
            <label class="form-label">방문 목적 <span class="required">*</span></label>
            <input
                class="form-input"
                :class="{ error: error.purpose }"
                type="text"
                placeholder="방문 목적을 선택하거나 직접 입력하세요"
                v-model="form.purpose"
            />
            <!-- 빠른 선택 태그 -->
            <div class="tag-list">
              <button
                  v-for="tag in purposeTags"
                  :key="tag"
                  :class="['tag-btn', form.purpose === tag ? 'tag-active' : '']"
                  @click="selectPurposeTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
            <p v-if="error.purpose" class="error-msg">{{ error.purpose }}</p>
          </div>

          <!-- 시작일 / 종료일 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">시작일 <span class="required">*</span></label>
              <input
                  class="form-input"
                  :class="{ error: error.startDate }"
                  type="date"
                  :min="today"
                  v-model="form.startDate"
              />
              <p v-if="error.startDate" class="error-msg">{{ error.startDate }}</p>
            </div>

            <div class="form-group">
              <label class="form-label">
                종료일
                <span class="optional">(미입력 시 무기한)</span>
              </label>
              <input
                  class="form-input"
                  type="date"
                  :min="form.startDate || today"
                  v-model="form.endDate"
              />
            </div>
          </div>

        </div>

        <!-- 버튼 -->
        <div class="form-actions">
          <button class="btn-cancel" @click="handleCancel">취소</button>
          <button class="btn-submit" @click="handleSubmit">등록하기</button>
        </div>

      </div>
    </div>

    <!-- ── 안내 사이드 카드 ── -->
    <div class="side-panel">
      <div class="info-card">
        <h3 class="info-title">등록 안내</h3>
        <ul class="info-list">
          <li>등록 즉시 고정 방문차량으로 승인됩니다.</li>
          <li>시작일부터 종료일까지 입차가 허용됩니다.</li>
          <li>종료일 미입력 시 무기한으로 등록됩니다.</li>
          <li>과거 날짜는 선택할 수 없습니다.</li>
        </ul>
      </div>
    </div>

  </div>
</template>

<style scoped>
* { box-sizing: border-box; margin: 0; padding: 0; }

.page-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
  color: #333;
}

/* ── 메인 카드 ── */
.main-content { flex: 1; min-width: 0; }

.card {
  background: #fff;
  border-radius: 16px;
  padding: 32px 36px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.card-title { font-size: 18px; font-weight: 700; color: #1A1A2E; }
.card-sub { font-size: 13px; color: #999; margin-top: -16px; }

/* ── 폼 ── */
.form-body {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-label { font-size: 13px; font-weight: 600; color: #2D3748; }
.required { color: #E53E3E; margin-left: 2px; }
.optional { font-size: 11px; font-weight: 400; color: #687282; margin-left: 4px; }

.form-input {
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  color: #2D3748;
  outline: none;
  background: #fff;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #4973E5; }
.form-input.error { border-color: #E53E3E; }

.error-msg { font-size: 11px; color: #E53E3E; }

/* ── 방문 목적 태그 ── */
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 4px;
}

.tag-btn {
  padding: 5px 14px;
  border: 1px solid #E2E8F0;
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

/* ── 버튼 ── */
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.btn-cancel {
  background: #fff; color: #687282;
  border: 1px solid #E2E8F0;
  border-radius: 8px; padding: 10px 20px;
  font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-cancel:hover { background: #F5F6FA; }

.btn-submit {
  background: #4973E5; color: #fff;
  border: none; border-radius: 8px;
  padding: 10px 24px; font-size: 13px; font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-submit:hover { background: #3560d4; }

/* ── 사이드 안내 ── */
.side-panel {
  width: 220px; min-width: 220px;
}

.info-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-title {
  font-size: 14px;
  font-weight: 700;
  color: #1A1A2E;
}

.info-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-list li {
  font-size: 12px;
  color: #687282;
  line-height: 1.5;
  padding-left: 14px;
  position: relative;
}

.info-list li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #4973E5;
  font-weight: 700;
}
</style>