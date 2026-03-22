<script setup>
import {computed} from 'vue'
import BaseModal from '@/components/common/BeseModel.vue'

const props = defineProps({
  title: {type: String, default: ''},
  subtitle: {type: String, default: ''},
  desc: {type: String, default: ''},
  // success | danger | warning
  type: {type: String, default: 'success'},
  itemName: {type: String, default: ''},
  time: {type: String, default: ''},
  actionLabel: {type: String, default: ''},
  actor: {type: String, default: ''},
  confirmText: {type: String, default: '확인'},
  // 'admin'    → 버튼 네이비(#2B3A55) / 성공 아이콘 #4D8B5A / 배경 rgba(77,139,90,0.14)
  // 'resident' → 버튼 파랑(#4973E5)  / 성공 아이콘 #48BB78 / 배경 #C6F6D5
  theme: {type: String, default: 'admin'},
})

defineEmits(['close'])

// theme에 따라 버튼 색 결정
const btnColor = computed(() =>
    props.theme === 'resident' ? '#4973E5' : '#2B3A55'
)

// 성공 아이콘 색
const successColor = computed(() =>
    props.theme === 'resident' ? '#48BB78' : '#4D8B5A'
)

// 성공 아이콘 배경색
const successBg = computed(() =>
    props.theme === 'resident' ? '#C6F6D5' : 'rgba(77, 139, 90, 0.14)'
)

// 경고 아이콘 색
const warningColor = computed(() =>
    props.theme === 'resident' ? '#E53E3E' : '#E53E3E'
)

// 경고 아이콘 배경색
const warningBg = computed(() =>
    props.theme === 'resident' ? '#FFF5F5' : '#FFF5F5'
)
</script>

<template>
  <!-- hideFooter: true → body 안에 버튼 직접 배치 → 가운데 정렬 -->
  <BaseModal :title="title" :subtitle="subtitle" :hide-header="true" :hide-footer="true" @close="$emit('close')">
    <div class="result-modal-wrap">

      <!-- 결과 타입별 아이콘 -->
      <div
          class="result-icon"
          :style="{
          background: type === 'success' ? successBg
                    : type === 'danger'  ? 'rgba(229, 62, 62, 0.12)'
                    : warningBg
        }"
      >
        <!-- 성공 아이콘: theme에 따라 색상 분기 -->
        <svg v-if="type === 'success'" width="26" height="26" viewBox="0 0 24 24" fill="none">
          <path
              d="M5 13L9 17L19 7"
              :stroke="successColor"
              stroke-width="2.2"
              stroke-linecap="round"
              stroke-linejoin="round"
          />
        </svg>

        <!-- 실패/거부 아이콘: 공통 빨강 -->
        <svg v-else-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6L18 18" stroke="#E53E3E" stroke-width="2.2" stroke-linecap="round"/>
        </svg>

        <!-- 경고 아이콘: theme에 따라 색상 분기 -->
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path
              d="M12 8V12"
              :stroke="warningColor"
              stroke-width="2.2"
              stroke-linecap="round"
          />
          <circle cx="12" cy="16" r="1" :fill="warningColor"/>
          <circle cx="12" cy="12" r="9" :stroke="warningColor" stroke-width="2"/>
        </svg>
      </div>

      <!-- 제목/설명 -->
      <h3 class="result-title">{{ title }}</h3>
      <p v-if="subtitle" class="result-subtitle">{{ subtitle }}</p>
      <p v-if="desc" class="result-desc">{{ desc }}</p>

      <!-- 정보 영역 -->
      <div v-if="itemName || time || actionLabel || actor" class="result-info-box">
        <div v-if="itemName" class="result-info-row">
          <span class="result-info-label">처리 항목</span>
          <span class="result-info-value">{{ itemName }}</span>
        </div>
        <div v-if="time" class="result-info-row">
          <span class="result-info-label">처리 시각</span>
          <span class="result-info-value">{{ time }}</span>
        </div>
        <div v-if="actionLabel" class="result-info-row">
          <span class="result-info-label">처리 내용</span>
          <span class="result-info-value">{{ actionLabel }}</span>
        </div>
        <div v-if="actor" class="result-info-row">
          <span class="result-info-label">처리자</span>
          <span class="result-info-value">{{ actor }}</span>
        </div>
      </div>

      <!-- 확인 버튼: body 안에 배치 → 가운데 정렬, theme 색상 적용 -->
      <button class="btn-confirm" :style="{ background: btnColor }" @click="$emit('close')">
        {{ confirmText }}
      </button>
    </div>
  </BaseModal>
</template>

<style scoped>
.result-modal-wrap {
  padding: 20px 0 0;
  text-align: center;
}

.result-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.result-title {
  font-size: 17px;
  font-weight: 700;
  color: #1A202C;
  margin-bottom: 6px;
}

.result-subtitle {
  font-size: 13px;
  color: #757575;
  margin-bottom: 4px;
}

.result-desc {
  font-size: 12px;
  color: #BDBDBD;
  margin-bottom: 16px;
}

.result-info-box {
  background: #F8FAFC;
  border: 1px solid #E2E8F0;
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
  margin: 16px 0 0;
}

.result-info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #E2E8F0;
}

.result-info-row:last-child {
  border-bottom: none;
}

.result-info-label {
  font-size: 12px;
  color: #94A3B8;
}

.result-info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1A202C;
  text-align: right;
}

.btn-confirm {
  display: inline-block;
  margin: 20px auto 0;
  padding: 10px 48px;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: filter 0.15s;
}

.btn-confirm:hover {
  filter: brightness(0.88);
}
</style>