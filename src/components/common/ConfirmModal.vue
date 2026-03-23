<script setup>
defineProps({
  title: {type: String, default: "확인하시겠습니까?"},
  subtitle: {type: String, default: ""},
  subtitleColor: {type: String, default: "#757575"},
  itemName: {type: String, default: ""},
  itemLabel: {type: String, default: "처리 항목"},
  actionLabel: {type: String, default: ""},
  actionText: {type: String, default: "처리 내용"},
  extraValue: {type: String, default: ""},
  extraLabel: {type: String, default: ""},
  confirmText: {type: String, default: "확인"},
  cancelText: {type: String, default: "취소"},
  confirmType: {type: String, default: "danger"},
  loading: {type: Boolean, default: false},
  // 'admin'    → 버튼 네이비(#2B3A55) / 경고 아이콘 #C08B2D / 배경 rgba(192,139,45,0.14)
  // 'resident' → 버튼 파랑(#4973E5)  / 경고 아이콘 #ED8936 / 배경 #FFFBEB
  theme: {type: String, default: "admin"},
})

defineEmits(["confirm", "cancel"])
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('cancel')">
    <div class="modal-box">

      <!-- 아이콘: confirmType에 따라 분기 -->
      <div
          class="confirm-icon"
          :style="{
      background: confirmType === 'success' ? '#F0FFF4'
                : confirmType === 'danger' ? '#FFF5F5'
                : '#FFF5F5'
    }"
      >
        <!-- success: 체크 아이콘 -->
        <svg v-if="confirmType === 'success'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="9" stroke="#38A169" stroke-width="2"/>
          <path d="M7.5 12L10.5 15L16.5 9" stroke="#38A169" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>

        <!-- danger: 경고 아이콘 -->
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 8V12" stroke="#E53E3E" stroke-width="2.2" stroke-linecap="round"/>
          <circle cx="12" cy="16" r="1" fill="#E53E3E"/>
          <circle cx="12" cy="12" r="9" stroke="#E53E3E" stroke-width="2"/>
        </svg>
      </div>

      <!-- 제목 / 부제목 -->
      <h3 class="confirm-title">{{ title }}</h3>
      <p v-if="subtitle" class="confirm-subtitle" :style="{ color: subtitleColor }">
        {{ subtitle }}
      </p>

      <!-- 처리 정보 -->
      <div v-if="itemName || actionLabel || extraValue" class="confirm-info-box">
        <div v-if="itemName" class="confirm-info-row">
          <span class="confirm-info-label">{{ itemLabel }}</span>
          <span class="confirm-info-value">{{ itemName }}</span>
        </div>
        <div v-if="actionLabel" class="confirm-info-row">
          <span class="confirm-info-label">{{ actionText }}</span>
          <span class="confirm-info-value">{{ actionLabel }}</span>
        </div>
        <div v-if="extraValue" class="confirm-info-row">
          <span class="confirm-info-label">{{ extraLabel }}</span>
          <span class="confirm-info-value">{{ extraValue }}</span>
        </div>
      </div>

      <!-- 슬롯: 거부 사유 등 추가 컨텐츠 -->
      <slot/>

      <!-- 버튼 (가운데 정렬) -->
      <div class="confirm-footer">
        <button class="btn-cancel" @click="$emit('cancel')">{{ cancelText }}</button>
        <button
            :class="['btn-confirm', `btn-confirm--${confirmType}`]"
            :style="confirmType === 'primary'
            ? { background: theme === 'resident' ? '#4973E5' : '#2B3A55' }
            : {}"
            @click="$emit('confirm')"
            :disabled="loading"
        >
          {{ loading ? "처리 중..." : confirmText }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  padding: 32px 28px 24px;
  width: 420px;
  max-width: 90vw;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.18);
}

.confirm-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-title {
  font-size: 17px;
  font-weight: 700;
  color: #1a202c;
  margin-bottom: 6px;
}

.confirm-subtitle {
  font-size: 13px;
  margin-bottom: 20px;
}

.confirm-info-box {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  text-align: left;
  margin-bottom: 20px;
}

.confirm-info-row {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
}

.confirm-info-row:last-child {
  border-bottom: none;
}

.confirm-info-label {
  font-size: 12px;
  color: #94a3b8;
}

.confirm-info-value {
  font-size: 13px;
  font-weight: 600;
  color: #1a202c;
  text-align: right;
}

/* 버튼 가운데 정렬 */
.confirm-footer {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 4px;
}

.btn-cancel {
  padding: 10px 28px;
  border: 1px solid #e2e8f0;
  border-radius: 7px;
  background: #fff;
  font-size: 13px;
  color: #718096;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #f5f6f8;
}

.btn-confirm {
  padding: 10px 28px;
  border: none;
  border-radius: 7px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-confirm:disabled {
  opacity: 0.5;
  cursor: default;
}

.btn-confirm--danger {
  background: #e53e3e;
  color: #fff;
}

.btn-confirm--danger:hover:not(:disabled) {
  background: #c53030;
}

.btn-confirm--success {
  background: #1E2A3E;
  color: #fff;
}

.btn-confirm--success:hover:not(:disabled) {
  background: #151f2e;
}

.btn-confirm--primary {
  color: #fff;
}

.btn-confirm--primary:hover:not(:disabled) {
  filter: brightness(0.88);
}
</style>