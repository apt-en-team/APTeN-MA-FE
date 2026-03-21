<script setup>
import BaseModal from '@/components/common/BeseModel.vue'

// 결과 모달에 표시할 데이터
const props = defineProps({
  // 메인 제목
  title: {
    type: String,
    default: '',
  },
  // 보조 제목
  subtitle: {
    type: String,
    default: '',
  },
  // 설명 문구
  desc: {
    type: String,
    default: '',
  },
  // 아이콘/색상 타입
  // success | danger | warning
  type: {
    type: String,
    default: 'success',
  },
  // 처리 대상 이름
  itemName: {
    type: String,
    default: '',
  },
  // 처리 시각
  time: {
    type: String,
    default: '',
  },
  // 처리 내용
  actionLabel: {
    type: String,
    default: '',
  },
  // 처리자
  actor: {
    type: String,
    default: '',
  },
  // 하단 확인 버튼 문구
  confirmText: {
    type: String,
    default: '확인',
  },
})

// 닫기 이벤트
const emit = defineEmits(['close'])
</script>

<template>
  <!-- 공통 베이스 모달 재사용 -->
  <BaseModal
    :title="title"
    :subtitle="subtitle"
    :hide-header="true"
    @close="$emit('close')"
  >
    <div class="result-modal-wrap">
      <!-- 결과 타입별 아이콘 -->
      <div
        class="result-icon"
        :class="{
          'result-icon-success': type === 'success',
          'result-icon-danger': type === 'danger',
          'result-icon-warning': type === 'warning',
        }"
      >
        <!-- 성공 아이콘 -->
        <svg
          v-if="type === 'success'"
          width="26"
          height="26"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M5 13L9 17L19 7"
            stroke="#4D8B5A"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>

        <!-- 실패/거부 아이콘 -->
        <svg
          v-else-if="type === 'danger'"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M18 6L6 18M6 6L18 18"
            stroke="#E53E3E"
            stroke-width="2.2"
            stroke-linecap="round"
          />
        </svg>

        <!-- 경고 아이콘 -->
        <svg
          v-else
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
        >
          <path
            d="M12 8V12"
            stroke="#C08B2D"
            stroke-width="2.2"
            stroke-linecap="round"
          />
          <circle cx="12" cy="16" r="1" fill="#C08B2D" />
          <circle cx="12" cy="12" r="9" stroke="#C08B2D" stroke-width="2" />
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
    </div>

    <!-- 하단 확인 버튼 -->
    <template #footer>
      <button class="btn-submit result-confirm-btn" @click="$emit('close')">
        {{ confirmText }}
      </button>
    </template>
  </BaseModal>
</template>

<style scoped>
.result-modal-wrap {
  padding: 20px 0;
  text-align: center;
  font-family: 'Noto Sans KR', sans-serif;
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

.result-icon-success {
  background: rgba(77, 139, 90, 0.14);
}

.result-icon-danger {
  background: rgba(229, 62, 62, 0.12);
}

.result-icon-warning {
  background: rgba(192, 139, 45, 0.14);
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

.result-confirm-btn {
  min-width: 88px;
}

.btn-submit {
  padding: 9px 24px;
  background: #2B3A55;
  color: #fff;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-submit:hover {
  background: #1E2A3E;
}
</style>